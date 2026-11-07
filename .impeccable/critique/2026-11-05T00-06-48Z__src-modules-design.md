---
target: src/modules/Design
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: "file:/Users/freddytacuri/WorkSpace/ownCloud/vision-craft/src/modules/Design"
timestamp: 2026-11-05T00-06-48Z
slug: src-modules-design
---

Method: dual-agent (A: design-review agent · B: detector + browser agent)

# Critique: Design step (src/modules/Design, /design) — 2026-11-04

Up from 17/40 to 25/40. The print layer (print list, warnings, real units) is the strongest, most product-specific part. Weakest: text handling, the 11-icon toolbar, and the forward action vanishing below lg.

## Design Health Score

| #         | Heuristic                       | Score     | Key issue                                                                                                                                |
| --------- | ------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Print list status is excellent; "Guardado en este navegador" next to "Guardar en Tableros" makes save state ambiguous.                   |
| 2         | Match System / Real World       | 3         | cm/mm/pt, "Tamaño real", "Se sale del papel" are great; "ppp" is jargon, Marco icon reads as "#", the dashed safe margin is never named. |
| 3         | User Control and Freedom        | 3         | Undo/redo, undo toasts, crop Cancelar/Listo, Esc. On mobile a selection hides the Fotos/Lista tabs.                                      |
| 4         | Consistency and Standards       | 2         | Icon-only toolbar on desktop vs labelled on mobile; layer order in 4 places with 3 vocabularies; "Ajustar · 59 %" vs "Ajustes".          |
| 5         | Error Prevention                | 2         | Templates cover the title with no check; Exportar live on an empty board; long text silently clipped (confirmed bug).                    |
| 6         | Recognition Rather Than Recall  | 2         | 11 unlabelled icons with slow native tooltips; lock/hide in the list only on hover.                                                      |
| 7         | Flexibility and Efficiency      | 3         | Rich shortcuts, context menu, 1/10 mm nudge, exact cm fields, paste, alt-drag; no shortcut reference.                                    |
| 8         | Aesthetic and Minimalist Design | 3         | Calm neutral chrome, one gradient; 11-button toolbar and duplicated layer controls add noise.                                            |
| 9         | Error Recovery                  | 3         | Each warning has a fix hint; no one-click fix; the warning "×" reads as remove-photo.                                                    |
| 10        | Help and Documentation          | 1         | No first-use guidance, no shortcut list, one-line empty state, safe margin never explained.                                              |
| **Total** |                                 | **25/40** | **Acceptable**                                                                                                                           |

## Design Specificity Verdict

LLM: the print layer is product-specific (cm rulers, paper line, Tamaño real, mm border, pt, print list as preflight, amber only for print warnings). The editing layer is category-generic (three columns, 11-icon floating toolbar, context menu, B/N/Sepia). The editor doesn't know what a vision board is: geometric templates that ignore the title, generic fonts, new text defaults to the brand violet (UI colour ends up printed).

Deterministic scan: CLI `detect` = 0 findings on src/modules/Design (35 files), CanvasItemShape.tsx and Toast.tsx. Browser overlay: real — white label on the Exportar gradient's teal end ~2.5:1 in light mode (PrintList.tsx:295; same class on 6 CTAs across 4 screens); marginal 4.2–4.4:1 — "Agregar texto" at night (PhotosPanel.tsx:128), selected ShapeMenu option (ShapeMenu.tsx:53), muted text on the selected print-list row, inactive Plantillas tab, stepper badge "4". False positives: overused-font (Inter by design), ai-color-palette on Exportar (One Gradient Rule), text-occlusion of ruler labels by popovers. The detector cannot see the structural issues below.

## What's Working

1. Print list = layers panel + preflight (PrintList.tsx, printChecks.ts), every row speaks paper with fix hints.
2. Real units everywhere (cm rulers, Tamaño real, mm border, cm fields with decimal comma, pt).
3. Forgiving interactions (undo everywhere, crop cancel, filter thumbnails of the actual photo, "Más en computadora" chip).

## Priority Issues

1. [P1] Collage templates cover the title. collage.ts uses the whole safe area for photos; "Destacada" put the featured photo over "Mi 2027"; featured = largest, not chosen. Fix: reserve text band or make the title a template slot, bring text to front, add a "text over photo" check, let users pick the featured photo. Commands: /impeccable shape, /impeccable harden.
2. [P1] Text isn't print-ready. Default fill = brand violet (canvasStore.ts:105), left-aligned inside a centred box with no alignment control, generic/system fonts (Comic Sans missing on mobile), plus confirmed bugs: clipped lines, pt field can't be typed, sideways resize squashes and drops words. Fix: graphite + centred default, alignment control, 2–3 bundled web fonts with character, fix the 3 text bugs. Commands: /impeccable typeset, /impeccable harden.
3. [P1] Forward action disappears below 1024px (tablet, mobile, desktop at 200% zoom): Exportar only inside the Lista drawer; only a 28px stepper arrow is visible. Fix: persistent gradient Exportar in the header (tablet) / bottom bar (mobile, also with a selection). Command: /impeccable adapt.
4. [P1] Desktop floating toolbar = 11 icon-only buttons with native tooltips (ItemToolbar.tsx:263); mobile labels the same buttons better. Fix: Recortar · Forma · Ajustes · Marco as icon+label pills; Subir/Bajar, Alinear, Bloquear into "Organizar"; Duplicar and Quitar visible, Quitar last and separated. Command: /impeccable distill.
5. [P2] Floating layers cover the work: Ajustes/Marco popovers open over the photo being adjusted; toolbar covers the title; bottom-right toast covers Exportar. Fix: open popovers on the side that keeps the selection visible; move toasts out of the print-list column. Command: /impeccable layout.

## Persona Red Flags

- Jordan: can't decode icons; lilac dashed line and "ppp" unexplained; "Guardado en este navegador" vs "Guardar en Tableros"; empty state doesn't say click/drag; "Destacada" wipes out the title.
- Sam: arrow nudges not announced, no position readout; disabled Restablecer/Quitar marco near-invisible; at 200% zoom mobile layout hides Exportar. Good: 2px violet focus, print-list rows are real buttons.
- Casey: top controls 28–32px; docked bar clipped at "Quitar", "Más en computadora" off-screen; exporting with a selection = deselect → Lista → Exportar; Bloquear next to Quitar.
- Lucía (New Year board, A4 at home): template covers "Mi 2027", title prints violet and off-centre, no per-photo goal caption; reassured by "Nítida · 824 ppp" and "Lista para imprimir".

## Minor Observations

- Marco "0 mm" slider value overflows the popover (ToolPopover.tsx:140, needs min-w-0).
- Dark mode: white native checkboxes in Marco, navy border swatch invisible, Fotos/Plantillas selected tab barely distinct.
- Crop mode: no instruction; 4:5 and 3:2 can't flip orientation.
- Text editing selection is browser pink, not violet.
- Tablet list drawer has no scrim.
- Exportar enabled on an empty board.
- Al frente/Al fondo in "⋯" while Subir/Bajar sit in the bar.

## Questions to Consider

1. If the print is the product, why does the sheet look like a screen canvas, not a proof? What if the 5 mm unprintable band were shaded on the paper?
2. Does a vision-board maker need 11 tools per photo? Would Recortar · Forma · Marco · Quitar plus "Escribe tu meta" serve better?
3. Should templates be vision-board structures (title + life areas, word of the year + photos) instead of geometric grids?
