"use client";

import dynamic from "next/dynamic";

// The invoice editor is a client-only tool: it is backed by localStorage and
// generates PDFs in the browser via pdf-lib. Rendering it with `ssr: false`
// keeps its entire (browser-only) dependency subtree — notably the pdf-lib
// drawing code — out of the Cloudflare Worker server bundle, which must stay
// under the Worker size limit.
const InvoiceClient = dynamic(() => import("./invoice-client"), { ssr: false });

export default function InvoicePage() {
    return <InvoiceClient />;
}
