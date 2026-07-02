# design-sync notes — Singha Roy Enterprise

Repo-specific gotchas for future `/design-sync` runs. Project:
`Singha Roy Enterprise Design System` (id `f974df39-a4a5-4fc0-9173-d3cd81ea3d7a`).

## Setup (this is a Next.js app, not a packaged library)

- **No `dist/` build.** The design system is the hand-authored primitives in
  `src/ui/`. The converter runs in synth/entry mode against the barrel
  `src/ui/index.ts` (passed as `--entry`), which walks up to the repo-root
  `package.json` for `PKG_DIR`. Build command:
  ```sh
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules ./node_modules --entry ./src/ui/index.ts --out ./ds-bundle
  ```
- **`componentSrcMap` pins the exact 10 primitives** so discovery doesn't sweep
  in the aliased `react-icons` re-exports (`src/ui/icons.tsx`) or the
  `ToastProvider` context. If you add a primitive to `src/ui`, add it to
  `componentSrcMap` too — it won't appear otherwise.
- **Prop extraction returns `{ [key: string]: unknown }`** for every component
  (ts-morph can't resolve the `forwardRef` / `extends *HTMLAttributes` shapes in
  synth mode). `dtsPropsFor` in the config supplies the real prop bodies by
  hand — **keep it in sync with the components** when their props change; it is
  the only source of the contracts the design agent sees.

## CSS + fonts

- `cssEntry` is `.design-sync/compiled.css`, a **generated** file (gitignored).
  Regenerate it before every build — the class strings live as literals in
  `src/ui/*.tsx` (so all variant/tone classes are covered) plus the previews:
  ```sh
  ./.ds-sync/node_modules/.bin/tailwindcss \
    -i ./.design-sync/ds-input.css -o ./.design-sync/compiled.css
  ```
  `ds-input.css` (committed) is the Tailwind entry; it `@source`s `../src` and
  `./previews`.
- **Fonts are substituted, not shipped.** The app self-hosts Newsreader / Space
  Grotesk / JetBrains Mono via `next/font`; the design tool has no next/font, so
  `ds-input.css` loads the same families from **Google Fonts** and defines the
  `--font-*` vars next/font would set. This shows as `[FONT_REMOTE]` (expected,
  non-blocking) — never `[FONT_MISSING]`.

## Verification

- Synced with **no render check** (Playwright/Chromium not installed;
  `--no-render-check`). Previews were verified by **human eyeball** on
  `.review.html`, not machine-grading. A future run with Playwright available
  can grade properly.

## Known render warns

- `[RENDER_SKIPPED]` — expected while `--no-render-check` is used. Not new.

## Re-sync risks (what can silently go stale)

- **`dtsPropsFor`** is hand-maintained. If a component's props change and this
  isn't updated, the design agent gets a stale contract. No check catches this.
- **`compiled.css` / fonts** depend on the Google Fonts CDN at render time and
  on the token names in `src/app/globals.css`. If globals.css tokens are
  renamed, re-check `conventions.md`'s enumerated utilities.
- **Overlay overrides** (`Modal`, `Drawer` → `cardMode:single` + fixed
  viewport) assume those components render a `fixed inset-0` backdrop; if that
  layout changes, revisit the viewport sizes.
- Grouping comes from `@category` JSDoc tags in each `src/ui/*.tsx`. Removing a
  tag drops that component back to the `general` group.
