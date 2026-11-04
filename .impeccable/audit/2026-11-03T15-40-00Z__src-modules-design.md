---
target: src/modules/Design
total_score: 15
max_score: 20
p0_count: 0
p1_count: 2
target_identity: "file:/Users/freddytacuri/WorkSpace/ownCloud/vision-craft/src/modules/Design"
timestamp: 2026-11-03T15-40-00Z
slug: src-modules-design
---

Method: code review of the Design editor after plan phases 2–7, the impeccable detector over `src/modules/Design` + `CanvasItemShape` + `Toast`, and browser checks at 1440, 900 and 390 px (Chromium via Playwright; touch gestures emulated only, not on a device).

# Audit: Design step (src/modules/Design, /design)

## Audit Health Score

| #         | Dimension                | Score     | Key finding                                                                                                                  |
| --------- | ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1         | Accessibility            | 3         | Keyboard path to every item runs through the print list; the floating toolbar has no arrow-key roving.                       |
| 2         | Performance              | 3         | Filtered photos were cached at full photo resolution in the editor (fixed); printing blocks the main thread while capturing. |
| 3         | Theming                  | 3         | Editor chrome is on `df-*` tokens in both themes; Konva colours are hex constants (canvas can't read CSS vars).              |
| 4         | Responsive Design        | 3         | Mobile sheet, docked toolbar and 44 px targets; Transformer handles were 9 px under touch (fixed).                           |
| 5         | Implementation Integrity | 3         | Detector: 7 × `11px is off the DESIGN.md type ramp` (toolbar and popover captions).                                          |
| **Total** |                          | **15/20** | **Good**                                                                                                                     |

## Implementation Integrity Verdict

Pass. The editor reads as one product-specific system: the print list doubles as the layer panel, warnings use the Marigold role only, controls share the pill/hairline/well vocabulary, and every item property is drawn by one renderer (`CanvasItemShape`) used for the editor, PNG/JPG and print. The only deterministic findings are seven 11 px captions off the type ramp.

## Executive Summary

- Audit Health Score: **15/20** (Good)
- Issues: P0 0 · P1 2 · P2 4 · P3 3
- Fixed in VC-28 (adapt): both P1s and two P2s (see below).
- Left for VC-29 (clarify) and VC-30 (polish): the 11 px captions, toolbar roving focus, print capture feedback.

## Detailed Findings by Severity

### [P1] Filtered photos cached at full resolution while editing — fixed

- **Location:** `src/shared/components/CanvasItemShape.tsx` (filter cache effect)
- **Category:** Performance / Responsive
- **Impact:** each filtered photo held up to ~12 MP (≈48 MB) of canvas memory; a handful of filtered photos can exhaust mobile Safari's canvas budget and reload the tab.
- **Fix:** the editor caches at screen sharpness (`devicePixelRatio`); `captureStage` re-caches filtered photos at the export's resolution (never past the photo's own) only for the capture, then restores the light cache. Verified: a B/N photo exports sharp.

### [P1] 9 px Transformer handles under touch — fixed

- **Location:** `KonvaCanvas.tsx`, `CropOverlay.tsx`
- **Category:** Responsive (touch targets)
- **Impact:** resizing or cropping on a phone was close to impossible.
- **Fix:** handles grow to 18 px (crop: 20 px) on `(pointer: coarse)`.

### [P2] Small touch targets in the print list and mobile panel — fixed

- **Location:** `PrintList.tsx` row actions (32 px), mobile panel close (36 px)
- **Fix:** 44 px below `md`; the mobile panel gets its own header row so the close button no longer covers the "Plantillas" tab.

### [P2] Tablet drawer doesn't manage focus — fixed

- **Location:** `DesignEditor.tsx` (list drawer)
- **WCAG:** 2.4.3 Focus Order
- **Fix:** focus moves to the drawer's close button on open and back to "Lista" on close (button or Esc).

### [P2] Floating toolbar has no roving focus

- **Location:** `ItemToolbar.tsx` (`role="toolbar"`)
- **Impact:** keyboard users Tab through every button instead of arrowing within the toolbar as the role promises.
- **Suggested command:** /impeccable polish

### [P2] Printing blocks the main thread without progress per page

- **Location:** `ExportPanel.tsx` (`capturePrintPages`)
- **Impact:** a large poster freezes the page for a moment; there is a "Preparando la impresión…" toast but no page count.
- **Suggested command:** /impeccable harden (later)

### [P3] 11 px captions off the type ramp (detector, ×7)

- **Location:** `AdjustMenu`, `AlignMenu`, `FrameMenu`, `ItemToolbar`, `MoreMenu`, `ShapeMenu`, `ToolPopover`
- **Suggested command:** /impeccable polish

### [P3] Konva colours as hex constants

- **Location:** `KonvaCanvas.tsx`, `CropOverlay.tsx`, `CanvasItemShape.tsx`
- **Impact:** none today (the sheet is paper-white in both themes); a palette change would need two edits.

### [P3] Ruler labels at 10 px muted on the well

- **Location:** `SheetRuler.tsx`
- **Impact:** decorative reference; 4.6:1 on `df-bg`, fine.

## Patterns & Systemic Issues

- Captions in compact controls drifted to 11 px in every new popover; one shared caption size would stop it recurring.

## Positive Findings

- One renderer for editor, export and print: no drift between screen and paper.
- Every destructive action is one undo step and offers "Deshacer".
- Keyboard: Esc, arrows (1/10 mm), Supr, Ctrl/⌘+A/C/V/D/Z, layer and lock shortcuts; none fire inside fields or on focused controls.
- Live regions for the print-list summary and toasts; panels and menus close with Esc without dropping the selection.
- Mobile keeps the brief's scope (crop, shape, layers, lock) and says what's desktop-only.

## Recommended Actions

1. **[P2] `/impeccable polish`**: toolbar roving focus, 12 px captions (detector findings).
2. **[P2] `/impeccable harden`**: per-page progress when capturing large posters for print.
3. **[P3] `/impeccable polish`**: final pass.

## Follow-up (VC-30, polish)

- Toolbar roving focus: done (`useToolbarRoving`; one Tab stop, ←/→/Inicio/Fin, ↑/↓ never nudge from a focused button).
- 11 px captions: now 12 px (`text-xs`); detector over `src/modules/Design`, `CanvasItemShape`, `Toast` returns no findings.
- Print capture feedback: pages are captured one at a time with "Preparando la hoja N de M…".
- Also fixed: the mobile editor grid grew to the docked toolbar's width (the whole page scrolled sideways at 390 px), and floating popover panels were cut off by the sheet's scroll area near its left edge.
