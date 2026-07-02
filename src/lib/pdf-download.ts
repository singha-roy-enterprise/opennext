import type { BillData } from "@/types/bill";
import { generateDocumentDefinition, type DocumentType } from "@/lib/pdf-generator";

/**
 * Generate and download a PDF invoice.
 *
 * This module — and the heavy `pdfmake` dependency plus its ~1 MiB of embedded
 * fonts — is imported dynamically from the browser (see the call site in the
 * invoice page). Keeping pdfmake behind a dynamic-import boundary that the
 * server-rendered module graph never statically reaches ensures it stays out of
 * the Cloudflare Worker bundle, which must fit under the Worker size limit.
 */
export async function generatePDF(billData: BillData, documentType: DocumentType = "invoice"): Promise<void> {
    const [pdfMakeModule, vfsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);

    // pdfmake ships as CJS/UMD; depending on the bundler it lands on the module
    // namespace directly or under `.default`. Handle both.
    type PdfMakeStatic = typeof import("pdfmake/build/pdfmake");
    const pdfMake: PdfMakeStatic = (pdfMakeModule as unknown as { default?: PdfMakeStatic }).default ?? pdfMakeModule;

    pdfMake.addVirtualFileSystem(vfsModule.default);

    const docDefinition = generateDocumentDefinition(billData, documentType);
    const prefix = documentType === "credit-note" ? "Credit_Note" : "Invoice";
    const fileName = `${prefix}_${billData.invoiceNumber || "draft"}.pdf`;

    pdfMake.createPdf(docDefinition).download(fileName);
}
