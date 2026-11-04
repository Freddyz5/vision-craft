# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun** (`bun.lock` committed; CI uses `bun install --frozen-lockfile`).

```bash
bun install          # install dependencies
bun run dev          # start Astro dev server
bun run build        # production build (astro build)
bun run preview      # preview the production build
bun run lint         # eslint .
bun run lint:fix     # eslint . --fix
bun run format       # prettier --write .
bun run format:check # prettier --check .
```

There is no test suite yet — the `Run tests` step in `.github/workflows/release-prod.yml` is commented out. `bunx tsc --noEmit` isn't wired into CI either and still reports a few old errors outside the editor.

Requires Node >= 22.12.0. Two env vars back the image-search API and must be set locally (`.env`) and in Vercel: `PEXELS_API_KEY`, `UNSPLASH_CLIENT_ID`. Two more back Cloudinary image uploads, `PUBLIC_CLOUDINARY_CLOUD_NAME` and `PUBLIC_CLOUDINARY_UPLOAD_PRESET` — unlike the two above these are client-exposed (`PUBLIC_` prefix, required by Astro/Vite to reach the browser bundle) and unsigned, no API secret involved.

Pre-commit runs `lint-staged` via Husky (`eslint --fix` + `prettier` on staged `.js/.jsx/.ts/.tsx/.astro`, `prettier` on `.json/.md/.css`).

## Release flow

Semantic-release runs only on push to `prod` (see `.github/workflows/release-prod.yml`), driven by conventional commit messages, and deploys to Vercel afterwards. PRs into `dev`/`prod` only run build/CI, not release. There is no `test` step currently wired into CI.

## Architecture

Astro (SSR, `output: 'server'`, `@astrojs/vercel` adapter) shell with React islands for interactivity, single global layout at `src/layouts/Layout.astro`. Styling is Tailwind v4 + DaisyUI, with a custom `df-*` color palette and a `dark` class toggled via a pre-hydration inline script (persisted under the `df-theme` localStorage key — unrelated to the app's own persistent stores).

### User flow / route-to-module mapping

Each route in `src/pages/*.astro` renders exactly one module shell from `src/modules/<Name>/index.astro`, which wraps a React entry component in `shared/components/StudioLayout.astro`. Islands that derive entirely from `localStorage` (`DesignEditor`, `ExportPanel`, `CanvasSetup`, `BoardsManager`) are `client:only="react"`; the rest are `client:load`. The product flow is a 4-step wizard:

1. **Explore** (`/explore`) — search & multi-select images from external providers.
2. **Canvas** (`/canvas`) — pick a paper preset or custom size for the board.
3. **Design** (`/design`) — the print-proof editor: place photos and text on the sheet, crop, shape, adjust, frame, lay out a collage (see "Design editor" below).
4. **Export** (`/export`) — download PNG/JPG, or print on one sheet or as a tiled poster across multiple sheets.

Outside the wizard: `/boards` (`Boards` module — the saved-boards library: open, duplicate, delete, JSON import/export) and `/` (`Landing` module, `.astro` only, no React).

Each module folder follows the same shape: `index.astro` (page shell), `components/`, and a `types.ts` that mostly **re-exports** the shared domain types from `shared/store/canvasStore.ts` plus a few module-local UI types — the source of truth for the data model lives in the store, not in the module. Modules add `hooks/` and `utils/` when they need them.

### State: nanostores, not React context

All cross-module/cross-page state lives in `src/shared/store/*` as nanostores, read in React components via `useStore()` from `@nanostores/react`:

- `boardStore.ts` — `selectedImagesStore` (images selected in Explore), `recentImagesStore` and `uploadedImagesStore`, all persisted.
- `canvasStore.ts` — the core domain store: `activeCanvasConfigStore` (paper size/orientation/name, dimensions always stored in **mm**), `activeCanvasItemsStore` (the placed images/text on the active board), `activeCanvasIdStore` (which saved board this is; saving updates it by id), `savedCanvasesStore` (max 20 saved boards), `activeCanvasExportedStore`. Also owns the mutation API: single-item (`addItem`, `updateItem`, `bringToFront`/`sendToBack`), batch (`updateItems`, `removeItems`, `duplicateItems`, `insertItemCopies`, `reorderItems`, `moveItemsOneLayer`, `bringItemsToFront`/`sendItemsToBack`) and boards (`saveCurrentCanvas`, `loadCanvas`, `duplicateCanvas`, `deleteCanvas`, `exportJson`/`importJson`). Prefer adding new canvas mutations here rather than mutating the store directly from components.
- `canvasHistory.ts` — undo/redo for the active items: it listens to `activeCanvasItemsStore` and coalesces writes within 500 ms into one step. Anything that touches several items must go through a batch mutation (one store write = one undo step), never a loop of `updateItem`.
- `canvasImages.ts` — non-persistent `map` of every image a stage loads (status + natural size), shared by the Konva render, the print list and the print-quality checks.

Persisted stores use `persistentAtom` (`@nanostores/persistent`) with explicit `JSON.stringify`/`JSON.parse` encode/decode — this is the only persistence layer (no backend); everything lives in `localStorage`.

Canvas geometry note: stores keep the sheet in millimetres and items in logical px at 96 dpi; components convert with `MM_TO_PX = 96 / 25.4` (`Canvas/constants/presets.ts`). Items are drawn multiplied by a `scaleFactor`; the Konva Stage itself is never scaled.

Besides position and size, a `CanvasItem` has these optional fields, all defined next to it in `canvasStore.ts`: `crop` (fractions of the natural photo, so it survives a URL changing resolution), `shape`, `adjust` (opacity, flip, filter, brightness, contrast, blur), `frame` (border, polaroid, shadow), `hidden` and `locked`. Old saves have none of them, and older ones have no `type` — use `isTextItem()` and `TEXT_DEFAULTS` rather than reading those fields raw.

### Design editor

Layout ("Prueba de impresión"): `EditorHeader` over `PhotosPanel` (Fotos / Plantillas) | the sheet (`SheetToolbar`, `SheetRuler`, `KonvaCanvas`) | `PrintList`, with `ItemToolbar` floating over the selection. Below `lg` the list is a drawer; below `md` the panels open over the sheet and the toolbar docks at the bottom. `DesignEditor` only orchestrates.

- **Selection** is an array of ids and one Konva `Transformer` handles it. Konva fires drag events on every node of the transformer, so only the "lead" node acts (`leadDragIdRef` in `KonvaCanvas`), and groups don't snap.
- **`ItemToolbar` is the only home of an item's actions.** Menus are `ToolPopover`s; `useToolbarRoving` gives the toolbar its arrow-key focus and skips anything inside an open panel.
- **`PrintList`** doubles as the layer panel (drag to reorder, hide, lock) and shows the warnings from `utils/printChecks.ts` (`load-error`, `outside`, `margin`, `low-quality`), each with a `hint` saying how to fix it.
- **Keyboard:** `useEditorShortcuts` is the single key listener, `useEditorClipboard` handles copy/paste (a per-tab copy in `sessionStorage`, and images pasted from the system), `useViewportNavigation` handles zoom toward the pointer and panning. Write a shortcut in the UI with `shortcut()` (`utils/shortcuts.ts`), which spells it for the person's keyboard.
- **Mobile scope is deliberate:** crop, shape, layers and lock work on touch; the rest is listed in `DESKTOP_ONLY_FEATURES` (`DesktopOnlyChip`), which must stay in sync with what `ItemToolbar` hides when docked.

### Rendering and export

`shared/components/CanvasItemShape.tsx` is the one renderer for the editor, the Export preview and print: a new item property is added there, never per surface. That's what keeps paper identical to the screen.

`captureStage()` (`shared/utils/stageCapture.ts`) is the only way to rasterize a stage. It hides Transformers and nodes named `EDITOR_ONLY`, renders at a `pixelRatio` given per logical px (so the on-screen zoom never changes the output) and composites JPEG on white. Filtered photos are cached at screen sharpness while editing, because full-size caches exhaust mobile Safari's canvas memory, and re-cached at export resolution only for the capture.

Printing is raster: `ExportPanel` captures one JPEG per page from the Export stage at `PRINT_DPI` (250; higher overflows Safari's canvas limit on A3) and `Export/utils/printHelpers.ts` wraps them in the print HTML.

Images load with `crossOrigin` so the stage can be exported, which means a URL served without CORS headers ends as status `"error"`: it shows a placeholder and a print warning.

### Image providers proxy through a server API route

`src/modules/Explore/services/{unsplash,pexels}.ts` never call the third-party APIs directly — they fetch `/api/images?provider=...` (`src/pages/api/images.ts`), an Astro server route that holds the API keys server-side via `import.meta.env` and normalizes both providers' responses into the shared `NormalizedImage` shape. `Explore/constants/providers.ts` is the registry mapping a provider id to its `getImages` function; add new providers there plus a branch in `api/images.ts`.

User-uploaded images are the one exception: `Explore/services/cloudinary.ts` uploads unsigned directly from the browser to Cloudinary's REST API (no `/api/images` involved, no server secret — see `PUBLIC_CLOUDINARY_*` env vars above) and normalizes Cloudinary's response into the same `NormalizedImage` shape. It's surfaced via `Explore/components/UploadDropzone.tsx`, not through the `providers.ts` registry (that registry is shaped around search — `getImages(query, page)` — which upload isn't). Pasted links also skip the registry: `Explore/services/imageLink.ts`, via `PasteImageLinkForm.tsx`, resolves Unsplash and Pexels photo pages through `/api/images` and uses any other image URL as is.

### Export/print math

`Export/types.ts` contains `buildPrintConfig()`, which computes poster-mode tiling: given the canvas size (mm) and a paper preset (A4/A3/US Letter, portrait or landscape), it derives the grid (`cols`/`rows`), the scale needed to fully cover the poster area, and per-tile offsets — this is the one place with non-trivial layout math and is a good reference before touching poster/print UI.

### Icons

Two icon sets are in use by convention: `lucide-astro` for `.astro` files, `lucide-react` for `.tsx` islands. Don't hand-roll new icon components under `shared/icons/`.

## Refactor status (code-quality pass)

Tracking a broader "professionalize the codebase" effort, done incrementally, phase by phase:

- [x] **Quick wins**: `lang="es"` fix, dead code archived as `.bak`, `contants/likns` typo → `constants/links`, `SearcBar` typo fixed, ESLint (flat config) + Prettier + Husky/lint-staged set up.
- [x] **Icons**: migrated everything to `lucide-react`/`lucide-astro` (see Icons section above).
- [x] **Componentización**: `useCanvasItemInteractions` + `KonvaCanvasItem` unify images and text; `ExportPanel` split into `ExportCanvasPreview`/`ExportPrintOptions`/`ExportDownloadOptions`/`PrintPreviewModal` plus `usePosterPrintConfig`/`useWallPreviewCapture`/`usePrintModal` hooks. Shared `useToast`/`useContainerScale`/`Toast` de-duplicate what DesignEditor and ExportPanel both had inline.
- [x] **Shared layout**: `StudioLayout.astro` wraps all 4 module `index.astro` shells; Canvas/Explore/Export add `PageHeader`/`PageFooter`, while Design is a full-screen editor with its own one-line `EditorHeader` and no footer (layout "Prueba de impresión": `PhotosPanel` | sheet | `PrintList`, floating `ItemToolbar`).
- [x] **Docs**: README.md updated (nanostores, real folder structure, real data model, Unsplash+Pexels) and a "Convenciones de código" section written (naming, exports, design tokens).

## Code-quality conventions established during this pass

- **No `any`**: `@typescript-eslint/no-explicit-any` is a lint warning; avoid introducing new ones. `ExportPanel.tsx` still has two pre-existing `any` (the print iframe's window and a caught error).
- **Hydration**: a `client:load` island must not render anything derived from `localStorage` on its first render. Gate that part with `useHydrated()`, or make the island `client:only="react"` when all of it is derived.
- **Accessibility**:
  - Prefer a native `<button>` over `role="button"` on a non-interactive element.
  - Use `<fieldset>` + `<legend>` for a group of controls (radio-like button groups, related inputs) — don't wrap a `<label>` around something that isn't a single form control.
  - Every real `<label>` needs `htmlFor` matching the control's `id` (or the control nested inside it).
  - `role="list"` on a `<ul>`/`<ol>` plus an `eslint-disable-next-line jsx-a11y/no-redundant-roles` comment is intentional (Tailwind's preflight strips `list-style`, which makes Safari/VoiceOver drop list semantics) — don't remove it.
- **Toolbars and modals**: a `role="toolbar"` uses `useToolbarRoving`; a modal is a native `<dialog>` opened with `showModal()` (see `PrintPreviewModal`).
- **Effects**: never call `setState` synchronously at the top of a `useEffect` body (`react-hooks/set-state-in-effect`). Adjust state during render instead (compare against a "previous value" kept in state) — see `ImagesGallery.tsx` and `ExportPanel.tsx` for the pattern already applied.
- **Design tokens**: `df-*` Tailwind tokens (newer) and raw DaisyUI classes (older) currently coexist. Don't force a migration between them outside of a dedicated pass — match whichever already dominates the file you're editing. `DESIGN.md` holds the visual system (and the known drift) and `PRODUCT.md` the product context; `.impeccable/` keeps the critiques and audits.
- Always run `bun run lint` and `bun run build` before considering a task done.
- `.bak` files (e.g. `Export/components/*.bak`, `shared/icons/*.astro.bak`) are confirmed dead code kept only for manual review — safe to delete outright.
