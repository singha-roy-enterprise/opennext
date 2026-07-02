import { StatCell } from "singha-roy-enterprise";
import { FiAlertTriangle } from "react-icons/fi";

export const Strip = () => (
    <div
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid rgba(27,25,22,.18)",
            borderRadius: 4,
            overflow: "hidden",
            maxWidth: 660,
            margin: 8,
        }}
    >
        <StatCell label="Total SKUs" value="128" />
        <StatCell label="Stock Value" value="₹18,40,600" tone="accent" />
        <StatCell label="Low Stock" value="7" tone="warn" icon={<FiAlertTriangle size={12} />} />
        <StatCell label="Out of Stock" value="3" tone="danger" last />
    </div>
);
