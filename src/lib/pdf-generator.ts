import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { BillData, BillItemCalculated } from "@/types/bill";
import { formatAmountInWords } from "@/lib/number-to-words";
import { singhaRoyEnterpriseLogoLayers, LOGO_CUTOUT, LOGO_VIEWBOX } from "@/assets/singha-roy-enterprise-logo";

export type DocumentType = "invoice" | "credit-note";

/**
 * Field error type for validation
 */
export type FieldErrors = Record<string, string>;

// ── Design-system tokens (mirrored from the light theme in globals.css) ──────
const INK = rgb(0x1b / 255, 0x19 / 255, 0x16 / 255);
const INK_700 = rgb(0x4a / 255, 0x45 / 255, 0x3d / 255);
const INK_500 = rgb(0x7a / 255, 0x74 / 255, 0x6a / 255);
const INK_300 = rgb(0xa8 / 255, 0xa0 / 255, 0x96 / 255);
const ACCENT = rgb(0x27 / 255, 0x42 / 255, 0xc4 / 255);
const CREAM = rgb(0xf1 / 255, 0xee / 255, 0xe6 / 255);
const CARD = rgb(0xfb / 255, 0xfa / 255, 0xf6 / 255);
const WHITE = rgb(1, 1, 1);
const HAIRLINE = rgb(0.86, 0.85, 0.82); // ~ ink at 18% on paper

// ── Page geometry (A4, points) ───────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const BOTTOM_LIMIT = MARGIN; // continuation pages may fill down to here

// Items-table column widths (sum === CONTENT_W). Description is the flex column.
const COL = {
    sno: 22,
    desc: 0, // filled in below
    hsn: 46,
    qty: 30,
    rate: 54,
    taxable: 62,
    cgst: 54,
    sgst: 54,
    amount: 62,
};
COL.desc = CONTENT_W - (COL.sno + COL.hsn + COL.qty + COL.rate + COL.taxable + COL.cgst + COL.sgst + COL.amount);

/** Fonts embedded once per document and threaded through the renderer. */
interface Fonts {
    serif: PDFFont;
    serifBold: PDFFont;
    serifItalic: PDFFont;
    sans: PDFFont;
    sansBold: PDFFont;
    mono: PDFFont;
    monoBold: PDFFont;
}

/** Convert an `#rrggbb` string to a pdf-lib colour. */
function hex(color: string): RGB {
    const n = parseInt(color.slice(1), 16);
    return rgb(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255);
}

/**
 * The standard-14 fonts use WinAnsi encoding and throw on characters they can't
 * represent. User-entered fields are drawn through this: the rupee sign becomes
 * `Rs.` and anything outside printable ASCII is dropped to a space.
 */
function safe(text: string): string {
    return (text ?? "").replace(/₹/g, "Rs.").replace(/[^\x20-\x7e]/g, " ");
}

/** Format a date as DD-MM-YYYY. */
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}-${month}-${date.getFullYear()}`;
}

/** Format a number with two decimals in the Indian grouping. */
function formatNumber(value: number): string {
    return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Greedy word-wrap; hard-breaks any single token wider than `maxWidth`. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const clean = safe(text).trim();
    if (!clean) return [""];
    const lines: string[] = [];
    let line = "";
    for (const word of clean.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
            // Token still too wide even alone → hard-break it.
            if (!line && font.widthOfTextAtSize(word, size) > maxWidth) {
                let chunk = "";
                for (const ch of word) {
                    if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) {
                        lines.push(chunk);
                        chunk = ch;
                    } else {
                        chunk += ch;
                    }
                }
                line = chunk;
            } else {
                line = candidate;
            }
        } else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/**
 * A thin cursor over the current page. Text is positioned from the top of the
 * sheet (`top` grows downward) so the layout reads top-to-bottom; drawing maps
 * that back to pdf-lib's bottom-left origin.
 */
class Sheet {
    page: PDFPage;
    top = MARGIN; // distance from the top edge of the current page

    constructor(private doc: PDFDocument) {
        this.page = doc.addPage([PAGE_W, PAGE_H]);
    }

    private baseline(size: number): number {
        // Approximate cap height so `top` marks the visual top of the glyphs.
        return PAGE_H - this.top - size * 0.82;
    }

    /** Left-aligned text at the current `top`; does not advance the cursor. */
    text(str: string, x: number, font: PDFFont, size: number, color: RGB = INK): void {
        this.page.drawText(safe(str), { x, y: this.baseline(size), size, font, color });
    }

    /** Right-aligned to `xRight`. */
    textRight(str: string, xRight: number, font: PDFFont, size: number, color: RGB = INK): void {
        const s = safe(str);
        this.page.drawText(s, {
            x: xRight - font.widthOfTextAtSize(s, size),
            y: this.baseline(size),
            size,
            font,
            color,
        });
    }

    /** Centred on `xCenter`. */
    textCenter(str: string, xCenter: number, font: PDFFont, size: number, color: RGB = INK): void {
        const s = safe(str);
        this.page.drawText(s, {
            x: xCenter - font.widthOfTextAtSize(s, size) / 2,
            y: this.baseline(size),
            size,
            font,
            color,
        });
    }

    /** A full-content-width horizontal rule at the current `top`. */
    rule(thickness = 0.75, color: RGB = HAIRLINE, x = MARGIN, width = CONTENT_W): void {
        const y = PAGE_H - this.top;
        this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color });
    }

    /** A filled band spanning `height` downward from the current `top`. */
    band(height: number, color: RGB, x = MARGIN, width = CONTENT_W): void {
        this.page.drawRectangle({ x, y: PAGE_H - this.top - height, width, height, color });
    }

    /** Space remaining above the bottom margin. */
    get remaining(): number {
        return PAGE_H - this.top - BOTTOM_LIMIT;
    }

    /** Break to a fresh page and reset the cursor. */
    newPage(): void {
        this.page = this.doc.addPage([PAGE_W, PAGE_H]);
        this.top = MARGIN;
    }
}

/** Draw the vector logo with its top-left near (x, topFromEdge). Returns drawn size. */
function drawLogo(page: PDFPage, x: number, topFromEdge: number, targetHeight: number): { w: number; h: number } {
    const scale = targetHeight / LOGO_VIEWBOX.height;
    const y = PAGE_H - topFromEdge;
    for (const layer of singhaRoyEnterpriseLogoLayers) {
        page.drawSvgPath(layer.d, { x, y, scale, color: hex(layer.fill) });
    }
    // Repaint the mask notch in the sheet colour to reproduce the SVG cut-out.
    page.drawSvgPath(LOGO_CUTOUT, { x, y, scale, color: WHITE });
    return { w: LOGO_VIEWBOX.width * scale, h: targetHeight };
}

/** Render the full invoice / credit-note and return the PDF bytes. */
export async function renderInvoicePDF(billData: BillData, documentType: DocumentType): Promise<Uint8Array> {
    const { businessDetails, customerDetails, items, totals, invoiceNumber, date } = billData;

    const doc = await PDFDocument.create();
    doc.setTitle(`${documentType === "credit-note" ? "Credit Note" : "Invoice"} ${invoiceNumber}`);
    doc.setProducer("Singha Roy Enterprise");

    const fonts: Fonts = {
        serif: await doc.embedFont(StandardFonts.TimesRoman),
        serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
        serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
        sans: await doc.embedFont(StandardFonts.Helvetica),
        sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
        mono: await doc.embedFont(StandardFonts.Courier),
        monoBold: await doc.embedFont(StandardFonts.CourierBold),
    };

    const sheet = new Sheet(doc);

    // ── Header ───────────────────────────────────────────────────────────────
    const logoSize = 50;
    const logo = drawLogo(sheet.page, MARGIN, MARGIN, logoSize);
    const nameX = MARGIN + logo.w + 14;

    sheet.top = MARGIN + 4;
    sheet.text(businessDetails.name, nameX, fonts.serifBold, 17, INK);
    sheet.top += 20;
    sheet.text(businessDetails.phones.join("   ·   "), nameX, fonts.sans, 8.5, INK_500);
    sheet.top += 11;
    sheet.text(businessDetails.email, nameX, fonts.sans, 8.5, INK_500);
    sheet.top += 13;
    // GSTIN chip
    const gstLabel = `GSTIN  ${businessDetails.gstNo}`;
    const gstW = fonts.mono.widthOfTextAtSize(gstLabel, 8) + 12;
    sheet.page.drawRectangle({
        x: nameX,
        y: PAGE_H - sheet.top - 12,
        width: gstW,
        height: 14,
        borderColor: hex("#a8a096"),
        borderWidth: 0.75,
    });
    const savedTop = sheet.top;
    sheet.top += 2.5;
    sheet.text(gstLabel, nameX + 6, fonts.mono, 8, INK_700);
    sheet.top = savedTop;

    // Right column: document title + meta
    const rightEdge = PAGE_W - MARGIN;
    sheet.top = MARGIN + 2;
    sheet.textRight(documentType === "credit-note" ? "CREDIT NOTE" : "TAX INVOICE", rightEdge, fonts.serif, 25, ACCENT);
    sheet.top += 26;
    sheet.textRight("INVOICE NO.", rightEdge, fonts.mono, 7.5, INK_500);
    sheet.top += 10;
    sheet.textRight(invoiceNumber || "—", rightEdge, fonts.monoBold, 11, INK);
    sheet.top += 15;
    sheet.textRight("DATE", rightEdge, fonts.mono, 7.5, INK_500);
    sheet.top += 10;
    sheet.textRight(formatDate(date), rightEdge, fonts.monoBold, 11, INK);

    sheet.top = MARGIN + Math.max(logoSize, 82) + 12;
    sheet.rule(1.4, INK);

    // ── Bill To / From ─────────────────────────────────────────────────────────
    sheet.top += 18;
    const colGap = 22;
    const halfW = (CONTENT_W - colGap) / 2;
    const leftX = MARGIN;
    const rightX = MARGIN + halfW + colGap;

    const customerAddr = [
        customerDetails.address.line1,
        customerDetails.address.line2,
        customerDetails.address.pin
            ? `${customerDetails.address.city} - ${customerDetails.address.pin}`
            : customerDetails.address.city,
        customerDetails.address.state,
    ].filter(Boolean) as string[];
    if (customerDetails.phone) customerAddr.push(`Phone: ${customerDetails.phone}`);
    if (customerDetails.gstNo) customerAddr.push(`GSTIN: ${customerDetails.gstNo}`);

    const businessAddr = [
        businessDetails.address.line1,
        businessDetails.address.line2,
        `${businessDetails.address.city} - ${businessDetails.address.pin}`,
        businessDetails.address.state,
        `Phone: ${businessDetails.phones.join(", ")}`,
    ].filter(Boolean) as string[];

    const blockTop = sheet.top;
    const custBottom = drawParty(sheet, fonts, "BILL TO", customerDetails.name, customerAddr, leftX, halfW, ACCENT);
    sheet.top = blockTop;
    const bizBottom = drawParty(sheet, fonts, "FROM", businessDetails.name, businessAddr, rightX, halfW, INK_500);
    sheet.top = Math.max(custBottom, bizBottom);

    // ── Items table ────────────────────────────────────────────────────────────
    const filledItems = items.filter((item) => item.description.trim() || item.hsnSac.trim() || item.taxableValue > 0);
    sheet.top += 26;
    drawItemsTable(sheet, fonts, filledItems, totals);

    // ── Amount in words + totals ───────────────────────────────────────────────
    ensureSpace(sheet, 120);
    sheet.top += 20;
    const totalsBlockTop = sheet.top;

    // Left: amount in words
    sheet.text("AMOUNT CHARGEABLE (IN WORDS)", leftX, fonts.mono, 7.5, INK_500);
    sheet.top += 14;
    const wordsLines = wrapText(formatAmountInWords(totals.grandTotal), fonts.serifItalic, 12, halfW);
    for (const l of wordsLines) {
        sheet.text(l, leftX, fonts.serifItalic, 12, INK_700);
        sheet.top += 15;
    }

    // Right: totals ladder
    sheet.top = totalsBlockTop;
    const totalsX = MARGIN + CONTENT_W - 235;
    const totalsW = 235;
    totalRow(sheet, fonts, "Total Taxable Value", formatNumber(totals.totalTaxableValue), totalsX, totalsW);
    totalRow(sheet, fonts, "Total CGST", formatNumber(totals.totalCgst), totalsX, totalsW);
    totalRow(sheet, fonts, "Total SGST", formatNumber(totals.totalSgst), totalsX, totalsW, true);
    sheet.top += 8;
    sheet.band(30, CREAM, totalsX, totalsW);
    sheet.top += 8;
    sheet.text("GRAND TOTAL", totalsX + 10, fonts.sansBold, 9, INK);
    sheet.textRight(`Rs. ${formatNumber(totals.grandTotal)}`, totalsX + totalsW - 10, fonts.serifBold, 15, INK);
    sheet.top += 22;

    sheet.top = Math.max(sheet.top, totalsBlockTop + wordsLines.length * 15 + 20);

    // ── Footer: bank details + signature ───────────────────────────────────────
    ensureSpace(sheet, 110);
    sheet.top += 16;
    sheet.rule(0.75, HAIRLINE);
    sheet.top += 16;
    const footerTop = sheet.top;

    sheet.text("BANK DETAILS", leftX, fonts.mono, 7.5, INK_500);
    sheet.top += 14;
    const bank: [string, string][] = [
        ["Bank Name", "Indian Overseas Bank"],
        ["A/c Name", "SINGHA ROY ENTERPRISE"],
        ["A/c No.", "324502000000147"],
        ["Branch & IFSC", "BALURGHAT & IOBA0003245"],
    ];
    for (const [k, v] of bank) {
        sheet.text(k, leftX, fonts.sans, 8.5, INK_500);
        sheet.text(v, leftX + 92, fonts.mono, 8.5, INK_700);
        sheet.top += 12.5;
    }

    // Signature (right)
    sheet.top = footerTop + 20;
    sheet.textRight(`For ${businessDetails.name}`, rightEdge, fonts.serif, 11, INK);
    sheet.top += 44;
    sheet.rule(0.75, INK, rightEdge - 150, 150);
    sheet.top += 5;
    sheet.textRight("Authorised Signatory", rightEdge, fonts.mono, 8, INK_500);

    return doc.save();
}

/** A "Bill To" / "From" party block. Returns the `top` at its bottom edge. */
function drawParty(
    sheet: Sheet,
    fonts: Fonts,
    label: string,
    name: string,
    lines: string[],
    x: number,
    width: number,
    labelColor: RGB,
): number {
    sheet.text(label, x, fonts.mono, 7.5, labelColor);
    sheet.top += 13;
    sheet.text(name, x, fonts.serifBold, 12.5, INK);
    sheet.top += 15;
    for (const raw of lines) {
        for (const l of wrapText(raw, fonts.sans, 9, width)) {
            sheet.text(l, x, fonts.sans, 9, INK_700);
            sheet.top += 11.5;
        }
    }
    return sheet.top;
}

/** Draw a totals ladder row (label left, value right) with a bottom hairline. */
function totalRow(
    sheet: Sheet,
    fonts: Fonts,
    label: string,
    value: string,
    x: number,
    width: number,
    thick = false,
): void {
    sheet.top += 3;
    sheet.text(label, x + 10, fonts.sans, 9, INK_700);
    sheet.textRight(value, x + width - 10, fonts.mono, 9.5, INK);
    sheet.top += 9;
    sheet.rule(thick ? 1.2 : 0.6, thick ? INK : HAIRLINE, x, width);
}

/** Add a page when fewer than `needed` points remain below the cursor. */
function ensureSpace(sheet: Sheet, needed: number): void {
    if (sheet.remaining < needed) sheet.newPage();
}

/** The items table with an accent header, zebra rows, and a bold totals row. */
function drawItemsTable(sheet: Sheet, fonts: Fonts, items: BillItemCalculated[], totals: BillData["totals"]): void {
    const xs = {
        sno: MARGIN,
        desc: MARGIN + COL.sno,
        hsn: MARGIN + COL.sno + COL.desc,
        qty: MARGIN + COL.sno + COL.desc + COL.hsn,
        rate: MARGIN + COL.sno + COL.desc + COL.hsn + COL.qty,
        taxable: MARGIN + COL.sno + COL.desc + COL.hsn + COL.qty + COL.rate,
        cgst: MARGIN + COL.sno + COL.desc + COL.hsn + COL.qty + COL.rate + COL.taxable,
        sgst: MARGIN + COL.sno + COL.desc + COL.hsn + COL.qty + COL.rate + COL.taxable + COL.cgst,
        amount: MARGIN + CONTENT_W,
    };
    const padX = 5;

    const drawHeader = () => {
        const h = 18;
        sheet.band(h, ACCENT);
        const savedTop = sheet.top;
        sheet.top += 5.5;
        sheet.textCenter("#", xs.sno + COL.sno / 2, fonts.sansBold, 7.5, WHITE);
        sheet.text("DESCRIPTION OF GOODS", xs.desc + padX, fonts.sansBold, 7.5, WHITE);
        sheet.textCenter("HSN/SAC", xs.hsn + COL.hsn / 2, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("QTY", xs.qty + COL.qty - padX, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("RATE", xs.rate + COL.rate - padX, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("TAXABLE", xs.taxable + COL.taxable - padX, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("CGST", xs.cgst + COL.cgst - padX, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("SGST", xs.sgst + COL.sgst - padX, fonts.sansBold, 7.5, WHITE);
        sheet.textRight("AMOUNT", xs.amount - padX, fonts.sansBold, 7.5, WHITE);
        sheet.top = savedTop + h;
    };

    drawHeader();

    items.forEach((item, i) => {
        const descLines = wrapText(item.description || "—", fonts.sans, 8.5, COL.desc - 2 * padX);
        const rowH = Math.max(24, 8 + descLines.length * 10.5);

        if (sheet.remaining < rowH + 30) {
            sheet.newPage();
            drawHeader();
        }

        const rowTop = sheet.top;
        if (i % 2 === 1) sheet.band(rowH, CARD);

        // description (wrapped, top-aligned)
        sheet.top = rowTop + 6;
        for (const l of descLines) {
            sheet.text(l, xs.desc + padX, fonts.sans, 8.5, INK);
            sheet.top += 10.5;
        }

        // single-line cells, vertically centred on the row
        sheet.top = rowTop + (rowH - 8.5) / 2;
        sheet.textCenter(String(i + 1), xs.sno + COL.sno / 2, fonts.mono, 8.5, INK_300);
        sheet.textCenter(item.hsnSac || "—", xs.hsn + COL.hsn / 2, fonts.mono, 8, INK_700);
        sheet.textRight(
            item.quantity != null ? String(item.quantity) : "0",
            xs.qty + COL.qty - padX,
            fonts.mono,
            8.5,
            INK_700,
        );
        sheet.textRight(formatNumber(item.rate ?? 0), xs.rate + COL.rate - padX, fonts.mono, 8.5, INK_700);
        sheet.textRight(formatNumber(item.taxableValue), xs.taxable + COL.taxable - padX, fonts.mono, 8.5, INK_700);
        sheet.textRight(formatNumber(item.totalAmount), xs.amount - padX, fonts.monoBold, 8.5, INK);

        // CGST / SGST: rate above amount (GST invoices must show the tax rate)
        sheet.top = rowTop + rowH / 2 - 8.5;
        sheet.textRight(`${item.cgstPercent ?? 0}%`, xs.cgst + COL.cgst - padX, fonts.mono, 6.5, INK_300);
        sheet.textRight(`${item.sgstPercent ?? 0}%`, xs.sgst + COL.sgst - padX, fonts.mono, 6.5, INK_300);
        sheet.top = rowTop + rowH / 2 + 1.5;
        sheet.textRight(formatNumber(item.cgstAmount), xs.cgst + COL.cgst - padX, fonts.mono, 8, INK_700);
        sheet.textRight(formatNumber(item.sgstAmount), xs.sgst + COL.sgst - padX, fonts.mono, 8, INK_700);

        sheet.top = rowTop + rowH;
        sheet.rule(0.5, HAIRLINE);
    });

    // Totals row
    const totH = 20;
    if (sheet.remaining < totH) {
        sheet.newPage();
        drawHeader();
    }
    sheet.rule(1.2, INK);
    const totTop = sheet.top;
    sheet.top += (totH - 9) / 2;
    sheet.text("TOTAL", xs.desc + padX, fonts.sansBold, 8.5, INK);
    sheet.textRight(formatNumber(totals.totalTaxableValue), xs.taxable + COL.taxable - padX, fonts.monoBold, 8.5, INK);
    sheet.textRight(formatNumber(totals.totalCgst), xs.cgst + COL.cgst - padX, fonts.monoBold, 8, INK);
    sheet.textRight(formatNumber(totals.totalSgst), xs.sgst + COL.sgst - padX, fonts.monoBold, 8, INK);
    sheet.textRight(formatNumber(totals.grandTotal), xs.amount - padX, fonts.monoBold, 8.5, INK);
    sheet.top = totTop + totH;
    sheet.rule(1.2, INK);
}

/**
 * Validate bill data before generating the PDF. Returns a map of field name to
 * error message.
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
