# Traceo — Design Context

## Color System (OKLCH)
- **Brand**: `oklch(0.45 0.16 255)` — slate-blue, authoritative, precise
- **Brand hover**: `oklch(0.40 0.18 255)`
- **Brand subtle**: `oklch(0.94 0.04 255)` — for backgrounds, badges
- **Background**: `oklch(0.98 0.005 240)` — near-white with cool tint
- **Surface**: `oklch(1 0 0)` — pure white for cards/panels
- **Text primary**: `oklch(0.15 0.02 240)` — near-black
- **Text secondary**: `oklch(0.45 0.015 240)` — muted labels
- **Success**: `oklch(0.55 0.18 155)` — for "Aktif" status
- **Warning**: `oklch(0.68 0.18 70)` — for "Tertunggak" status
- **Danger**: `oklch(0.55 0.22 25)` — for "Tindakan Guaman" status

## Typography
- **Font**: Inter (Google Fonts) — clean, highly legible for data-heavy screens
- **Scale**: 12px (xs/labels) → 14px (body/sm) → 16px (default) → 20px (page titles)
- **Weight**: 400 (body), 500 (labels/secondary), 600 (headings/emphasis)
- **Tracking**: `-tight` on headings, normal on body
- **Tabular nums**: Always use `tabular-nums` on currency and number columns

## Spacing & Layout
- **Page max-width**: 5xl (64rem) for content, 6xl for wide tables
- **Card padding**: 16–20px
- **Section gaps**: 20–24px
- **Border radius**: 6px (sm), 10px (md/inputs), 14px (lg/cards), 18px (xl)

## Components

### Status badges
- Pill shape, 2 colors (bg + text from same hue family)
- Never use generic red/green — use OKLCH status tokens
- Size: text-xs, px-2 py-0.5, rounded-full

### Tables
- Header: `text-xs uppercase tracking-wider` muted
- Rows: `hover:bg-surface-raised` with `transition-colors duration-100`
- Dividers: subtle `border-[var(--color-border)]`
- Currency columns: always `tabular-nums`

### Forms / Inputs
- Height: 40px (h-10)
- Border: `border-[var(--color-border)]` → focus: brand color + subtle ring
- No floating labels — use above-input labels
- Error state: red border + error message below with icon

### Buttons
- Primary: brand bg + white text + shadow-sm
- Secondary: border + surface bg + primary text
- Destructive: danger color
- All: rounded-md, h-10 full forms, h-9 inline
- Disabled: opacity-60

### Timeline (Susulan)
- Left-side vertical line with numbered dots
- Each entry is a surface card with shadow-sm
- Date in brand color, bold

## Forbidden anti-patterns
- ❌ Purple/violet gradients (use brand slate-blue instead)
- ❌ Warm beige backgrounds (use cool near-white oklch 0.98 0.005 240)
- ❌ Nested cards (max 1 level deep)
- ❌ Decorative status dots without meaning
- ❌ Generic button labels ("Submit", "Save", "OK")
- ❌ Excessive shadows or depth

## Motion
- Transitions: 150ms duration, ease-in-out
- Hover: subtle bg change, no scale transforms on form elements
- Loading states: spinner with opacity, no full-page overlays
- Page transitions: rely on Next.js defaults

## Responsive
- Desktop first (this is primarily a desktop admin tool)
- Mobile: sidebar collapses, tables become scrollable, cards stack vertically
- Min touch target: 44px for interactive elements
