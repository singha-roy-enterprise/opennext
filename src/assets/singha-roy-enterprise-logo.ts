/**
 * The Singha Roy Enterprise brand mark: an "SR" monogram in cream on a cobalt
 * rounded-square tile. Flat and two-token (accent + cream) so it stays legible
 * from a 128px header down to a 16px favicon, on paper, dark, and white.
 *
 * The geometry is authored once, in a 0–100 coordinate space, and shared by two
 * consumers: the raw {@link singhaRoyEnterpriseLogo} SVG string (DOM) and the
 * path constants below (the pdf-lib invoice renderer, which has no SVG parser).
 */

/** Coordinate space every path constant is authored in. */
export const LOGO_VIEWBOX = { width: 100, height: 100 };

/** Brand colours as `#rrggbb`. */
export const LOGO_TILE_COLOR = "#2742c4"; // accent (cobalt)
export const LOGO_MARK_COLOR = "#f1eee6"; // cream

/** Rounded-square tile path (filled with {@link LOGO_TILE_COLOR}). */
export const LOGO_TILE_PATH =
    "M21 6 H79 A15 15 0 0 1 94 21 V79 A15 15 0 0 1 79 94 H21 A15 15 0 0 1 6 79 V21 A15 15 0 0 1 21 6 Z";

/**
 * The "S" and "R" as stroked centre-lines (no fill) — stroke them in
 * {@link LOGO_MARK_COLOR} at {@link LOGO_MARK_STROKE} with round caps/joins.
 */
export const LOGO_MARK_PATHS = [
    "M45 40 C45 32 29 32 29 41 C29 49 45 50 45 59 C45 68 29 68 29 60",
    "M55 69 L55 32 L65 32 A11 11 0 0 1 65 54 L55 54 M57 53 L73 69",
];

/** Stroke width of {@link LOGO_MARK_PATHS}, in viewBox units. */
export const LOGO_MARK_STROKE = 9.5;

/** Raw SVG markup for the brand mark (used by DOM previews and the favicon). */
export const singhaRoyEnterpriseLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Singha Roy Enterprise">
  <rect x="6" y="6" width="88" height="88" rx="15" fill="${LOGO_TILE_COLOR}"/>
  <g fill="none" stroke="${LOGO_MARK_COLOR}" stroke-width="${LOGO_MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${LOGO_MARK_PATHS[0]}"/>
    <path d="${LOGO_MARK_PATHS[1]}"/>
  </g>
</svg>`;
