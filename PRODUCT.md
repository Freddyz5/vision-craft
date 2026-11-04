# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Responsive web app (desktop and mobile browsers). Mobile is a supported surface, but some editor features are desktop-only by decision (multi-select); mobile must say so rather than silently omit them.

## Users

**Primary: personal goal-setters.** Spanish-speaking individuals building their own vision board — goals, intentions, the year ahead — with the end goal of a physical object: printed at home and put on a wall, door, or desk. They are not designers and are not looking for a design tool; they want to go from "I have an idea of what I want" to "it's printed" in one sitting, without signing up for anything.

No secondary audience is confirmed. Creatives making mood boards and coaches running group sessions were considered and explicitly not chosen as primary.

## Product Purpose

Vision Craft lets someone find or upload images, compose them on a real-size board, and leave with a file or a print that matches the paper they own. Success is a board that actually gets printed and used, not one that stays on screen.

The product runs as a four-step wizard, each step its own route:

1. **Explora** (`/explore`) — search Unsplash and Pexels, upload own images, or paste an image URL; multi-select.
2. **Lienzo** (`/canvas`) — choose a paper preset (A4, A3, US Letter, portrait/landscape) or a custom size.
3. **Diseña** (`/design`) — drag images onto the board; move, resize, rotate, layer; add text.
4. **Exporta** (`/export`) — PNG/JPG at 150 or 300 DPI, print on one sheet, or print as a poster tiled across several sheets.

Plus **Boards** (`/boards`): library of saved boards — open, duplicate, delete, import/export JSON.

## Positioning

All four are confirmed as identity, not features:

- **Print-first output.** Dimensions are stored in millimetres, export is DPI-aware, and a large poster can be split across A4/A3/Letter sheets for a home printer (`buildPrintConfig()` in `src/modules/Export/types.ts`). General design tools treat print as an afterthought; here it is the destination.
- **No account, local-only.** No sign-up, no login. Boards, selections, and settings live in the browser's `localStorage`. Starting instantly is part of the promise.
- **Fast and focused.** One job, four steps. Not a general design suite; scope additions must serve the vision-board-to-print path.
- **Free and open source.** MIT-licensed, public at https://github.com/Freddyz5/vision-craft.

## Operating Context

- Used alone, typically in one session, from image hunt to export. Often a reflective, personal moment (new year, life change), not a work task.
- The physical endpoint is a home or office printer and standard paper (A4/A3/US Letter). Poster mode exists because most people don't own a large-format printer.
- Boards persist per browser; switching device or clearing site data loses them unless the user exported a JSON backup.

## Capabilities and Constraints

**Confirmed capabilities:** image search (Unsplash, Pexels), image upload (Cloudinary), paste image URL, multi-select, paper presets and custom size, Konva-based editor (move, resize, rotate, z-order, text), PNG/JPG export at 150/300 DPI, single-sheet and tiled-poster print, up to 20 saved boards, JSON import/export, light and dark themes.

**Technical constraints:**

- No backend for user data. Persistence is `localStorage` only (~5 MB browser limit; saved boards capped at 20, thumbnails stored as data-URLs).
- Image search goes through the app's own server route (`/api/images`), which holds the Unsplash/Pexels keys server-side.
- **Uploaded images leave the browser:** they go unsigned to Cloudinary. "Local-only" is true of boards and user data, not of uploaded image files. Copy must not claim that nothing ever leaves the device.
- Astro SSR on Vercel, React islands, nanostores for state.

**Agreed but not yet built** (scope set 2026-11-02): interactive crop and shape masks; copy/paste/duplicate including pasting from the system clipboard; desktop-only multi-select with a mobile notice; align/distribute; image adjustments (opacity, flip, filters); frames, borders, shadow; layers panel; lock; context menu; collage templates; wheel/pinch zoom and pan. Background removal is wanted but postponed. Rotation snapping was rejected.

**Roadmap, not committed:** V2 — backend, cloud save, authentication, share by link. V3 — templates, AI image generation, guided vision boards, community. When V2 lands, "no account" has to stay a valid way to use the product, or the positioning above must be revisited with the owner.

**Open product facts:**

- Photographer/source attribution for Unsplash and Pexels images is not captured today (`NormalizedImage` has no author field). Both providers' API guidelines expect credit; how and where to show it is undecided.

## Brand Commitments

- **Name:** Vision Craft (written as two words; wordmark splits "Vision" / "Craft").
- **Language:** Spanish only. All UI and marketing copy is in Spanish (`lang="es"`); no translation is planned. Step names are fixed: Explora, Lienzo, Diseña, Exporta.
- **Voice (from existing copy):** direct, warm, second person (tú), practical. Talks about outcomes ("listo para imprimir", "un board que puedas usar de verdad") rather than features for their own sake. "Board" is used as-is alongside "tablero" and "lienzo".

## Evidence on Hand

- App screenshots of every step, light and dark: `public/{explore,canvas,design,export}_{light,dark}.png`.
- Hero imagery: `public/day_lens.webp`, `public/night_lens.webp`.
- Public source code and MIT license.
- `src/modules/Landing/components/CtaSection.astro` references `/minimal_serenity.png`, which does not exist in `public/`.

**Absent — do not fabricate:** user counts, testimonials, reviews, press, case studies, usage metrics, partner or customer logos, ratings. Nothing about cloud sync, sharing, or accounts may be presented as available until it ships.

## Product Principles

1. **The print is the product.** Every decision is judged by what ends up on paper. Real units, honest previews of how the print will look, and no surprises at the printer outrank on-screen flourish.
2. **Zero to board without a gate.** No account, no onboarding wall, no required configuration before the first image is on the board. Any future account feature must be optional.
3. **One job, done completely.** New capability earns its place by shortening or improving the path from idea to printed board, not by moving toward a general-purpose editor.
4. **Honest about where data lives.** Be clear that boards are stored in this browser, that uploads go to Cloudinary, and that clearing site data or switching devices loses unsaved work. Make the JSON backup easy to find.
5. **Made for someone who isn't a designer.** Good defaults and forgiving interactions over power-user density. Desktop may expose more; mobile must name what it leaves out.
