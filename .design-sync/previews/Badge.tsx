import { Badge } from "singha-roy-enterprise";

const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: 8 };

export const StatusTones = () => (
    <div style={row}>
        <Badge tone="success" dot>
            In stock
        </Badge>
        <Badge tone="warn" dot>
            Low
        </Badge>
        <Badge tone="danger" dot>
            Out
        </Badge>
    </div>
);

export const Roles = () => (
    <div style={row}>
        <Badge tone="success">ADMIN</Badge>
        <Badge tone="neutral">USER</Badge>
        <Badge tone="accent">GST 18%</Badge>
    </div>
);

export const WithoutDot = () => (
    <div style={row}>
        <Badge tone="neutral">DRAFT</Badge>
        <Badge tone="accent">HSN 2523</Badge>
        <Badge tone="danger">OVERDUE</Badge>
    </div>
);
