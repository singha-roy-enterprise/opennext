import type { ReactNode } from "react";
import { InvoiceDocument } from "singha-roy-enterprise";

const paper = { padding: 20, background: "#e8e3d6" } as const;

function Caption({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#7a746a",
                margin: "0 0 8px",
            }}
        >
            {children}
        </div>
    );
}

/**
 * Primary card: the whole generated document, then each block that composes it
 * (header, parties, items table, totals, footer) called out on its own.
 */
export const Anatomy = () => (
    <div style={{ ...paper, display: "flex", flexDirection: "column", gap: 28, maxWidth: 720, margin: "0 auto" }}>
        <div>
            <Caption>Generated document — Tax Invoice</Caption>
            <InvoiceDocument />
        </div>
        <div>
            <Caption>Generated document — Credit Note</Caption>
            <InvoiceDocument documentType="credit-note" invoiceNumber="SRE/CN/2026-27/0008" />
        </div>
        <div>
            <Caption>Block · Header</Caption>
            <div style={{ background: "#fbfaf6", padding: 16 }}>
                <InvoiceDocument.Header invoiceNumber="SRE/2026-27/0042" date="11-07-2026" />
            </div>
        </div>
        <div>
            <Caption>Block · Bill To / From</Caption>
            <div style={{ background: "#fbfaf6", padding: 16 }}>
                <InvoiceDocument.Parties />
            </div>
        </div>
        <div>
            <Caption>Block · Items table</Caption>
            <div style={{ background: "#fbfaf6", padding: 16 }}>
                <InvoiceDocument.ItemsTable />
            </div>
        </div>
        <div>
            <Caption>Block · Totals</Caption>
            <div style={{ background: "#fbfaf6", padding: 16 }}>
                <InvoiceDocument.Totals />
            </div>
        </div>
        <div>
            <Caption>Block · Footer</Caption>
            <div style={{ background: "#fbfaf6", padding: 16 }}>
                <InvoiceDocument.Footer />
            </div>
        </div>
    </div>
);

/** The full generated tax invoice on its own. */
export const Invoice = () => (
    <div style={paper}>
        <InvoiceDocument />
    </div>
);

/** The same sheet issued as a credit note (only the title changes). */
export const CreditNote = () => (
    <div style={paper}>
        <InvoiceDocument documentType="credit-note" invoiceNumber="SRE/CN/2026-27/0008" />
    </div>
);

/** Masthead block: logo, issuer contact, document title and meta. */
export const Header = () => (
    <div style={{ background: "#fbfaf6", padding: 16 }}>
        <InvoiceDocument.Header invoiceNumber="SRE/2026-27/0042" date="11-07-2026" />
    </div>
);

/** The line-item table with its accent header and stacked tax cells. */
export const ItemsTable = () => (
    <div style={{ background: "#fbfaf6", padding: 16 }}>
        <InvoiceDocument.ItemsTable />
    </div>
);

/** Amount-in-words with the totals ladder and grand-total band. */
export const Totals = () => (
    <div style={{ background: "#fbfaf6", padding: 16 }}>
        <InvoiceDocument.Totals />
    </div>
);
