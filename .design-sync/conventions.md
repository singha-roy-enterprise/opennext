# Singha Roy Enterprise — design system

Editorial print-shop aesthetic: warm paper surfaces, an ink/cobalt palette, a
Newsreader serif for display, Space Grotesk for UI text, and JetBrains Mono for
every figure, code, and micro-label. All components are pure and
presentational — **no provider or context is required**; just render them.

## Setup

- Load `styles.css` (it `@import`s the token/utility stylesheet and the
  component CSS). Nothing else is needed — there is no `ThemeProvider`, router,
  or session context.
- **Dark mode** is driven by a `.dark` class on any ancestor (e.g. `<html>`);
  the ink/cream tokens invert automatically. Don't hand-set dark colors.
- Fonts (Newsreader, Space Grotesk, JetBrains Mono) load via a webfont
  `@import` in the stylesheet — no font setup in app code.

## Styling idiom — Tailwind v4 utilities over CSS-variable tokens

Style layout and one-off tweaks with Tailwind utility classes; every component
takes a `className` that is merged (via tailwind-merge) so you can override.
Use the semantic token utilities, never raw hex:

| Purpose | Utilities |
| --- | --- |
| Surfaces | `bg-paper` (app bg), `bg-cream`, `bg-card`, `bg-surface` |
| Text | `text-ink`, `text-ink-700`, `text-ink-500`, `text-ink-300` |
| Brand / state | `text-accent` `bg-accent` `border-accent`; `text-danger` `text-success` `text-warn` (each with `bg-*/[.08]` and `border-*/40` tints) |
| Borders | `border-ink`, `border-ink/[0.18]` (hairline), `border-dashed` |
| Type | `font-serif` (display/headings + big numerals), `font-sans` (default body), `font-mono` (figures, SKUs, GSTINs, uppercase labels) |

Signature details: near-square radii (`rounded-[3px]`/`[5px]`), 1.5px ink
borders (`border-[1.5px]`), and wide-tracked uppercase mono micro-labels
(`font-mono uppercase tracking-[0.1em] text-[10px]`).

Prefer a primitive over raw markup: `Button` for any action, `TextInput`/`Field`
for inputs, `Badge` for status/role pills, `Card` for panels, `SectionLabel`
for numbered form sections, `StatCell` for metric strips, `Modal`/`Drawer` for
overlays (both render a fixed backdrop and close on `onClose`).

## Where the truth lives

Read the bound `styles.css` (and the stylesheet it imports) for the full token
and utility set, and each component's `<Name>.d.ts` for its exact prop
contract and `<Name>.prompt.md` for usage. The variant/tone enums in the
`.d.ts` are the whole surface — e.g. `Button` `variant` is one of
`primary | accent | outline | ghost | danger | link`, `Badge` `tone` is
`success | danger | warn | neutral | accent`.

## Example

```tsx
<Card variant="subtle" className="p-6">
  <SectionLabel n="01" title="Bill To" />
  <div className="grid grid-cols-2 gap-4">
    <div className="col-span-2">
      <FieldLabel>Customer Name</FieldLabel>
      <TextInput placeholder="Customer / firm name" />
    </div>
    <div>
      <FieldLabel>GSTIN</FieldLabel>
      <TextInput mono placeholder="15-character GSTIN" />
    </div>
    <div className="flex items-end">
      <Badge tone="accent">GST 18%</Badge>
    </div>
  </div>
  <div className="mt-6 flex justify-end gap-3">
    <Button variant="outline">Credit Note</Button>
    <Button variant="accent">Download Invoice</Button>
  </div>
</Card>
```
