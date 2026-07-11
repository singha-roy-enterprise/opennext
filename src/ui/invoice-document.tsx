import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { singhaRoyEnterpriseLogo } from "@/assets/singha-roy-enterprise-logo";

export type InvoiceDocumentType = "invoice" | "credit-note";

/** A billing party — the header line plus its address/contact lines. */
export interface InvoiceParty {
    name: string;
    lines: string[];
}

/** One line item, before tax is computed (the document derives the figures). */
export interface InvoiceLineItem {
    description: string;
    hsnSac: string;
    quantity: number;
    rate: number;
    cgstPercent: number;
    sgstPercent: number;
}

/** Issuer block shown top-left and in the "From" party. */
export interface InvoiceBusiness {
    name: string;
    phones: string[];
    email: string;
    gstNo: string;
}

export interface InvoiceDocumentProps {
    /** Switches the title between "Tax Invoice" and "Credit Note". */
    documentType?: InvoiceDocumentType;
    invoiceNumber?: string;
    /** Pre-formatted date string (e.g. "11-07-2026"). */
    date?: string;
    business?: InvoiceBusiness;
    billTo?: InvoiceParty;
    items?: InvoiceLineItem[];
    /** Pre-formatted "amount in words" line. */
    amountInWords?: string;
    /** Bank rows shown in the footer. */
    bank?: { label: string; value: string }[];
    className?: string;
}

// ── Sample data so the document renders fully with zero props (for previews) ──
const SAMPLE_BUSINESS: InvoiceBusiness = {
    name: "SINGHA ROY ENTERPRISE",
    phones: ["9903746426", "7001761384"],
    email: "debarishisingharoy@gmail.com",
    gstNo: "19ALAPR8029B1Z5",
};

const SAMPLE_BILL_TO: InvoiceParty = {
    name: "Maa Tara Construction & Suppliers",
    lines: ["142 Station Road, Chakbhabani", "Balurghat - 733101", "West Bengal", "GSTIN: 19ABCDE1234F1Z7"],
};

const SAMPLE_ITEMS: InvoiceLineItem[] = [
    {
        description: "Portland Pozzolana Cement 50kg bag (Grade 43)",
        hsnSac: "2523",
        quantity: 120,
        rate: 385,
        cgstPercent: 9,
        sgstPercent: 9,
    },
    {
        description: "TMT Steel Reinforcement Bar Fe500D 12mm",
        hsnSac: "7214",
        quantity: 40,
        rate: 62,
        cgstPercent: 9,
        sgstPercent: 9,
    },
    {
        description: "River Sand — screened, per cubic feet",
        hsnSac: "2505",
        quantity: 300,
        rate: 48,
        cgstPercent: 9,
        sgstPercent: 9,
    },
];

const SAMPLE_BANK = [
    { label: "Bank Name", value: "Indian Overseas Bank" },
    { label: "A/c Name", value: "SINGHA ROY ENTERPRISE" },
    { label: "A/c No.", value: "324502000000147" },
    { label: "Branch & IFSC", value: "BALURGHAT & IOBA0003245" },
];

function inr(n: number): string {
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Computed extends InvoiceLineItem {
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
}

function compute(items: InvoiceLineItem[]): {
    rows: Computed[];
    totalTaxable: number;
    totalCgst: number;
    totalSgst: number;
    grandTotal: number;
} {
    const rows = items.map((it) => {
        const taxable = it.quantity * it.rate;
        const cgst = (taxable * it.cgstPercent) / 100;
        const sgst = (taxable * it.sgstPercent) / 100;
        return { ...it, taxable, cgst, sgst, total: taxable + cgst + sgst };
    });
    return {
        rows,
        totalTaxable: rows.reduce((s, r) => s + r.taxable, 0),
        totalCgst: rows.reduce((s, r) => s + r.cgst, 0),
        totalSgst: rows.reduce((s, r) => s + r.sgst, 0),
        grandTotal: rows.reduce((s, r) => s + r.total, 0),
    };
}

/** Wide-tracked uppercase mono micro-label used throughout the sheet. */
function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("font-mono text-[8.5px] font-semibold tracking-[0.14em] uppercase", className)}>
            {children}
        </div>
    );
}

/** Masthead: logo + issuer contact on the left, document title + meta on the right. */
function InvoiceHeader({
    documentType = "invoice",
    invoiceNumber,
    date,
    business = SAMPLE_BUSINESS,
}: Pick<InvoiceDocumentProps, "documentType" | "invoiceNumber" | "date" | "business">) {
    return (
        <div className="border-ink flex items-start justify-between gap-6 border-b-[1.5px] pb-5">
            <div className="flex items-start gap-3">
                <div
                    // Trusted, static in-repo SVG asset — not user content.
                    className="mt-0.5 size-[46px] shrink-0 [&_svg]:size-full"
                    dangerouslySetInnerHTML={{ __html: singhaRoyEnterpriseLogo }}
                />
                <div className="min-w-0">
                    <div className="font-serif text-[19px] leading-tight font-semibold">{business.name}</div>
                    <div className="text-ink-500 mt-1 font-mono text-[9px] leading-[1.6]">
                        <div>{business.phones.join("   ·   ")}</div>
                        <div>{business.email}</div>
                    </div>
                    <div className="border-ink/25 text-ink-700 mt-1.5 inline-block border px-1.5 py-0.5 font-mono text-[8.5px]">
                        GSTIN · {business.gstNo}
                    </div>
                </div>
            </div>
            <div className="shrink-0 text-right">
                <div className="text-accent font-serif text-[26px] leading-none font-medium tracking-[0.01em]">
                    {documentType === "credit-note" ? "Credit Note" : "Tax Invoice"}
                </div>
                <div className="mt-3 space-y-2">
                    <div>
                        <MicroLabel className="text-ink-500">Invoice No.</MicroLabel>
                        <div className="mt-0.5 font-mono text-[11px] font-semibold">{invoiceNumber || "—"}</div>
                    </div>
                    <div>
                        <MicroLabel className="text-ink-500">Date</MicroLabel>
                        <div className="mt-0.5 font-mono text-[11px] font-semibold">{date || "—"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** The two "Bill To" / "From" party columns. */
function InvoiceParties({
    billTo = SAMPLE_BILL_TO,
    business = SAMPLE_BUSINESS,
}: Pick<InvoiceDocumentProps, "billTo" | "business">) {
    const from: InvoiceParty = {
        name: business.name,
        lines: [
            "Singha Roy Bhaban, Saheb Kachari Para",
            "Balurghat, District - South Dinajpur",
            "Balurghat - 733101, West Bengal",
            `Phone: ${business.phones.join(", ")}`,
        ],
    };
    return (
        <div className="grid grid-cols-2 gap-6 py-5">
            <Party label="Bill To" party={billTo} labelClass="text-accent" />
            <Party label="From" party={from} labelClass="text-ink-500" />
        </div>
    );
}

function Party({ label, party, labelClass }: { label: string; party: InvoiceParty; labelClass: string }) {
    return (
        <div>
            <MicroLabel className={labelClass}>{label}</MicroLabel>
            <div className="mt-1.5 font-serif text-[14px] font-semibold">{party.name}</div>
            <div className="text-ink-700 mt-1 text-[10.5px] leading-[1.5]">
                {party.lines.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}
            </div>
        </div>
    );
}

/** The line-item table: accent header, zebra rows, stacked tax rate + amount, bold totals. */
function InvoiceItemsTable({ items = SAMPLE_ITEMS }: Pick<InvoiceDocumentProps, "items">) {
    const { rows, totalTaxable, totalCgst, totalSgst, grandTotal } = compute(items);
    const num = "text-right font-mono text-[10px] text-ink-700";
    return (
        <table className="w-full border-collapse text-[10.5px]">
            <thead>
                <tr className="bg-accent text-cream font-mono text-[8.5px] font-semibold tracking-[0.08em] uppercase">
                    <th className="px-1.5 py-1.5 text-center font-semibold">#</th>
                    <th className="px-1.5 py-1.5 text-left font-semibold">Description of goods</th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">HSN/SAC</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Qty</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Rate</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Taxable</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">CGST</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">SGST</th>
                    <th className="px-1.5 py-1.5 text-right font-semibold">Amount</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i} className={cn("border-ink/[0.1] border-b", i % 2 === 1 && "bg-cream/60")}>
                        <td className="text-ink-300 px-1.5 py-2 text-center font-mono text-[9px]">{i + 1}</td>
                        <td className="px-1.5 py-2">{r.description}</td>
                        <td className="text-ink-700 px-1.5 py-2 text-center font-mono text-[9px]">{r.hsnSac}</td>
                        <td className={cn(num, "px-1.5 py-2")}>{r.quantity}</td>
                        <td className={cn(num, "px-1.5 py-2")}>{r.rate.toFixed(2)}</td>
                        <td className={cn(num, "px-1.5 py-2")}>
                            {r.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <TaxCell amount={r.cgst} percent={r.cgstPercent} />
                        <TaxCell amount={r.sgst} percent={r.sgstPercent} />
                        <td className="text-ink px-1.5 py-2 text-right font-mono text-[10px] font-semibold">
                            {r.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                ))}
                <tr className="border-ink border-y-[1.5px] font-semibold">
                    <td />
                    <td className="px-1.5 py-2 font-mono text-[9px] tracking-[0.08em] uppercase">Total</td>
                    <td colSpan={3} />
                    <td className={cn(num, "text-ink px-1.5 py-2 font-semibold")}>
                        {totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={cn(num, "text-ink px-1.5 py-2 font-semibold")}>
                        {totalCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={cn(num, "text-ink px-1.5 py-2 font-semibold")}>
                        {totalSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-ink px-1.5 py-2 text-right font-mono text-[10px] font-semibold">
                        {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function TaxCell({ amount, percent }: { amount: number; percent: number }) {
    return (
        <td className="px-1.5 py-2 text-right">
            <div className="text-ink-300 font-mono text-[7.5px] leading-none">{percent}%</div>
            <div className="text-ink-700 mt-0.5 font-mono text-[9.5px] leading-none">
                {amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
        </td>
    );
}

/** Amount-in-words on the left, the totals ladder and grand-total band on the right. */
function InvoiceTotals({ items = SAMPLE_ITEMS, amountInWords }: Pick<InvoiceDocumentProps, "items" | "amountInWords">) {
    const { totalTaxable, totalCgst, totalSgst, grandTotal } = compute(items);
    const words = amountInWords ?? defaultWords(grandTotal);
    return (
        <div className="flex flex-wrap items-end justify-between gap-6 py-5">
            <div className="max-w-[280px] flex-1">
                <MicroLabel className="text-ink-500">Amount Chargeable (in words)</MicroLabel>
                <div className="text-ink-700 mt-1.5 font-serif text-[13px] leading-snug italic">{words}</div>
            </div>
            <div className="w-[240px] max-w-full">
                <Ladder label="Total Taxable Value" value={inr(totalTaxable)} />
                <Ladder label="Total CGST" value={inr(totalCgst)} />
                <Ladder label="Total SGST" value={inr(totalSgst)} thick />
                <div className="bg-cream mt-2 flex items-center justify-between px-3 py-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase">Grand Total</span>
                    <span className="font-serif text-[18px] font-semibold">{inr(grandTotal)}</span>
                </div>
            </div>
        </div>
    );
}

function Ladder({ label, value, thick }: { label: string; value: string; thick?: boolean }) {
    return (
        <div
            className={cn(
                "flex justify-between py-1.5 text-[10px]",
                thick ? "border-ink border-b-[1.5px]" : "border-ink/[0.12] border-b",
            )}
        >
            <span className="text-ink-700">{label}</span>
            <span className="font-mono">{value}</span>
        </div>
    );
}

/** Bank details on the left, the signature block on the right. */
function InvoiceFooter({
    business = SAMPLE_BUSINESS,
    bank = SAMPLE_BANK,
}: Pick<InvoiceDocumentProps, "business" | "bank">) {
    return (
        <div className="border-ink/[0.14] flex flex-wrap items-end justify-between gap-6 border-t pt-4">
            <div>
                <MicroLabel className="text-ink-500">Bank Details</MicroLabel>
                <table className="mt-1.5 text-[9.5px]">
                    <tbody>
                        {bank.map((b) => (
                            <tr key={b.label}>
                                <td className="text-ink-500 py-[1px] pr-3">{b.label}</td>
                                <td className="text-ink-700 py-[1px] font-mono">{b.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="min-w-[180px] text-right">
                <div className="font-serif text-[11px]">For {business.name}</div>
                <div className="border-ink mt-10 border-t pt-1">
                    <MicroLabel className="text-ink-500">Authorised Signatory</MicroLabel>
                </div>
            </div>
        </div>
    );
}

/**
 * The generated invoice / credit-note as an on-screen sheet — a faithful DOM
 * twin of the `pdf-lib` output, styled with the same tokens. Renders with
 * built-in sample data when no props are supplied, so it doubles as the design
 * reference for the PDF's building blocks (header, parties, items table,
 * totals, footer). Each block is also exposed as a static sub-component
 * (`InvoiceDocument.Header`, `.Parties`, `.ItemsTable`, `.Totals`, `.Footer`).
 *
 * @category PDF
 */
export function InvoiceDocument({
    documentType = "invoice",
    invoiceNumber = "SRE/2026-27/0042",
    date = "11-07-2026",
    business = SAMPLE_BUSINESS,
    billTo = SAMPLE_BILL_TO,
    items = SAMPLE_ITEMS,
    amountInWords,
    bank = SAMPLE_BANK,
    className,
}: InvoiceDocumentProps) {
    return (
        <div
            className={cn(
                "bg-card text-ink border-ink/[0.18] mx-auto w-full max-w-[640px] border px-8 py-7",
                "shadow-[0_20px_50px_-30px_rgb(27_25_22/0.55)]",
                className,
            )}
        >
            <InvoiceHeader documentType={documentType} invoiceNumber={invoiceNumber} date={date} business={business} />
            <InvoiceParties billTo={billTo} business={business} />
            <InvoiceItemsTable items={items} />
            <InvoiceTotals items={items} amountInWords={amountInWords} />
            <InvoiceFooter business={business} bank={bank} />
        </div>
    );
}

InvoiceDocument.Header = InvoiceHeader;
InvoiceDocument.Parties = InvoiceParties;
InvoiceDocument.ItemsTable = InvoiceItemsTable;
InvoiceDocument.Totals = InvoiceTotals;
InvoiceDocument.Footer = InvoiceFooter;

/** Minimal fallback so the sample renders a sensible words line. */
function defaultWords(grandTotal: number): string {
    return `Rupees ${Math.round(grandTotal).toLocaleString("en-IN")} only`;
}
