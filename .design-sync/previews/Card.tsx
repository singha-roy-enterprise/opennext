import { Card } from "singha-roy-enterprise";

const title: React.CSSProperties = { fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, marginBottom: 6 };
const body: React.CSSProperties = { fontSize: 13, lineHeight: 1.5, color: "#4a453d", margin: 0 };

export const Variants = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 720, padding: 8 }}>
        <Card variant="solid" style={{ padding: 20 }}>
            <div style={title}>Solid</div>
            <p style={body}>Full-weight ink border — the primary sheet of paper.</p>
        </Card>
        <Card variant="subtle" style={{ padding: 20 }}>
            <div style={title}>Subtle</div>
            <p style={body}>Hairline border for quieter panels and list containers.</p>
        </Card>
        <Card variant="dashed" style={{ padding: 20 }}>
            <div style={title}>Dashed</div>
            <p style={body}>Dashed outline for secondary / opt-in surfaces.</p>
        </Card>
    </div>
);
