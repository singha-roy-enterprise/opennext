import {
    LOGO_TILE_COLOR,
    LOGO_MARK_COLOR,
    LOGO_MARK_PATHS,
    LOGO_MARK_STROKE,
} from "@/assets/singha-roy-enterprise-logo";

export type LogoVariant = "tile" | "bare";

export interface LogoProps {
    /** Rendered width and height in pixels. Defaults to 40. */
    size?: number;
    /**
     * `"tile"` (default) — cream monogram on a filled brand tile.
     * `"bare"` — just the monogram in `currentColor`, no tile, so it inherits the
     * surrounding text colour.
     */
    variant?: LogoVariant;
    /**
     * Tile fill (ignored when `variant="bare"`). Defaults to the theme accent
     * token, so it re-tints automatically under dark mode, Catppuccin, or any
     * palette that redefines `--color-accent`. Pass any CSS colour to override.
     */
    tileColor?: string;
    /**
     * Monogram colour. Defaults to the `--logo-mark` token (falling back to
     * cream) for `"tile"`, and to `currentColor` for `"bare"`.
     */
    markColor?: string;
    /** Accessible label / tooltip. */
    title?: string;
    className?: string;
}

// Token-first defaults with a hard-coded fallback for standalone contexts (a
// bare SVG file, an email client) where the theme variables don't resolve.
const TILE_TOKEN = `var(--logo-tile, var(--color-accent, ${LOGO_TILE_COLOR}))`;
const MARK_TOKEN = `var(--logo-mark, ${LOGO_MARK_COLOR})`;

/**
 * The Singha Roy Enterprise brand mark — an "SR" monogram, by default cream on a
 * cobalt tile. Flat and two-token so it holds up from a 128px lockup down to a
 * 16px favicon on paper, dark, and white. Colours are theme-driven (accent +
 * `--logo-*` tokens) and fully overridable, and `variant="bare"` yields a
 * single-colour mark that inherits `currentColor`.
 *
 * @category Brand
 */
export function Logo({
    size = 40,
    variant = "tile",
    tileColor,
    markColor,
    title = "Singha Roy Enterprise",
    className,
}: LogoProps) {
    const tiled = variant === "tile";
    const stroke = markColor ?? (tiled ? MARK_TOKEN : "currentColor");
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title} className={className}>
            <title>{title}</title>
            {tiled && <rect x="6" y="6" width="88" height="88" rx="15" fill={tileColor ?? TILE_TOKEN} />}
            <g fill="none" stroke={stroke} strokeWidth={LOGO_MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
                <path d={LOGO_MARK_PATHS[0]} />
                <path d={LOGO_MARK_PATHS[1]} />
            </g>
        </svg>
    );
}
