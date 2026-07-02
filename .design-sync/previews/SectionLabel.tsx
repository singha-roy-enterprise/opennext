import { SectionLabel } from "singha-roy-enterprise";

export const Default = () => (
    <div style={{ maxWidth: 520, padding: 12, display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionLabel n="01" title="Bill To" />
        <SectionLabel n="02" title="Bill Items" />
        <SectionLabel n="03" title="Totals" />
    </div>
);
