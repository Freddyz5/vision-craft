---
name: Vision Craft
description: A bright, calm studio where the photos carry the color and violet marks what you can act on.
colors:
  violet: "#7c3aed"
  violet-night: "#a78bfa"
  lagoon: "#14b8a6"
  lagoon-night: "#2dd4bf"
  marigold: "#f59e0b"
  marigold-night: "#fbbf24"
  studio-mist: "#f9fafb"
  paper: "#ffffff"
  graphite-ink: "#111827"
  pewter: "#6b7280"
  hairline: "#e5e7eb"
  well: "#f3f4f6"
  midnight: "#0f172a"
  slate-surface: "#1e293b"
  moonlight-ink: "#f9fafb"
  slate-muted: "#94a3b8"
  night-hairline: "#374151"
  night-well: "#1f2937"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 900
    lineHeight: 1.05
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  control:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  nav:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.2em"
rounded:
  control: "8px"
  tile: "12px"
  card: "16px"
  panel: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-night:
    backgroundColor: "{colors.violet-night}"
    textColor: "{colors.midnight}"
  button-cta:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "10px 32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  nav-step:
    textColor: "{colors.pewter}"
    typography: "{typography.nav}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  nav-step-current:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
  step-badge:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    size: "20px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "16px"
  side-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "20px"
    width: "384px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  image-tile:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
  kicker-chip:
    textColor: "{colors.lagoon}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Vision Craft

## Overview

**Creative North Star: "The Bright Studio"**

Vision Craft is a clean, well-lit workspace. Like a photographer's studio with white walls and good light, the interface stays calm so the photos can be loud. The chrome is near-white in light mode (deep midnight navy in dark mode), the text is graphite, and one violet tells you where to act. Everything colorful on screen should be the user's own images.

The personality is soft and confident: generous pill-shaped controls, semibold labels, rounded cards with hairline borders, and big heavy headings that settle each page in two lines. Density is relaxed. This is a four-step wizard for someone who isn't a designer, so each screen carries one main idea, one primary action, and plenty of air. Surfaces rest flat; lift and shadow appear only as feedback.

Two themes are first-class. Every color token has a night twin, and the theme is a class on `<html>` (`.dark`, persisted as `df-theme`). The night theme is midnight navy with slate surfaces, not inverted gray.

**Key Characteristics:**

- Neutral, bright chrome; the photos supply the color.
- One violet (#7c3aed / #a78bfa at night) for action, selection, and current state.
- A violet-to-teal gradient used only on the single main forward button on a screen.
- Inter throughout, in heavy display weights over quiet small labels.
- Pills for controls, soft 16–24px rectangles for containers.
- Flat at rest; lift and violet-tinted shadow only on hover, selection, or floating layers.

## Colors

A neutral studio palette (gray in daylight, slate and navy at night) with one saturated violet doing almost all the signalling.

### Primary

- **Studio Violet** (#7c3aed; night: #a78bfa): the action color. Primary buttons, the current step in the stepper, selected image tiles and preset cards (2px ring or border), check badges, the second line of every page heading, focus outlines, and checkbox accents. At low opacity (5–15%) it tints selected-card backgrounds and the "Agregar texto" control; at 20–40% it makes the soft violet borders on side panels and hover rings.

### Secondary

- **Lagoon Teal** (#14b8a6; night: #2dd4bf): the far end of the main-CTA gradient, the landing hero's kicker chip, and a faint ambient glow behind the hero. It never appears as a solid button or a body-text color.

### Tertiary

- **Marigold** (#f59e0b; night: #fbbf24): the **print-warning** color, and only that. In the Design editor it marks what would go wrong on paper: amber dashed outlines on the sheet (#d97706, so it holds 3:1 on white), the warning count badge, and warning text in the print list (`df-warning`, #b45309 by day for 4.5:1 on white; #fbbf24 at night). Nothing decorative uses it.

### Neutral

- **Studio Mist** (#f9fafb): the page background in light mode, behind every module.
- **Paper White** (#ffffff): cards, side panels, the search field, modals.
- **Graphite Ink** (#111827): headings and primary text.
- **Pewter** (#6b7280): secondary text, descriptions, small labels, inactive steps, idle icons.
- **Hairline Gray** (#e5e7eb): 1px borders on cards, the top nav's bottom edge, page-footer rule.
- **Well Gray** (#f3f4f6): hover fill on ghost controls, the inset well behind preset shapes and board thumbnails.
- **Midnight Navy** (#0f172a): page background at night.
- **Slate Surface** (#1e293b): cards and panels at night.
- **Moonlight Ink** (#f9fafb): primary text at night.
- **Slate Muted** (#94a3b8): secondary text at night.
- **Night Hairline** (#374151): card borders at night, usually at 60% opacity.
- **Night Well** (#1f2937): hover fill and inset wells at night.

### Named Rules

**The Photos Carry the Color Rule.** The chrome stays neutral. Violet is the only interface hue a user should notice; if a screen looks colorful before any images load, something is over-decorated.

**The One Gradient Rule.** The violet-to-teal gradient (`linear-gradient(to right, violet, lagoon)`) is reserved for the single main forward action on a screen: "Crear mi primer board", "Armar Board", the advance-to-export button, the print confirm. One per screen. Every other primary button is solid violet.

**The Night Twin Rule.** Every `df-*` color is written with its `-dark` twin (`bg-df-surface dark:bg-df-surface-dark`). A light token used alone is a bug in night mode.

**The Ink-on-Violet Rule.** At night, text and icons on a filled Studio Violet (night) or on the night gradient are Midnight Navy (`text-white dark:text-df-on-primary-dark`), never white: white on #a78bfa is 2.7:1 and on #2dd4bf 1.8:1, while Midnight gives 7:1 and 9.7:1. A large violet panel that holds white copy at several opacities (the print-options panel, the landing feature card) keeps the day violet (#7c3aed) at night instead, where white reads at 5.7:1.

**Known drift (UI pass):** `df-border`, `df-border-dark`, `df-surface-alt` and `df-surface-alt-dark` are referenced (search bar divider, upload dropzone, selected-images modal, print-preview modal) but never defined in `src/assets/app.css`, so those borders and fills render as nothing. Hairline and Well now exist as `df-hairline` / `df-well` (with `-dark` twins) and the Design editor uses them; move the other screens off raw Tailwind grays and the undefined names onto these. One panel hardcodes `#161f30` at night, and one element hardcodes `#20d4a4`.

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Inter (same stack)

**Character:** One family, two volumes. Headings are set very heavy (800–900) and tight so each page lands with a single confident statement; everything else is small, regular-weight, and quiet. The contrast in weight, not a second typeface, creates the hierarchy.

### Hierarchy

- **Display** (900, 2.25rem → 3rem at sm → 3.75rem at lg, line-height 1.05): the landing hero only.
- **Headline** (800, 1.875rem → 2.25rem at sm → 3rem at lg, line-height 1.1): the page heading of each wizard step, always two lines (see rule below). Landing section headings use bold (700) at 1.875–2.25rem.
- **Title** (700, 1rem): card titles, board names, option labels in export choices.
- **Body** (400, 0.875rem, line-height 1.625): descriptions and help text, capped around `max-w-sm`/`max-w-md` (24–28rem). Marketing paragraphs step up to 1rem.
- **Control** (600, 0.875rem): button labels. Navigation steps use 500.
- **Label** (700, 10px, letter-spacing 0.2em, uppercase): eyebrows and section labels in Pewter, e.g. "PASO 03 / DISEÑA", "TUS IMÁGENES (3)", "CÓMO QUIERES EXPORTAR". Tracking ranges 0.15–0.25em.

### Named Rules

**The Violet Second Line Rule.** A wizard step's page heading is two lines: a plain Graphite line, then a violet line that ends with a period ("Diseña tu / **Visión.**"). The eyebrow above it names the step. Don't add a third line or move the violet to the first line.

**The Editor Exception.** The Design step is a full-screen tool, so it trades the two-line heading for a one-line 48px header: "Paso 03 · Diseña", the board's editable name, the paper ("A4 vertical · 21 × 29,7 cm") and "Guardado en este navegador". No footer on that step either; the sheet gets the whole screen.

**The Whisper Label Rule.** Section labels are tiny, bold, uppercase, widely tracked, and muted. They organize, they don't compete. Headings shout; labels whisper; nothing sits loudly in between.

**Known drift (UI pass):** micro-labels go down to 9px in a few places (preset "Defecto" badge, provider legend). 10px is the floor in practice; 9px reads poorly and should come up.

## Layout

- **Shell:** a fixed 56px top bar (logo, stepper, Tableros link, theme toggle) on a translucent surface with `backdrop-blur`, then a full-height main on Studio Mist with 56px top padding.
- **Page gutter:** 16px on phones, 32px from 640px up. Page headers sit at the top-left with 24–40px vertical padding.
- **Wizard steps (lg and up, ≥1024px):** two columns. The working area (gallery, board, preview) fills the left; a 384px sticky side panel sits on the right at 96px from the top, pulled up alongside the page heading. Below 1024px the panel stacks under the content; in the Design step it becomes a bottom sheet.
- **Explore gallery:** a dense masonry-style grid of image tiles (portrait images span two rows, landscape span two columns), 8–16px gaps. A floating selection bar is pinned 24px from the bottom, centered.
- **Landing:** centered containers at 64–72rem (`max-w-5xl`/`max-w-6xl`), sections with roughly 80px vertical padding.
- **Spacing rhythm:** 8 / 12 / 16 / 24 / 32px carry almost everything (8px is the most common gap). 4px only inside tight clusters (icon + text, badge stacks).
- **Stepper responsive:** below 1024px only the current step pill shows, flanked by previous/next arrows; the full four-step row with connector lines appears at lg.
- **Breakpoints:** Tailwind defaults: 640 / 768 / 1024 / 1280px.

## Elevation & Depth

Flat by default. Surfaces separate from the page through a white-on-mist (or slate-on-navy) value shift plus a hairline border, with at most a whisper of shadow (`shadow-sm`). Depth is reserved for state and for layers that float above the page.

### Shadow Vocabulary

- **Rest** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): cards, the search field, solid buttons. Barely there.
- **Lift** (`box-shadow: 0 10px 15px -3px rgb(124 58 237 / 0.1), 0 4px 6px -4px rgb(124 58 237 / 0.1)` with `translateY(-2px)`): a hovered or selected tile or preset card. The shadow is tinted violet, not black.
- **Glow** (`box-shadow: 0 25px 50px -12px rgb(124 58 237 / 0.3)`): the gradient CTA only.
- **Float** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): modals and the floating selection bar, which sit above the page on a blurred 80% Studio Mist scrim.
- **Ping** (`ring-pulse`: 0 → 28px violet ring fading out, 1.5s ease-out, infinite): the floating selection bar's attention pulse. The only looping animation in the product.

### Named Rules

**The Flat-By-Default Rule.** At rest, a surface gets a hairline border and nothing heavier than Rest. Lift appears as a response to hover or selection; Float only for things that genuinely sit above the page. A card with `shadow-lg` at rest is wrong.

**The Violet Shadow Rule.** Shadows that signal selection or action are tinted violet (10–30%). Neutral black shadows are only for floating layers.

## Shapes

Two shape families with distinct meanings. **Controls are pills** (9999px): buttons, step links, the Tableros link, the theme toggle, kicker chips, badges, avatars, the floating selection bar. **Containers are soft rectangles**: image tiles and cards at 16px, side panels and modals at 24px, small inset tiles at 12px. 8px appears only on a few compact controls. Borders are 1px hairlines at rest; selection steps up to a 2px violet ring or border. Preset cards draw the paper's real proportions as a small 2px-bordered rectangle, the one place geometry carries data.

**The Pill Means Press Rule.** If it's fully rounded, it's interactive or it's a status mark. Containers never become pills, and primary buttons never drop to square-ish corners.

## Components

### Buttons

Soft and confident: rounded pills, semibold labels, an unmistakable violet.

- **Shape:** fully rounded pill (9999px).
- **Primary:** Studio Violet fill, white 0.875rem/600 label, 10px × 20px padding, Rest shadow. Icon and label separated by 8px.
- **Main CTA (gradient):** violet-to-teal gradient left to right, white bold label, 10–12px × 32px padding (up to 1.125rem text on the landing hero), Glow shadow, `active:scale(0.95)`. One per screen (One Gradient Rule).
- **Hover / Focus:** hover drops opacity to 90% (150ms); focus-visible is a 2px violet outline offset by 2px. Disabled is 50–60% opacity with a not-allowed cursor.
- **Outline:** transparent fill, 1px border, Graphite label, same pill and padding, hover to 70% opacity. The destructive variant swaps to a red border and red text.
- **Ghost / icon:** circular, Pewter icon, Well Gray fill on hover. Used for the theme toggle, stepper arrows, close buttons.

### Chips

- **Kicker chip (landing):** Lagoon text, 1px Lagoon border at 30%, pill, 4px × 12px, label typography ("EXPLORA · LIENZO · DISEÑA · EXPORTA").
- **Default badge:** a tiny violet pill pinned on the top edge of a preset card ("Defecto").

### Cards / Containers

- **Corner Style:** 16px for cards and tiles, 24px for side panels and modals.
- **Background:** Paper White (Slate Surface at night).
- **Shadow Strategy:** Rest at most; Lift on hover/selection (see Elevation).
- **Border:** 1px Hairline Gray; side panels and saved-board cards use a 2px violet border at 20–40%.
- **Internal Padding:** 16px (cards), 20px (side panels), 24px (landing feature cards).

### Inputs / Fields

- **Search field:** a whole-row Paper White container, 16px corners, 1px Pewter border, Rest shadow, 12px × 16px padding, a leading search icon in Pewter, and a borderless transparent input inside. Provider checkboxes share the row behind a small label legend.
- **Focus:** buttons and tiles use the 2px violet outline. **Known drift:** the search input is `outline-none` and its container has no `focus-within` state, so keyboard focus is invisible there.
- **Checkboxes:** native, 16px, accent Studio Violet.
- The Design editor's controls (floating item toolbar, sheet toolbar, print list) are built on `df-*` tokens: pill buttons on Paper/Slate, Hairline borders, Well hovers, violet focus. The old DaisyUI inspector is gone.

### Navigation

- **Top bar:** 56px, translucent surface (20% Paper) with backdrop blur and a hairline bottom border. Logo "Vision Craft" in violet, bold, left.
- **Stepper:** four step links as pills (0.875rem/500). The current step is solid violet with a white label and a translucent white number badge. Completed steps show a 20px violet badge with a check, label in Graphite. Upcoming steps are Pewter with a Well Gray number badge. Steps are joined by 24px hairline connectors at lg. Previous/next are circular ghost arrows.
- **Tableros:** a pill link on the right that turns solid violet when active. Off-wizard (on /boards), step badges show the step icon instead of a number and the steps are not links.

### Image Tile (signature)

The photo is the hero; the frame is quiet. A 16px-cornered button filled edge-to-edge with the image (`object-fit: cover`), a 1px muted ring at rest. On hover it lifts 4px, the photo zooms to 104% over 500ms, a 15% black veil fades in, and a frosted white check-circle appears in the center. When selected, the ring becomes 2px violet, the tile lifts 2px with a violet-tinted shadow, and a solid violet check badge sits in the top-right corner.

### Floating Selection Bar (signature)

A Paper White pill (Slate Surface at night) with the Float shadow, fixed 24px from the bottom and centered, holding an overlapping avatar stack of the selected photos, a "3 IMÁGENES / SELECCIONADAS" count in label typography, a hairline divider, and the gradient "Armar Board" CTA. A violet Ping ring pulses behind it to say "you can move on".

### Preset Card (signature)

A button card (16px corners, 2px border) with a 48px Well Gray tile holding the paper's actual proportions drawn as a small rectangle. The label sits below in 0.75rem/600, the dimensions in 10px Pewter. Selected: violet border and rectangle, 5% violet wash, Lift. The custom-size card draws a dashed square with a plus.

### Toast

Bottom-right, white text on a success fill with a check icon and a large shadow. **Known drift:** it uses DaisyUI's green `alert-success`, which sits outside the palette.

## Do's and Don'ts

### Do:

- **Do** keep the chrome neutral (Studio Mist / Paper White / Graphite / Pewter) and let violet mark only action, selection, and current state.
- **Do** write every `df-*` color with its `-dark` twin, and check both themes.
- **Do** use pills for anything pressable and 16px / 24px rounded rectangles for anything that contains.
- **Do** keep surfaces flat at rest (hairline + Rest shadow at most); add Lift (−2px, violet-tinted shadow) only on hover or selection.
- **Do** set step headings as two lines with the violet, period-ended second line, under a 10px tracked uppercase eyebrow.
- **Do** use a 2px violet ring or border for selected states, plus a violet check badge when the item is a photo.
- **Do** give every interactive element a visible focus state: 2px violet outline, 2px offset.
- **Do** use `df-*` tokens for new UI; when a needed token doesn't exist (border, alt surface), add it to `@theme` in `src/assets/app.css` rather than reaching for raw Tailwind grays or hex.

### Don't:

- **Don't** use the violet-to-teal gradient on more than one button per screen, or on anything that isn't the main forward action.
- **Don't** use Marigold for anything but print warnings.
- **Don't** use DaisyUI stock component classes (`btn-outline`, `select-bordered`, `alert-success`, `bg-base-*`) for new UI; they're off-system drift.
- **Don't** reference undefined tokens (`df-border`, `df-surface-alt`, `animate-fade-in`, `animate-fade-in-up`); they silently render nothing.
- **Don't** put heavy shadows (`shadow-lg` and up) on resting cards; those belong to Lift, Glow, and Float.
- **Don't** make containers pill-shaped or give primary buttons small square-ish corners.
- **Don't** add decorative color to the chrome (tinted section backgrounds, colored icons, multicolor badges); the photos are the color.
- **Don't** go below 10px for any text.
