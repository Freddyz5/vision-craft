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

There is no test suite yet — the `Run tests` step in `.github/workflows/release-prod.yml` is commented out.

Requires Node >= 22.12.0. Two env vars back the image-search API and must be set locally (`.env`) and in Vercel: `PEXELS_API_KEY`, `UNSPLASH_CLIENT_ID`. Two more back Cloudinary image uploads, `PUBLIC_CLOUDINARY_CLOUD_NAME` and `PUBLIC_CLOUDINARY_UPLOAD_PRESET` — unlike the two above these are client-exposed (`PUBLIC_` prefix, required by Astro/Vite to reach the browser bundle) and unsigned, no API secret involved.

Pre-commit runs `lint-staged` via Husky (`eslint --fix` + `prettier` on staged `.js/.jsx/.ts/.tsx/.astro`, `prettier` on `.json/.md/.css`).

## Release flow

Semantic-release runs only on push to `prod` (see `.github/workflows/release-prod.yml`), driven by conventional commit messages, and deploys to Vercel afterwards. PRs into `dev`/`prod` only run build/CI, not release. There is no `test` step currently wired into CI.

## Architecture

Astro (SSR, `output: 'server'`, `@astrojs/vercel` adapter) shell with React islands for interactivity, single global layout at `src/layouts/Layout.astro`. Styling is Tailwind v4 + DaisyUI, with a custom `df-*` color palette and a `dark` class toggled via a pre-hydration inline script (persisted under the `df-theme` localStorage key — unrelated to the app's own persistent stores).

### User flow / route-to-module mapping

Each route in `src/pages/*.astro` renders exactly one module shell from `src/modules/<Name>/index.astro`, which composes `shared/components/TopNav.astro` + `AppSidebar.astro` around a React entry component hydrated with `client:load`. The product flow is a 4-step wizard:

1. **Explore** (`/explore`) — search & multi-select images from external providers.
2. **Canvas** (`/canvas`) — pick a paper preset or custom size for the board.
3. **Design** (`/design`) — drag selected images onto a Konva stage, position/resize/rotate, add text.
4. **Export** (`/export`) — save/load boards, download PNG/JPG, or print as a tiled poster across multiple sheets.

Each module folder follows the same shape: `index.astro` (page shell), `components/`, and a `types.ts` that mostly **re-exports** the shared domain types from `shared/store/canvasStore.ts` plus a few module-local UI types — the source of truth for the data model lives in the store, not in the module.

### State: nanostores, not React context

All cross-module/cross-page state lives in `src/shared/store/*` as nanostores, read in React components via `useStore()` from `@nanostores/react`:

- `boardStore.ts` — `selectedImagesStore`: images selected in Explore (persisted).
- `canvasStore.ts` — the core domain store: `activeCanvasConfigStore` (paper size/orientation/name, dimensions always stored in **mm**), `activeCanvasItemsStore` (the placed images/text on the active board), `savedCanvasesStore` (max 20 saved boards). Also owns the mutation API (`addItem`, `updateItem`, `bringToFront`/`sendToBack`, `saveCurrentCanvas`, `loadCanvas`, `duplicateCanvas`, `deleteCanvas`, `exportJson`/`importJson`). Prefer adding new canvas mutations here rather than mutating the store directly from components.
- `designViewStore.ts` — small non-persistent atom toggling the Design sidebar between "selected images" and "saved canvases" views.

Persisted stores use `persistentAtom` (`@nanostores/persistent`) with explicit `JSON.stringify`/`JSON.parse` encode/decode — this is the only persistence layer (no backend); everything lives in `localStorage`.

Canvas geometry note: stores keep dimensions in millimetres; components convert to logical Stage pixels with `MM_TO_PX = 96 / 25.4` when rendering (see `DesignEditor.tsx`).

### Image providers proxy through a server API route

`src/modules/Explore/services/{unsplash,pexels}.ts` never call the third-party APIs directly — they fetch `/api/images?provider=...` (`src/pages/api/images.ts`), an Astro server route that holds the API keys server-side via `import.meta.env` and normalizes both providers' responses into the shared `NormalizedImage` shape. `Explore/constants/providers.ts` is the registry mapping a provider id to its `getImages` function; add new providers there plus a branch in `api/images.ts`.

User-uploaded images are the one exception: `Explore/services/cloudinary.ts` uploads unsigned directly from the browser to Cloudinary's REST API (no `/api/images` involved, no server secret — see `PUBLIC_CLOUDINARY_*` env vars above) and normalizes Cloudinary's response into the same `NormalizedImage` shape. It's surfaced via `Explore/components/UploadImageCard.tsx`, not through the `providers.ts` registry (that registry is shaped around search — `getImages(query, page)` — which upload isn't).

### Export/print math

`Export/types.ts` contains `buildPrintConfig()`, which computes poster-mode tiling: given the canvas size (mm) and a paper preset (A4/A3/US Letter, portrait or landscape), it derives the grid (`cols`/`rows`), the scale needed to fully cover the poster area, and per-tile offsets — this is the one place with non-trivial layout math and is a good reference before touching poster/print UI.

### Icons

Two icon sets are in use by convention: `lucide-astro` for `.astro` files, `lucide-react` for `.tsx` islands. Don't hand-roll new icon components under `shared/icons/`.

## Refactor status (code-quality pass)

Tracking a broader "professionalize the codebase" effort, done incrementally, phase by phase:

- [x] **Quick wins**: `lang="es"` fix, dead code archived as `.bak`, `contants/likns` typo → `constants/links`, `SearcBar` typo fixed, ESLint (flat config) + Prettier + Husky/lint-staged set up.
- [x] **Icons**: migrated everything to `lucide-react`/`lucide-astro` (see Icons section above).
- [x] **Componentización**: `useCanvasItemInteractions` unifies `KonvaImageItem`/`KonvaTextItem`; `DesignEditor` split into `ZoomControls`/`ItemInspector`/`DesignActionBar`; `ExportPanel` split into `ExportCanvasPreview`/`ExportPrintOptions`/`ExportDownloadOptions`/`PrintPreviewModal`/`StaticCanvasItems` plus `usePosterPrintConfig`/`useWallPreviewCapture`/`usePrintModal` hooks. Shared `useToast`/`useContainerScale`/`Toast` de-duplicate what DesignEditor and ExportPanel both had inline.
- [x] **Shared layout**: `StudioLayout.astro` + `PageHeader`/`PageFooter` now used by all 4 module `index.astro` shells (Canvas/Design/Explore/Export).
- [x] **Docs**: README.md updated (nanostores, real folder structure, real data model, Unsplash+Pexels) and a "Convenciones de código" section written (naming, exports, design tokens).

## Code-quality conventions established during this pass

- **No `any`**: `@typescript-eslint/no-explicit-any` is a lint warning; avoid introducing new ones. `ExportPanel.tsx` still has ~11 pre-existing `any` (Konva refs/event handlers) intentionally left for the componentización pass.
- **Accessibility**:
  - Prefer a native `<button>` over `role="button"` on a non-interactive element.
  - Use `<fieldset>` + `<legend>` for a group of controls (radio-like button groups, related inputs) — don't wrap a `<label>` around something that isn't a single form control.
  - Every real `<label>` needs `htmlFor` matching the control's `id` (or the control nested inside it).
  - `role="list"` on a `<ul>`/`<ol>` plus an `eslint-disable-next-line jsx-a11y/no-redundant-roles` comment is intentional (Tailwind's preflight strips `list-style`, which makes Safari/VoiceOver drop list semantics) — don't remove it.
- **Effects**: never call `setState` synchronously at the top of a `useEffect` body (`react-hooks/set-state-in-effect`). Adjust state during render instead (compare against a "previous value" kept in state) — see `ImagesGallery.tsx` and `ExportPanel.tsx` for the pattern already applied.
- **Design tokens**: `df-*` Tailwind tokens (newer) and raw DaisyUI classes (older) currently coexist. Don't force a migration between them outside of a dedicated pass — match whichever already dominates the file you're editing.
- Always run `bun run lint` and `bun run build` before considering a task done.
- `.bak` files (e.g. `Export/components/*.bak`, `shared/icons/*.astro.bak`) are confirmed dead code kept only for manual review — safe to delete outright.
