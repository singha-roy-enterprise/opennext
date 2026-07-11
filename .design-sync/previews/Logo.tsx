import { Logo } from "singha-roy-enterprise";

/** The mark on the three brand surfaces, at lockup, header, and favicon sizes. */
export const OnSurfaces = () => (
    <div style={{ display: "flex", gap: 0 }}>
        {[
            { bg: "#e8e3d6", label: "Paper", lc: "#7a746a" },
            { bg: "#17151b", label: "Dark", lc: "#928c9e" },
            { bg: "#ffffff", label: "White", lc: "#999999" },
        ].map((s) => (
            <div
                key={s.label}
                style={{
                    background: s.bg,
                    padding: 28,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 18,
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: s.lc,
                    }}
                >
                    {s.label}
                </div>
                <Logo size={96} />
                <Logo size={40} />
                <Logo size={20} />
            </div>
        ))}
    </div>
);

/** Default 40px mark. */
export const Default = () => (
    <div style={{ padding: 24, background: "#e8e3d6" }}>
        <Logo />
    </div>
);
