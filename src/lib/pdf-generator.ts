import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { BillData } from "@/types/bill";
import { formatAmountInWords } from "@/lib/number-to-words";
import { singhaRoyEnterpriseLogo } from "@/assets/singha-roy-enterprise-logo";

export type DocumentType = "invoice" | "credit-note";

/**
 * Field error type for validation
 */
export type FieldErrors = Record<string, string>;

/**
 * Format a date to DD-MM-YYYY format for the PDF
 */
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Format a number with Indian locale
 */
function formatNumber(value: number): string {
    return value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function hardBreakText(text: string, maxChars: number = 20): string {
    return text
        .split(" ")
        .map((word) =>
            word.length > maxChars ? word.match(new RegExp(`.{1,${maxChars}}`, "g"))!.join("-​") : word,
        )
        .join(" ");
}

/**
 * Generate PDF document definition for pdfmake
 */
function generateDocumentDefinition(billData: BillData, documentType: DocumentType): TDocumentDefinitions {
    const { businessDetails, customerDetails, items, totals, invoiceNumber, date } = billData;

    // Filter out empty items for PDF
    const filledItems = items.filter((item) => item.description.trim() || item.hsnSac.trim() || item.taxableValue > 0);

    // Build customer address string
    const customerAddress = [
        customerDetails.address.line1,
        customerDetails.address.line2,
        customerDetails.address.pin
            ? `${customerDetails.address.city} - ${customerDetails.address.pin}`
            : customerDetails.address.city,
        customerDetails.address.state,
    ]
        .filter(Boolean)
        .join("\n");

    // Build business address string
    const businessAddress = [
        businessDetails.address.line1,
        businessDetails.address.line2,
        `${businessDetails.address.city} - ${businessDetails.address.pin}`,
        businessDetails.address.state,
    ]
        .filter(Boolean)
        .join("\n");

    // Table header
    const tableHeader: TableCell[] = [
        { text: "S.No.", style: "tableHeader", alignment: "center" },
        { text: "Description of goods", style: "tableHeader" },
        { text: "HSN/SAC", style: "tableHeader", alignment: "center" },
        { text: "Qty", style: "tableHeader", alignment: "right" },
        { text: "Rate", style: "tableHeader", alignment: "right" },
        { text: "Taxable value", style: "tableHeader", alignment: "right" },
        { text: "CGST", style: "tableHeader", alignment: "right" },
        { text: "SGST", style: "tableHeader", alignment: "right" },
        { text: "Amount", style: "tableHeader", alignment: "right" },
    ];

    // Table body rows
    const tableBody: TableCell[][] = filledItems.map((item, index) => [
        { text: (index + 1).toString(), alignment: "center" },
        { text: hardBreakText(item.description) },
        { text: item.hsnSac, alignment: "center" },
        { text: item.quantity?.toString() || "0", alignment: "right" },
        { text: formatNumber(item.rate || 0), alignment: "right" },
        { text: formatNumber(item.taxableValue), alignment: "right" },
        {
            text: `${formatNumber(item.cgstAmount)}\n(${item.cgstPercent}%)`,
            alignment: "right",
            fontSize: 8,
        },
        {
            text: `${formatNumber(item.sgstAmount)}\n(${item.sgstPercent}%)`,
            alignment: "right",
            fontSize: 8,
        },
        { text: formatNumber(item.totalAmount), alignment: "right", bold: true },
    ]);

    // Totals row
    const totalsRow: TableCell[] = [
        { text: "", colSpan: 5, border: [true, true, false, true] },
        {},
        {},
        {},
        {},
        {
            text: formatNumber(totals.totalTaxableValue),
            alignment: "right",
            bold: true,
        },
        { text: formatNumber(totals.totalCgst), alignment: "right", bold: true },
        { text: formatNumber(totals.totalSgst), alignment: "right", bold: true },
        { text: formatNumber(totals.grandTotal), alignment: "right", bold: true },
    ];

    const content: Content = [
        // Header section
        {
            columns: [
                // Left: Logo and business name
                {
                    width: "auto",
                    svg: singhaRoyEnterpriseLogo,
                    fit: [50, 49],
                    margin: [0, 0, 10, 0],
                } as unknown as Content,
                {
                    width: "*",
                    stack: [
                        {
                            text: businessDetails.name,
                            style: "header",
                            margin: [0, 0, 0, 5],
                        },
                        {
                            text: `${businessDetails.phones.join(", ")}\n${businessDetails.email}\nGST No: ${businessDetails.gstNo}`,
                            style: "subheader",
                        },
                    ],
                },
                // Right: Invoice info
                {
                    width: "auto",
                    stack: [
                        {
                            text:
                                documentType === "credit-note"
                                    ? `CREDIT NOTE #${invoiceNumber}`
                                    : `INVOICE #${invoiceNumber}`,
                            style: "invoiceNumber",
                            alignment: "right",
                        },
                        {
                            text: `Date: ${formatDate(date)}`,
                            style: "invoiceDate",
                            alignment: "right",
                            margin: [0, 5, 0, 0],
                        },
                    ],
                },
            ],
            margin: [0, 0, 0, 20],
        },

        // Customer and Business Details section
        {
            columns: [
                // Order From (Customer)
                {
                    width: "50%",
                    stack: [
                        { text: "Bill To:", style: "sectionTitle", margin: [0, 0, 0, 5] },
                        {
                            text: customerDetails.name,
                            bold: true,
                            margin: [0, 0, 0, 3],
                        },
                        { text: customerAddress, fontSize: 9 },
                        customerDetails.phone
                            ? { text: `Phone: ${customerDetails.phone}`, fontSize: 9, margin: [0, 3, 0, 0] }
                            : { text: "" },
                        customerDetails.gstNo
                            ? { text: `GST No: ${customerDetails.gstNo}`, fontSize: 9, margin: [0, 3, 0, 0] }
                            : { text: "" },
                    ],
                    margin: [0, 0, 10, 0],
                },
                // From (Business)
                {
                    width: "50%",
                    stack: [
                        { text: "From:", style: "sectionTitle", margin: [0, 0, 0, 5] },
                        {
                            text: businessDetails.name,
                            bold: true,
                            margin: [0, 0, 0, 3],
                        },
                        { text: businessAddress, fontSize: 9 },
                        { text: `Phone: ${businessDetails.phones.join(", ")}`, fontSize: 9, margin: [0, 3, 0, 0] },
                        { text: `Email: ${businessDetails.email}`, fontSize: 9, margin: [0, 3, 0, 0] },
                        { text: `GST No: ${businessDetails.gstNo}`, fontSize: 9, margin: [0, 3, 0, 0] },
                    ],
                },
            ],
            margin: [0, 0, 0, 20],
        },

        // Items table
        {
            table: {
                headerRows: 1,
                widths: [20, "*", 45, 20, 50, 55, 40, 40, 55],
                body: [tableHeader, ...tableBody, totalsRow],
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => "#CCCCCC",
                vLineColor: () => "#CCCCCC",
                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 3,
                paddingBottom: () => 3,
            },
            margin: [0, 0, 0, 20],
        },

        // Amount in words
        {
            text: [
                { text: "Amount Chargeable (in words):\n", bold: true, fontSize: 9 },
                { text: formatAmountInWords(totals.grandTotal), fontSize: 10, italics: true },
            ],
            margin: [0, 0, 0, 40],
        },

        // Footer with bank details and signature
        {
            columns: [
                // Left: Bank Details
                {
                    width: "auto",
                    stack: [
                        { text: "Bank Details:", bold: true, fontSize: 9, margin: [0, 0, 0, 4] },
                        {
                            table: {
                                widths: ["auto", "auto", "auto"],
                                body: [
                                    [
                                        { text: "Bank Name", fontSize: 9 },
                                        { text: ":", fontSize: 9 },
                                        { text: "Indian Overseas Bank", fontSize: 9 },
                                    ],
                                    [
                                        { text: "Banking Name", fontSize: 9 },
                                        { text: ":", fontSize: 9 },
                                        { text: "SINGHA ROY ENTERPRISE", fontSize: 9 },
                                    ],
                                    [
                                        { text: "A/c No.", fontSize: 9 },
                                        { text: ":", fontSize: 9 },
                                        { text: "324502000000147", fontSize: 9 },
                                    ],
                                    [
                                        { text: "Branch & IFSC Code", fontSize: 9 },
                                        { text: ":", fontSize: 9 },
                                        { text: "BALURGHAT & IOBA0003245", fontSize: 9 },
                                    ],
                                ],
                            },
                            layout: "noBorders",
                        },
                    ],
                },
                // Right: Signature
                {
                    width: "*",
                    stack: [
                        {
                            text: `For - ${businessDetails.name}`,
                            alignment: "right",
                            margin: [0, 0, 0, 40],
                        },
                        {
                            text: "Authorized Signature",
                            alignment: "right",
                        },
                    ],
                },
            ],
        },
    ];

    return {
        content,
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            subheader: {
                fontSize: 9,
                color: "#666666",
            },
            invoiceNumber: {
                fontSize: 12,
                bold: true,
            },
            invoiceDate: {
                fontSize: 10,
            },
            sectionTitle: {
                fontSize: 10,
                bold: true,
                color: "#333333",
            },
            tableHeader: {
                fontSize: 8,
                bold: true,
                fillColor: "#f0f0f0",
            },
        },
        defaultStyle: {
            fontSize: 9,
        },
    };
}

/**
 * Generate and download a PDF invoice.
 *
 * pdfmake is imported lazily so its browser-only code never runs during SSR —
 * this only executes in response to a user action in the browser.
 */
export async function generatePDF(billData: BillData, documentType: DocumentType = "invoice"): Promise<void> {
    const [pdfMakeModule, vfsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);

    // pdfmake ships as CJS/UMD; depending on the bundler it lands on the module
    // namespace directly or under `.default`. Handle both.
    type PdfMakeStatic = typeof import("pdfmake/build/pdfmake");
    const pdfMake: PdfMakeStatic =
        (pdfMakeModule as unknown as { default?: PdfMakeStatic }).default ?? pdfMakeModule;

    pdfMake.addVirtualFileSystem(vfsModule.default);

    const docDefinition = generateDocumentDefinition(billData, documentType);
    const prefix = documentType === "credit-note" ? "Credit_Note" : "Invoice";
    const fileName = `${prefix}_${billData.invoiceNumber || "draft"}.pdf`;

    pdfMake.createPdf(docDefinition).download(fileName);
}

/**
 * Validate bill data before generating PDF
 * Returns a FieldErrors object mapping field names to error messages
 */
export function validateBillData(billData: BillData): FieldErrors {
    const errors: FieldErrors = {};

    if (!billData.invoiceNumber.trim()) {
        errors.invoiceNumber = "Invoice number is required";
    }

    if (!billData.customerDetails.name.trim()) {
        errors.customerName = "Customer name is required";
    }

    if (!billData.customerDetails.address.line1.trim()) {
        errors.customerAddress1 = "Address line 1 is required";
    }

    if (!billData.customerDetails.address.city.trim()) {
        errors.customerCity = "City is required";
    }

    if (!billData.customerDetails.address.state.trim()) {
        errors.customerState = "State is required";
    }

    // Check if there's at least one item with data
    const hasItems = billData.items.some(
        (item) => item.description.trim() || item.hsnSac.trim() || (item.quantity !== null && item.quantity > 0),
    );

    if (!hasItems) {
        errors.billItems = "At least one bill item is required";
    }

    return errors;
}

/**
 * Check if there are any validation errors
 */
export function hasErrors(errors: FieldErrors): boolean {
    return Object.keys(errors).length > 0;
}
