import type { CSSProperties } from "react";
import { Logo } from "singha-roy-enterprise";

const label: CSSProperties = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#7a746a",
};

function Swatch({ name, style, children }: { name: string; style?: CSSProperties; children: React.ReactNode }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: 24,
                borderRadius: 6,
                ...style,
            }}
        >
            {children}
            <div style={label}>{name}</div>
        </div>
    );
}

/** The mark on the three brand surfaces, at lockup, header, and favicon sizes. */
export const OnSurfaces = () => (
    <div style={{ display: "flex", gap: 0 }}>
        {[
            { bg: "#e8e3d6", name: "Paper" },
            { bg: "#17151b", name: "Dark" },
            { bg: "#ffffff", name: "White" },
        ].map((s) => (
            <Swatch key={s.name} name={s.name} style={{ background: s.bg }}>
                <Logo size={96} />
                <Logo size={40} />
                <Logo size={20} />
            </Swatch>
        ))}
    </div>
);

/**
 * Colours follow `--color-accent`, so redefining that one token (dark mode,
 * Catppuccin, any palette) re-tints the tile automatically — no prop changes.
 */
export const ThemeDriven = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 16, background: "#f1eee6" }}>
        <Swatch name="Default accent" style={{ background: "#fff" }}>
            <Logo size={72} />
        </Swatch>
        <Swatch
            name="Dark accent"
            style={{ background: "#17151b", ["--color-accent" as string]: "#7188f6" } as CSSProperties}
        >
            <Logo size={72} />
        </Swatch>
        <Swatch
            name="Catppuccin mauve"
            style={
                {
                    background: "#1e1e2e",
                    ["--color-accent" as string]: "#cba6f7",
                    ["--logo-mark" as string]: "#1e1e2e",
                } as CSSProperties
            }
        >
            <Logo size={72} />
        </Swatch>
        <Swatch name="Emerald" style={{ background: "#fff", ["--color-accent" as string]: "#2f7a55" } as CSSProperties}>
            <Logo size={72} />
        </Swatch>
    </div>
);

/** Explicit `tileColor` / `markColor` props override the tokens entirely. */
export const Overrides = () => (
    <div style={{ display: "flex", gap: 16, padding: 24, background: "#fff" }}>
        <Logo size={72} tileColor="#1b1916" markColor="#f1eee6" />
        <Logo size={72} tileColor="#be3a28" markColor="#ffffff" />
        <Logo size={72} tileColor="#f1eee6" markColor="#2742c4" />
    </div>
);

/** `variant="bare"` drops the tile and inherits `currentColor`. */
export const Bare = () => (
    <div style={{ display: "flex", gap: 16, padding: 24, background: "#fff" }}>
        <div style={{ color: "#1b1916" }}>
            <Logo size={72} variant="bare" />
        </div>
        <div style={{ color: "#2742c4" }}>
            <Logo size={72} variant="bare" />
        </div>
        <div style={{ background: "#17151b", color: "#f1eee6", padding: 8, borderRadius: 6 }}>
            <Logo size={72} variant="bare" />
        </div>
    </div>
);
