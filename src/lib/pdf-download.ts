import type { BillData } from "@/types/bill";
import { renderInvoicePDF, type DocumentType } from "@/lib/pdf-generator";

/**
 * Generate and download a PDF invoice.
 *
 * The renderer is built on `pdf-lib`, which draws with the standard-14 PDF fonts
 * — no megabytes of embedded font data — so the whole module is light. It is
 * still imported dynamically from the browser (see the call site on the invoice
 * page) so the drawing code stays in a browser chunk and out of the Cloudflare
 * Worker server bundle.
 */
export async function generatePDF(billData: BillData, documentType: DocumentType = "invoice"): Promise<void> {
    const bytes = await renderInvoicePDF(billData, documentType);

    const prefix = documentType === "credit-note" ? "Credit_Note" : "Invoice";
    const fileName = `${prefix}_${billData.invoiceNumber || "draft"}.pdf`;

    // Copy into a fresh ArrayBuffer so the Blob gets an ArrayBuffer, not the
    // Uint8Array's possibly-larger backing buffer.
    const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    try {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        URL.revokeObjectURL(url);
    }
}
