import {
    LOGO_TILE_COLOR,
    LOGO_MARK_COLOR,
    LOGO_MARK_PATHS,
    LOGO_MARK_STROKE,
} from "@/assets/singha-roy-enterprise-logo";

export interface LogoProps {
    /** Rendered width and height in pixels. Defaults to 40. */
    size?: number;
    /** Accessible label / tooltip. */
    title?: string;
    className?: string;
}

/**
 * The Singha Roy Enterprise brand mark — an "SR" monogram in cream on a cobalt
 * tile. Flat and two-token so it holds up from a 128px lockup down to a 16px
 * favicon, on paper, dark, and white. Pure SVG; scale it with `size`.
 *
 * @category Brand
 */
export function Logo({ size = 40, title = "Singha Roy Enterprise", className }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title} className={className}>
            <title>{title}</title>
            <rect x="6" y="6" width="88" height="88" rx="15" fill={LOGO_TILE_COLOR} />
            <g
                fill="none"
                stroke={LOGO_MARK_COLOR}
                strokeWidth={LOGO_MARK_STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={LOGO_MARK_PATHS[0]} />
                <path d={LOGO_MARK_PATHS[1]} />
            </g>
        </svg>
    );
}
