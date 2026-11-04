---
target: src/modules/Design
total_score: 17
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 5
target_identity: "file:/Users/freddytacuri/WorkSpace/ownCloud/vision-craft/src/modules/Design"
timestamp: 2026-11-03T05-37-51Z
slug: src-modules-design
closed: true
---

Method: dual-agent (A: design-review agent · B: detector + browser agent)

# Critique: Design step (src/modules/Design, /design)

## Design Health Score

| #     | Heuristic                       | Score | Key issue                                                                                                                                                                                      |
| ----- | ------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Visibility of System Status     | 2     | Paper size and board name never appear. Autosave is never mentioned. The stepper shows Exporta ✓ while you're still on Diseña. Delete removes an item silently.                                |
| 2     | Match System / Real World       | 2     | The board has true A4 proportions, but sizes are in px, "100%" isn't real size, and labels like "Inspector de Imagen" and "Capa / Orden" are tool jargon.                                      |
| 3     | User Control and Freedom        | 3     | Undo/redo is good: buttons, Cmd/Ctrl+Z/Y, bursts merged into one step. But Escape does nothing, and "Cargar" replaces the board with no confirmation and no undo.                              |
| 4     | Consistency and Standards       | 1     | Three button styles side by side. Selection handles are Konva-default blue and snap guides are red, where violet means "selected" everywhere else. The saved-board library goes by four names. |
| 5     | Error Prevention                | 1     | "Guardar" on an unnamed board creates a duplicate on every click. Items can be dragged off the paper without warning. There's no low-resolution warning.                                       |
| 6     | Recognition Rather Than Recall  | 2     | Tray checkmarks show what's already placed, but the tray disappears when you select something, and shortcuts exist only in tooltips.                                                           |
| 7     | Flexibility and Efficiency      | 2     | Snapping, click-or-drag to add, and undo shortcuts all exist. Missing: Escape, a larger arrow-key step, a fit-to-screen zoom, and selecting items by keyboard.                                 |
| 8     | Aesthetic and Minimalist Design | 2     | The calm chrome lets the photos lead, but three equally loud buttons compete and the heading pushes the board below the fold.                                                                  |
| 9     | Error Recovery                  | 1     | No error states at all. A broken image URL leaves an invisible item; a full browser storage fails silently; the delete toast has no "Deshacer".                                                |
| 10    | Help and Documentation          | 1     | One sentence under the heading ("Arrastra y suelta…"), which is wrong on touch devices, and no hint on the empty paper.                                                                        |
| Total |                                 | 17/40 | Poor                                                                                                                                                                                           |

All ten heuristics apply to an editor. The design reviewer scored it 16. User Control (#3) was raised from 2 to 3 because undo/redo is genuinely well built.

## Design Specificity Verdict

Design review: This is a generic canvas editor with a white rectangle in it; a meme or sticker app could use it unchanged. Only two things make it a vision-board tool: the default phrase "Sueña en grande" and the tray of photos chosen in Explore. "The print is the product" lives only in the code: dimensions are converted from mm and the A4 proportions are exact. Nothing on screen tells you the paper, its margins, real size, or whether a photo will print sharp. The DESIGN.md rules are half-followed. The single gradient button and the two-line heading are right. The inspector and zoom controls still use DaisyUI's stock look, and the "Mis imágenes" toggle turns solid teal, which the system forbids.

Detector scan:

- Code scan: 4 findings.
  - 3 in src/modules/Design:
    - border-accent-on-rounded: a 2px top border on the rounded mobile bottom sheet (DesignEditor.tsx:192).
    - design-system-font-size, twice: 9px labels at ImagesTray.tsx:91 and ImagesTray.tsx:118.
  - 1 in shared code: the 11px step-number badge at StepperNav.tsx:105.
- In-browser scan: run on four views (desktop light, inspector open, dark, mobile at 390px), with 7–9 findings per view.

Where the two reviews agree: the 9px labels, and dark-mode contrast on the Exportar button.

What only the detector caught:

- Dark mode fails contrast on every solid violet button, not just Exportar. White text on #a78bfa is 2.7:1, against the 4.5:1 minimum, and that includes the current-step pill in the stepper. DESIGN.md records this white-on-#a78bfa pair as button-primary-night, so the token pair itself is wrong and needs fixing at the source.
- The light-mode gradient label fails too. On the teal end of Exportar it's 2.5:1.
- "Borrar Elemento" is 2.9:1 (DaisyUI's red on white).

Likely false positives:

- nested-cards: the parent is display: contents, so there's no real nesting.
- ai-color-palette on Exportar: the gradient is intentional (the One Gradient Rule).
- overused-font: Inter is the documented typeface.
- hero-eyebrow-chip and the 10px warnings on step eyebrows: 10px is DESIGN.md's documented minimum. The exception is the "100%" zoom button, which is a control rather than a label, so that hit is real.

What the detector can't see: everything drawn inside the Konva canvas, plus every behavioral problem below.

Visual overlays: the detector's highlights were left showing in a "[Human] Vision Craft — Diseña" Chrome tab, with 5 marks on the desktop light view.

## Overall Impression

The basics are solid: undo, snapping, autosave, and the board survives a reload. But it doesn't feel like making something you'll print and hang on the wall. The biggest problem is that the product's promise is invisible at the one step where it matters most. Someone can drag a photo off the paper, set text inside the strip a home printer can't print, or stretch a 1080px photo across A4, and nothing warns them. Next to that, the workspace layout keeps getting in the way: the board doesn't fit the screen, the tray disappears, and three buttons compete.

## What's Working

1. Undo is forgiving. Bursts of changes merge into one step (500ms window), history is capped at 50, there are visible buttons with disabled states, and Cmd/Ctrl+Z/Y works. Delete followed by Cmd+Z restores the item. For a non-designer, this is the most important safety net, and it's already there.
2. Snapping gives aligned layouts for free. Items snap to the paper's edges and centre and to other items within 5px (KonvaCanvas.tsx:51-86). Non-designers get tidy boards before the align/distribute features in the backlog exist.
3. It's hard to lose work by leaving. The board survives a reload, autosaves on every way out to Export (the button and both stepper links), and the tray won't add the same photo twice (ImagesTray.tsx:37-42).

## Priority Issues

### [P1] Print-first is invisible.

- What: On this step the user never sees:
  - The paper: its name and size, or the board's name ("Mi visión 2027").
  - Margins: there's no safe-margin guide, and nothing warns when an item crosses the paper edge.
  - Sharpness: nothing says a photo will print blurry. Unsplash and Pexels serve photos about 1080px wide, so one stretched across A4 prints at roughly 130 DPI.
  - Real units: font size is in px, and the "100%" zoom actually means "fit to the space"; on a phone, "100%" is really 28%.
  - Fonts: the font list includes system fonts (Comic Sans MS isn't on phones), so the printed text can come out in a different font.
- Why it matters: Lucía's goal is a print that matches the screen. Clipped edges and soft photos are the surprises she finds at the printer, after it's too late.
- Fix:
  - Add a caption under the board: "A4 vertical · 21 × 29,7 cm · Mi visión 2027".
  - Draw a dashed safe-margin guide about 5mm in from the edge.
  - Flag items that cross the paper edge.
  - Add a "Calidad de impresión: buena / baja" chip per photo. Base it on the size of the image actually loaded, measured against its placed size in mm. Don't use the stored width, which is the original's size, not what was downloaded.
  - Show font size in pt.
  - Replace the "100%" button with "Ajustar" and "Tamaño real".
  - Offer only fonts the app ships with.
- Suggested command: /impeccable harden, then /impeccable clarify for units and labels.

### [P1] The tray disappears whenever anything is selected, including right after adding a photo.

- What: Clicking a photo adds it and selects it, and the inspector replaces the tray (DesignEditor.tsx:209-230). Adding a second photo means closing the inspector first. Every new item also lands at the same spot (50,50), so they stack exactly. On mobile, selecting opens a sheet with a dark backdrop that covers the board, so you can't see text size or color changes as you make them.
- Why it matters: It breaks the core loop of this step: place, place, place, adjust.
- Fix:
  - Keep the tray visible at all times.
  - Put item actions in a small toolbar next to the selected item (Al frente / Al fondo / Quitar, plus text fields for text items).
  - On mobile, use a short bottom toolbar with no backdrop.
  - Don't auto-select after adding, and offset each new item from the last.
- Suggested command: /impeccable layout, then /impeccable adapt.

### [P1] The board doesn't fit the workspace, and zooming in cuts it off.

- What:
  - Desktop (1440×900): the board starts at y≈393, the page is 1714px tall, and Guardar/Exportar sit below the fold. The container grows with the board, so the fit-to-height calculation never limits anything (useContainerScale.ts:21-26).
  - Zoom: at 150% the right third of the board is cut off and can't be scrolled to. A wrapper with overflow-hidden clips it (DesignEditor.tsx:151).
  - Phone: the board is only 223px wide on a 390px screen.
- Fix:
  - Make the editor a fixed-height workspace (full viewport height minus the nav) and fit the board to it.
  - Shorten this step's header.
  - Center the board in a way that still allows scrolling when zoomed.
  - Merge zoom and undo/redo into one toolbar.
- Suggested command: /impeccable layout.

### [P1] "Guardar" duplicates the board and can silently delete old ones.

- What:
  - Duplicates: On an unnamed board, each click creates a new "Lienzo <fecha>". The generated name is never saved back to the board, so the next click doesn't find it (canvasStore.ts:119-143). The reviewer clicked three times and got three copies.
  - Old boards dropped: The library keeps at most 20 boards (slice(0, 20)), so repeated saves push the oldest real boards out without a word.
  - Overwrites: A board with the same name as a saved one overwrites it without asking.
  - Unclear purpose: The board already autosaves, so "Guardar" really means "add to library", yet it looks like the main action.
  - Button weight: The action bar has three solid buttons of equal weight, and "Mis Lienzos" is really a panel switcher that turns solid teal when active.
- Why it matters: Users can lose saved work without noticing, and nothing shows which button finishes the step.
- Fix:
  - Save the generated name back to the board on first save.
  - Ask before overwriting.
  - Replace "Guardar" with a quiet status line ("Guardado en este navegador") plus an outline "Guardar en Tableros" button.
  - Make "Exportar →" the only gradient button.
  - Move "Imágenes | Mis tableros" into a two-option switch at the top of the panel.
- Suggested command: fix the store bug directly, then /impeccable distill for the action bar.

### [P1] Keyboard and screen-reader users can't arrange the board, and dark mode fails contrast.

- What:
  - No keyboard access to the board: Items on the board can't be reached by keyboard; text items in particular can never be reselected. Escape does nothing. Resize and rotate have no keyboard path.
  - Arrow-key conflicts: Arrows move items 1px but also scroll the page, and they fire even while a dropdown has focus. So changing the font with ↓ also moves the item.
  - Missing labels and announcements: The size slider has no label, and toasts aren't announced to screen readers.
  - Off-system colors: Focus rings use DaisyUI or browser colors instead of violet. The selection handles are blue and the snap guides red.
  - Contrast: White on #a78bfa (2.7:1) fails everywhere in dark mode.
- Fix:
  - Add an accessible "Elementos del tablero" list. It can double as the layers panel from the backlog.
  - Add number fields for position, size (cm) and rotation (°).
  - Make Escape deselect. Arrow keys move 1mm, Shift+arrow 10mm, and stop scrolling the page; ignore them while a dropdown or button has focus.
  - Make toasts announce themselves (role="status") and give the delete toast a "Deshacer" button.
  - Use violet for the selection handles (anchorStroke/borderStroke #7c3aed) and snap guides.
  - In dark mode, put dark ink on the light violet, or use a darker violet, and correct DESIGN.md's night button token to match.
- Suggested command: /impeccable harden, then /impeccable audit.

## Persona Red Flags

Jordan (first-timer):

- The empty paper gives no cue such as "Toca una foto para añadirla".
- After the first add, the tray vanishes and a near-empty "Inspector de Imagen" appears.
- The tray's checkmark reads as "selected", not "on the board".
- The rotate handle is an unlabeled 10px square.
- It's unclear which of the three loud buttons finishes the step.

Sam (keyboard / screen reader):

- Items on the canvas can't be focused, and Escape does nothing.
- Changing the font with ↓ also moves the selected item, and Shift+↓ sends it to the back.
- Deletions and toasts are silent.
- The zoom reset button and the zoom readout are both read as "100%".

Casey (one-handed phone):

- On a 223px-wide board the resize and rotate handles are about 10px, too small to hit with a thumb.
- Controls are 24px tall, below the 44px touch minimum.
- The zoom pill covers the board's corner.
- Selecting something opens a sheet that dims the board.
- The page says "Arrastra y suelta", but drag and drop doesn't work on touch.
- Undo history is lost if you leave and come back.

Lucía (personal goal-setter from PRODUCT.md, printing at home):

- She never sees "A4" or her board's name on this step.
- She can put text inside the strip the printer can't print, or push a photo half off the paper, with no warning.
- A full-width photo will print soft.
- The stepper says Exporta is done before she has exported.
- The footer is in English: "© 2024 Vision Craft. All rights reserved."

## Minor Observations

- Alt text and thumbnails:
  - Placed images get the English alt text "Added Image" or "Dropped Image" instead of the photo's own description (ImagesTray.tsx:51).
  - The saved-board thumbnail is captured with the selection handles still visible.
- Board cards: "3 imágenes" on a saved-board card counts text items too.
- Copy:
  - "Mis imagenes" is missing its accent.
  - Labels use title case where Spanish uses sentence case ("Agregar Texto", "Borrar Elemento").
- Brittle layout: The lg:-mt-55 offset that pulls the side panel up beside the heading will break if the heading's length changes.
- Console error: StepperNav throws a hydration error on every load with saved data (the server and browser render different step badges).
- Top bar: At 20% opacity, scrolled photos bleed through behind the stepper.
- Mobile sheet: The detector flags a 2px violet top border on the rounded sheet.
- New-item defaults: New items are 200px wide with 28px text, which is tiny on the 61 × 91 cm poster size.
- Two libraries: The saved-boards list in this step duplicates the /boards page.

## Questions to Consider

1. If the print is the product, why does the editor talk in pixels and percentages? What if the only zoom options were "Ajustar" and "Tamaño real", and every measurement were in cm?
2. Does a non-designer need an "Inspector" at all, or just three actions on the photo itself: Al frente, Girar, Quitar?
3. The board already autosaves, so what is "Guardar" for? Could "Guardado en este navegador" plus one forward button replace two of the three loud buttons?
4. Should the editor warn loudly when something will print blurry or get cut off at the edge? Those are the only mistakes Lucía can't undo.
