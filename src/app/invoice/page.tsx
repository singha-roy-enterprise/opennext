"use client";

import dynamic from "next/dynamic";

// The invoice editor is a client-only tool: it is backed by localStorage and
// generates PDFs in the browser via pdfmake. Rendering it with `ssr: false`
// keeps its entire (browser-only) dependency subtree — notably pdfmake and its
// ~1 MiB of embedded fonts — out of the Cloudflare Worker server bundle, which
// must stay under the Worker size limit.
const InvoiceClient = dynamic(() => import("./invoice-client"), { ssr: false });

export default function InvoicePage() {
    return <InvoiceClient />;
}
