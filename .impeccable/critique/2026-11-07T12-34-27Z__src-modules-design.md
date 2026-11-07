---
target: src/modules/Design
total_score: 27
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: "file:/Users/freddytacuri/WorkSpace/ownCloud/vision-craft/src/modules/Design"
timestamp: 2026-11-07T12-34-27Z
slug: src-modules-design
---

Method: dual-agent (A: design-review agent · B: detector + browser agent)

# Critique 2: Design step (src/modules/Design, /design) — 2026-11-07, after the VC-39..VC-50 fixes

## Design Health Score

| #         | Heuristic                       | Score     | Key issue                                                                                                                             |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Live print list and toasts; "Borrador guardado" only from 1280 px; on a phone a new photo lands behind the open panel.                |
| 2         | Match System / Real World       | 3         | mm/cm/pt, "Se sale del papel" clear; "ppp" still jargon; "Tamaño real" is 96 CSS px per inch.                                         |
| 3         | User Control and Freedom        | 3         | Undo everywhere, crop cancel, layered Esc; a dismissed warning can't be brought back.                                                 |
| 4         | Consistency and Standards       | 2         | Photo tools labelled, but Organizar and the text bar are icon-only; "Agregar texto" lives under the Fotos tab; two notions of saving. |
| 5         | Error Prevention                | 3         | Warnings, margin, lock, undo; templates crop photos without saying so; on a phone Quitar sits next to Más.                            |
| 6         | Recognition Rather Than Recall  | 2         | Organizar/Duplicar/Quitar icon-only; Bloquear at the bottom of a scrolling panel; keyboard selection only via the list.               |
| 7         | Flexibility and Efficiency      | 3         | Shortcuts, context menu, multi-select, Alt+drag, paste images.                                                                        |
| 8         | Aesthetic and Minimalist Design | 3         | Calm and on-brand; 148 px of chrome above the sheet.                                                                                  |
| 9         | Error Recovery                  | 3         | Each warning has a hint and load errors offer Reintentar/Quitar; no one-click fix.                                                    |
| 10        | Help and Documentation          | 2         | Empty state, tooltips, Más list; no shortcut reference, "ppp" unexplained.                                                            |
| **Total** |                                 | **27/40** | **Acceptable** (was 25)                                                                                                               |

## Design Specificity Verdict

LLM: print layer unmistakably product-specific (live print list, cm rulers, 5 mm margin, white sheet at night, filter thumbnails of the photo); editing layer still the generic Canva-style kit with no print-specific actions.

Deterministic scan: CLI detect = 0 findings on src/modules/Design (37 files), CanvasItemShape.tsx, Toast.tsx (also with --no-config). Browser overlay: false positives — ai-color-palette on the one Exportar gradient, overused-font (Inter), text-occlusion of the ruler under the Ajustes popover. Real: dark-mode pressed buttons 4.24:1 (dark:text-df-primary-dark on dark:bg-df-primary-dark/15): AdjustMenu.tsx:46 and :107, ItemToolbar.tsx:417 (crop ratio), DesktopOnlyChip.tsx:48 ("Más").

## What's Working

1. The print list as a live print proof (plain-language warnings with hints, bell-off dismiss, hide/lock per row, disciplined amber).
2. Honest phone scope: 44 px labelled bottom bar, crop by double tap, DESKTOP_ONLY_FEATURES note, dark ink on violet, white sheet at night.
3. Forgiving: undo on every remove and template, crop Cancel/Listo, lock with Desbloquear as the only action, Esc closes the popover first.

## Priority Issues

1. [P1] Floating toolbar clipped between 768 and 1279 px (1024: Recortar hidden; 900: "ortar"). centerX is clamped to the sheet, not to the scrolling viewport; the labelled toolbar (~530 px) overflows unreachably. Fix: keep it inside the viewport rect and drop labels where there's no room. /impeccable adapt.
2. [P1] Phone: picking a photo leaves the Fotos panel open over the photo just placed; the tabs give way to the item bar, leaving only the panel's X. Fix: close the panel on pick. /impeccable adapt.
3. [P2] "Organizar" is an icon-only grab bag: ~15 controls (layers, align, cm position, lock), Bloquear scrolled out of view at 1440×900. Fix: label it, lift Bloquear, fold exact position. /impeccable distill.
4. [P2] First use is click by click: with 4 photos chosen the empty sheet offers no "place them all"; templates are in another tab and need 2 placed photos. Fix: a primary "Poner mis N fotos" in the empty state (Mosaico, one undo step). /impeccable onboard.
5. [P2] Keyboard/screen-reader path to actions is inverted: the canvas takes no focus, selecting from a list row leaves the toolbar reachable only by Shift+Tab back through the rows, and selection isn't announced. Fix: move focus to (or offer a jump to) the toolbar and announce the selection. /impeccable harden.

## Persona Red Flags

- Jordan: "ppp"; "Borrador guardado" vs "Guardar en Tableros"; the panel's ✓ "seleccionada" means "already on the sheet"; a template cropped a landscape screenshot into a strip silently.
- Sam: inverted toolbar path; at 200 % zoom gets the phone layout; ImageCard announces aria-pressed but pressing doesn't unpress; dark text-colour dot nearly vanishes on the slate bar.
- Casey: panel covers the new photo; panel X top-right far from the thumb; Quitar next to Más; theme toggle 36 px and board-name field 28 px tall.
- Lucía (2027 board, A4 at home): "Tamaño real" smaller than paper on a laptop; re-dismisses the same warnings after reload; shadow/blur may print as grey smudge.

## Minor Observations

- Shape grid: "Rectángulo" and "Redondeada" crowd in 4 columns.
- Context menu opens over the still-visible floating toolbar.
- Text edit box taller than the text.
- Border swatches active at 0 mm.
- Template thumbnails filled with decorative violet.
- Multi-selection shows only the group box.
- Phone: ~100 px empty band above the sheet.
- At 200 % zoom a mouse user gets the phone layout (DESKTOP_ONLY decided by width, not pointer).

## Questions to Consider

1. Why doesn't each warning carry its one-tap fix ("Meter en la hoja", "Achicar a tamaño nítido")?
2. Should Diseña open with the chosen photos already composed instead of an empty sheet?
3. Does a home inkjet need blur, opacity and shadow, or would that toolbar room serve a labelled Organizar better?
