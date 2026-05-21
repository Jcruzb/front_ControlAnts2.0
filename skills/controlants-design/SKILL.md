---
name: controlants-design
description: Use this skill for ControlAnts frontend tasks involving UI/UX, responsive layout, Tailwind styling, colors, branding assets, overflow fixes, cards, tooltips, modals, sheets, dashboard visuals, and mobile-first design.
---

# ControlAnts Design Skill

## Intent

Keep ControlAnts visually consistent, dark, mobile-first, and free of horizontal overflow. Use this when changing layout, visual hierarchy, cards, tooltips, modals, filters, branding, or responsive behavior.

## Palette

Base:

- App background: `#0a0d12` to `#06070a`
- Dense panels/modals: `#0d1117`
- Floating menus: `#11161d`
- Tooltips/popovers: `#111823`
- Standard card: `bg-white/[0.04]`
- Secondary surface: `bg-black/20` or `bg-black/30`
- Soft borders: `border-white/8`, `border-white/10`, `border-white/12`

Text:

- Primary: `text-white`
- Secondary: `text-slate-300`, `text-slate-400`
- Muted: `text-slate-500`
- On emerald buttons: `text-slate-950`

States:

- Primary action: `bg-blue-500`, hover `bg-blue-400`
- Success/income: `bg-emerald-400`, `bg-emerald-500/10`, `text-emerald-300`
- Error/expense: `bg-red-500/10`, `text-red-300`, `border-red-400/20`
- Warning: `bg-amber-500/10`, `text-amber-200`, `border-amber-400/20`

Dashboard category colors:

- `#22c55e`, `#06b6d4`, `#3b82f6`, `#8b5cf6`, `#f97316`, `#ef4444`, `#eab308`, `#14b8a6`

## Responsive Rules

- Design mobile-first for 320-390px; add columns only from `sm:`/`md:` upward.
- Prefer `grid-cols-1` on mobile. Use `sm:grid-cols-2`, `md:grid-cols-3`, etc. only when content fits.
- Every card/list item inside flex/grid should tolerate shrinking: `min-w-0`, `max-w-full`, and text `truncate` or `break-words`.
- Use `w-full`, not `w-screen`, inside app content.
- Avoid fixed widths on mobile. If a fixed desktop width is needed, gate it behind `sm:` or higher.
- Chips and button groups should wrap on mobile unless they are intentionally scrollable.
- Use `overflow-x-auto` only for tables/charts that truly need horizontal scrolling.
- Do not hide a layout bug with global `body { overflow-x: hidden; }` unless all component causes have been ruled out.

## Component Guidance

- Cards: rounded but not huge on small screens; `p-4` mobile, larger padding from `sm:`.
- Modals/sheets: fixed `z-50 inset-0`, `bg-black/40`, bottom sheet on mobile (`rounded-t-2xl`), centered modal on desktop.
- Tooltips: tap/click on mobile, hover/focus on desktop, `button` trigger with `aria-label` and `aria-expanded`.
- Icon buttons: use real buttons, clear accessible labels, and avoid text-only controls where an icon is standard.
- Do not place cards inside cards unless it is a repeated item, modal, or framed tool.

## Branding Assets

Vite public assets are referenced from root:

- `/favicon.svg`
- `/apple-touch-icon.png`
- `/controlants-logo.png`
- `/controlants-icon.svg`
- `/icon-192.png`
- `/icon-512.png`
- `/site.webmanifest`

Use full logo where space allows:

```jsx
<img src="/controlants-logo.png" alt="ControlAnts 2.0" className="h-10 w-auto" />
```

Use icon for compact spaces:

```jsx
<img src="/controlants-icon.svg" alt="ControlAnts" className="h-8 w-8 rounded-xl" />
```

## Validation

For UI changes, run:

- `npm run lint`
- `npm run build`

Manually reason through 320px, 390px, 768px, and desktop widths.
