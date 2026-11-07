import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Images, ListChecks, X } from "lucide-react";
import { useStore } from "@nanostores/react";
import type Konva from "konva";
import { EditorHeader } from "./EditorHeader";
import { PhotosPanel } from "./PhotosPanel";
import { PrintList } from "./PrintList";
import { SheetToolbar } from "./SheetToolbar";
import { SheetRuler, RULER_SIZE } from "./SheetRuler";
import { KonvaCanvas } from "./KonvaCanvas";
import { CropToolbar, ItemToolbar } from "./ItemToolbar";
import { TextEditOverlay } from "./TextEditOverlay";
import { ContextMenu, type ContextMenuEntry } from "./ContextMenu";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	addItem,
	autoSaveActiveCanvas,
	bringItemsToFront,
	duplicateItems,
	isTextItem,
	MAX_SAVED_CANVASES,
	removeItem,
	moveItemsOneLayer,
	removeItems,
	reorderItems,
	saveCurrentCanvas,
	sendItemsToBack,
	updateItem,
	updateItems,
} from "../../../shared/store/canvasStore";
import { canvasImagesStore, retryCanvasImage } from "../../../shared/store/canvasImages";
import {
	recordUploadedImage,
	selectedImagesStore,
	toggleImageSelection,
} from "../../../shared/store/boardStore";
import {
	UPLOAD_NOT_CONFIGURED,
	uploadToCloudinary,
	validateImageFile,
} from "../../Explore/services/cloudinary";
import {
	historyFutureStore,
	historyPastStore,
	redo,
	resetHistory,
	undo,
	withoutHistory,
} from "../../../shared/store/canvasHistory";
import { measureTextHeight, textHeightPatches } from "../../../shared/utils/textMetrics";
import { fontsLoadedStore, loadItemFonts } from "../../../shared/utils/fonts";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import { Toast } from "../../../shared/components/Toast";
import { captureStage } from "../../../shared/utils/stageCapture";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useEditorClipboard } from "../hooks/useEditorClipboard";
import { MAX_SCALE, MIN_SCALE, useViewportNavigation } from "../hooks/useViewportNavigation";
import { usePrintChecks } from "../hooks/usePrintChecks";
import { itemBounds, warningKey, type PrintWarningKind } from "../utils/printChecks";
import { newPhotoItem, newTextItem } from "../utils/newItems";
import { shortcut } from "../utils/shortcuts";
import { collagePatches, type CollageLayout } from "../utils/collage";
import { copyItems, hasCopiedItems, pasteCopiedItems } from "../utils/editorClipboard";
import {
	applyCrop,
	CROP_ASPECTS,
	fitAspect,
	fullImageRect,
	type CropAspectId,
	type LocalRect,
} from "../utils/crop";
import {
	alignPatches,
	distributePatches,
	type AlignEdge,
	type AlignReference,
	type DistributeAxis,
} from "../utils/arrange";

const THUMBNAIL_WIDTH = 320;
const ZOOM_STEP = 1.25;
/** The floating toolbar clears the Transformer's rotate handle when it sits above an item. */
const TOOLBAR_GAP_ABOVE = 44;
const TOOLBAR_GAP_BELOW = 12;
const TOOLBAR_HEIGHT = 48;
/** About half the photo toolbar's width, to tell which texts it would cover. */
const TOOLBAR_HALF_WIDTH = 270;
/** Room it needs above the item (gap + its own height) before it flips below. */
const TOOLBAR_CLEARANCE = TOOLBAR_GAP_ABOVE + TOOLBAR_HEIGHT;

type MobilePanel = "fotos" | "lista" | null;

/**
 * The Design step, laid out as a print proof (see the VC-4 brief):
 * photos on the left, the sheet in the middle with its print overlay and the
 * selected item's floating toolbar, and the live print list on the right.
 * Tablet turns the list into a drawer; mobile moves both panels into a
 * half-height sheet behind bottom tabs and docks the item toolbar.
 */
export default function DesignEditor() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);
	const canUndo = useStore(historyPastStore).length > 0;
	const canRedo = useStore(historyFutureStore).length > 0;
	const { toast, showToast, dismissToast } = useToast();

	useEffect(() => resetHistory(), []);

	// Text heights are measured with whatever fonts are present: re-measure
	// once the board's fonts are in, and again whenever more arrive. This
	// also fixes boards saved before text grew with its lines.
	const fontsVersion = useStore(fontsLoadedStore);
	useEffect(() => {
		let active = true;
		void loadItemFonts(activeCanvasItemsStore.get()).then(() => {
			if (!active) return;
			const patches = textHeightPatches(activeCanvasItemsStore.get());
			if (Object.keys(patches).length > 0) withoutHistory(() => updateItems(patches));
		});
		return () => {
			active = false;
		};
	}, [fontsVersion]);

	const isTabletUp = useMediaQuery("(min-width: 768px)");
	const isDesktop = useMediaQuery("(min-width: 1024px)");

	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;
	const sheet = useMemo(
		() => ({ width: logicalWidth, height: logicalHeight }),
		[logicalWidth, logicalHeight],
	);

	const [selection, setSelection] = useState<string[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	// Crop mode: the photo being cropped, its crop box (item frame, logical px) and locked ratio.
	const [croppingId, setCroppingId] = useState<string | null>(null);
	const [cropRect, setCropRect] = useState<LocalRect | null>(null);
	const [cropAspect, setCropAspect] = useState<CropAspectId>("free");
	// 4:5 and 3:2 can be turned to 5:4 and 2:3.
	const [cropFlipped, setCropFlipped] = useState(false);
	const [interacting, setInteracting] = useState(false);
	const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
	const [listDrawerOpen, setListDrawerOpen] = useState(false);
	const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
	const [zoom, setZoom] = useState(1);

	// Drop ids whose item is gone (removed, undone) without a separate cleanup step.
	const selectedIds = useMemo(
		() => selection.filter((id) => items.some((i) => i.id === id)),
		[selection, items],
	);
	const selectedItems = useMemo(
		() => items.filter((i) => selectedIds.includes(i.id)),
		[items, selectedIds],
	);
	const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;
	const editingItem = items.find((i) => i.id === editingId);
	const croppingItem = items.find((i) => i.id === croppingId);
	const { rows, warningCount } = usePrintChecks(items, sheet, dismissed);
	const warnedIds = useMemo(
		() => new Set(rows.filter((r) => r.warnings.length > 0).map((r) => r.item.id)),
		[rows],
	);

	const stageRef = useRef<Konva.Stage | null>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	// Rulers and breathing room around the sheet on tablet and up; edge to edge on mobile.
	const fitScale = useContainerScale(
		viewportRef,
		logicalWidth,
		logicalHeight,
		isTabletUp ? RULER_SIZE + 24 : 12,
	);
	const scale = fitScale * zoom;
	const setScale = (next: number) =>
		setZoom(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)) / fitScale);

	// ── Crop mode ─────────────────────────────────────────────────────────

	const startCrop = (id: string) => {
		const item = items.find((i) => i.id === id);
		if (!item) return;
		setSelection([id]);
		setEditingId(null);
		setCroppingId(id);
		setCropRect({ x: 0, y: 0, width: item.width, height: item.height });
		setCropAspect("free");
		setCropFlipped(false);
	};
	const commitCrop = () => {
		if (croppingItem && cropRect) updateItem(croppingItem.id, applyCrop(croppingItem, cropRect));
		setCroppingId(null);
	};
	const cancelCrop = () => setCroppingId(null);
	/** The locked width/height ratio, turned when flipped; null = free. */
	const cropRatio = (id: CropAspectId, flipped: boolean) => {
		const ratio = CROP_ASPECTS.find((a) => a.id === id)?.ratio ?? null;
		return ratio && flipped ? 1 / ratio : ratio;
	};
	const changeCropAspect = (id: CropAspectId) => {
		setCropAspect(id);
		setCropFlipped(false);
		const ratio = cropRatio(id, false);
		if (croppingItem && cropRect && ratio) {
			setCropRect(fitAspect(cropRect, ratio, fullImageRect(croppingItem)));
		}
	};
	const cropCanFlip = (cropRatio(cropAspect, false) ?? 1) !== 1;
	const flipCropAspect = () => {
		const ratio = cropRatio(cropAspect, !cropFlipped);
		setCropFlipped(!cropFlipped);
		if (croppingItem && cropRect && ratio) {
			setCropRect(fitAspect(cropRect, ratio, fullImageRect(croppingItem)));
		}
	};

	const commitCropRef = useRef(commitCrop);
	useEffect(() => {
		commitCropRef.current = commitCrop;
	});
	// Enter keeps the crop, Esc drops it; caught before the editor's shortcuts.
	useEffect(() => {
		if (!croppingId) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Enter" && e.key !== "Escape") return;
			e.preventDefault();
			e.stopPropagation();
			if (e.key === "Enter") commitCropRef.current();
			else setCroppingId(null);
		};
		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
	}, [croppingId]);
	const { spaceHeld } = useViewportNavigation({ viewportRef, stageRef, scale, setScale });

	const select = (ids: string[]) => {
		// Picking something else ends crop mode, keeping the crop.
		if (croppingId) commitCrop();
		setSelection(ids);
		if (editingId && !ids.includes(editingId)) setEditingId(null);
	};

	/** Double click/tap: a text is edited in place, a photo is cropped. */
	const handleDoubleClick = (id: string) => {
		const item = items.find((i) => i.id === id);
		if (!item) return;
		if (isTextItem(item)) {
			select([id]);
			setEditingId(id);
		} else if (!rows.find((r) => r.item.id === id)?.warnings.some((w) => w.kind === "load-error")) {
			startCrop(id);
		}
	};
	const selectOne = (id: string | null | undefined) => select(id ? [id] : []);
	/** Drag-select result: replaces the selection, or joins it with Shift/Cmd/Ctrl. */
	const selectMany = (ids: string[], additive: boolean) =>
		select(additive ? [...new Set([...selectedIds, ...ids])] : ids);
	/** Plain click selects just this item; Shift/Cmd/Ctrl+click adds or removes it. */
	const selectItem = (id: string, additive: boolean) => {
		if (!additive) return select([id]);
		select(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
	};

	const showRemovedToast = (count: number) =>
		showToast(count === 1 ? "Elemento quitado." : `${count} elementos quitados.`, {
			action: { label: "Deshacer", onClick: undo },
		});

	useEditorShortcuts({
		selectedIds,
		onClearSelection: () => select([]),
		onRemoved: showRemovedToast,
		onSelect: select,
		onSelectAll: () => select(activeCanvasItemsStore.get().map((i) => i.id)),
	});

	// A screenshot or copied photo pasted with Ctrl/Cmd+V: upload it, then place it like a picked photo.
	const handlePasteImage = async (file: File) => {
		const invalid = validateImageFile(file);
		if (invalid) {
			showToast(invalid, { tone: "error" });
			return;
		}
		showToast("Subiendo la imagen pegada…", { tone: "progress", durationMs: 60_000 });
		try {
			const uploaded = await uploadToCloudinary(file);
			// Screenshots arrive as "image"; name it after how it got here.
			const photo = { ...uploaded, alt: "Imagen pegada" };
			recordUploadedImage(photo);
			if (!selectedImagesStore.get().some((img) => img.imageSrc === photo.imageSrc)) {
				toggleImageSelection(photo);
			}
			const item = newPhotoItem(photo, sheet, activeCanvasItemsStore.get());
			addItem(item);
			select([item.id]);
			showToast("Imagen pegada en la hoja.");
		} catch (err) {
			// Cloudinary answers in English; keep the message in the product's language.
			const reason =
				err instanceof Error && err.message === UPLOAD_NOT_CONFIGURED
					? err.message
					: "Revisa tu conexión e inténtalo de nuevo.";
			showToast(`No se pudo subir la imagen pegada. ${reason}`, {
				tone: "error",
				durationMs: 6000,
			});
		}
	};

	useEditorClipboard({
		selectedIds,
		onSelect: select,
		onPasteImage: handlePasteImage,
	});

	// A press on the empty space around the sheet clears the selection (and
	// confirms a crop in progress).
	const outsidePressRef = useRef(() => {});
	useEffect(() => {
		outsidePressRef.current = () => {
			if (croppingId) commitCrop();
			setSelection([]);
			setEditingId(null);
		};
	});
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const clear = (e: PointerEvent) => {
			if (!(e.target as HTMLElement).closest("[data-sheet]")) outsidePressRef.current();
		};
		viewport.addEventListener("pointerdown", clear);
		return () => viewport.removeEventListener("pointerdown", clear);
	}, []);

	// Tablet drawer: focus moves into it on open and back to its opener on close.
	const drawerCloseRef = useRef<HTMLButtonElement>(null);
	const drawerOpenerRef = useRef<HTMLElement | null>(null);
	const openListDrawer = () => {
		drawerOpenerRef.current = document.activeElement as HTMLElement | null;
		setListDrawerOpen(true);
	};
	const closeListDrawer = () => {
		setListDrawerOpen(false);
		drawerOpenerRef.current?.focus();
	};
	useEffect(() => {
		if (!listDrawerOpen) return;
		drawerCloseRef.current?.focus();
		const close = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			setListDrawerOpen(false);
			drawerOpenerRef.current?.focus();
		};
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [listDrawerOpen]);

	// ── Adding ────────────────────────────────────────────────────────────

	// Clicking a photo in the panel and dragging it in do the same: a photo
	// already on the sheet is selected rather than added twice (Duplicar
	// makes a copy), and a new one ends up selected.
	const placePhoto = (photo: Parameters<typeof newPhotoItem>[0], at?: { x: number; y: number }) => {
		const existing = items.find((i) => i.imageSrc === photo.imageSrc);
		if (existing) {
			selectOne(existing.id);
			return;
		}
		const item = newPhotoItem(photo, sheet, items, at);
		addItem(item);
		select([item.id]);
	};
	const handlePickPhoto = (photo: Parameters<typeof newPhotoItem>[0]) => placePhoto(photo);

	const handleAddText = () => {
		const item = newTextItem(sheet, items);
		addItem(item);
		select([item.id]);
		setEditingId(item.id);
		setMobilePanel(null);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const raw = e.dataTransfer.getData("application/x-vision-photo");
		const stage = stageRef.current;
		if (!raw || !stage) return;
		stage.setPointersPositions(e);
		const pos = stage.getPointerPosition();
		if (!pos) return;
		placePhoto(JSON.parse(raw), { x: pos.x / scale, y: pos.y / scale });
	};

	// ── Selected item actions ─────────────────────────────────────────────

	const removeSelected = () => {
		if (selectedIds.length === 0) return;
		removeItems(selectedIds);
		select([]);
		showRemovedToast(selectedIds.length);
	};

	const handleRemoveRow = (id: string) => {
		removeItem(id);
		if (selectedIds.includes(id)) select(selectedIds.filter((x) => x !== id));
		showRemovedToast(1);
	};

	const handleDismiss = (id: string, kind: PrintWarningKind) =>
		setDismissed((prev) => new Set(prev).add(warningKey(id, kind)));

	const commitText = (text: string) => {
		if (editingItem && text !== editingItem.text) {
			const next = text.trim() ? text : "Texto";
			// The box takes every line the new text needs.
			updateItem(editingItem.id, {
				text: next,
				height: measureTextHeight({ ...editingItem, text: next }),
			});
		}
		setEditingId(null);
	};

	/** Lock `ids`, or unlock them all when any is already locked. One write. */
	const toggleLock = (ids: string[]) => {
		const lock = !items.some((i) => ids.includes(i.id) && i.locked);
		updateItems(Object.fromEntries(ids.map((id) => [id, { locked: lock || undefined }])));
	};

	// ── Collage templates ─────────────────────────────────────────────────

	// The selected photos when there are two or more, else every photo on the
	// sheet; hidden and locked ones stay where they are.
	const arrangeable = (list: typeof items) =>
		list.filter((i) => !isTextItem(i) && !i.hidden && !i.locked);
	const selectedPhotos = arrangeable(selectedItems);
	const collageUsesSelection = selectedPhotos.length >= 2;
	const collageTargets = collageUsesSelection ? selectedPhotos : arrangeable(items);
	const images = useStore(canvasImagesStore);

	const applyCollage = (layout: CollageLayout) => {
		if (collageTargets.length < 2) return;
		const texts = items.filter((i) => isTextItem(i) && !i.hidden);
		const patches = collagePatches(
			collageTargets,
			layout,
			sheet,
			(item) => {
				// The photo's own proportions when loaded, its box's otherwise.
				const img = item.imageSrc ? images[item.imageSrc] : undefined;
				return img?.naturalWidth && img.naturalHeight
					? img.naturalWidth / img.naturalHeight
					: item.width / item.height;
			},
			{
				texts,
				// The photo picked first goes big in "Destacada".
				featuredId: selectedIds.find((id) => collageTargets.some((p) => p.id === id)),
			},
		);
		// Texts end up above the photos, in their own order: one write, one undo step.
		const maxZ = Math.max(0, ...items.map((i) => i.zIndex));
		[...texts]
			.sort((a, b) => a.zIndex - b.zIndex)
			.forEach((text, rank) => (patches[text.id] = { zIndex: maxZ + 1 + rank }));
		updateItems(patches);
		const name = { grid: "en cuadrícula", mosaic: "en mosaico", featured: "con una destacada" }[
			layout
		];
		showToast(`Fotos acomodadas ${name}.`, { action: { label: "Deshacer", onClick: undo } });
		setMobilePanel(null);
	};

	// ── Right-click menu (desktop) ────────────────────────────────────────

	// `ids`: what the menu acts on (empty = the bare sheet), fixed when it opens.
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ids: string[] } | null>(
		null,
	);
	const closeContextMenu = useCallback(() => setContextMenu(null), []);

	const openContextMenu = ({ x, y, itemId }: { x: number; y: number; itemId: string | null }) => {
		if (croppingId || editingId) return;
		let ids: string[] = [];
		if (itemId) {
			// Right-clicking outside the selection selects that item first.
			ids = selectedIds.includes(itemId) ? selectedIds : [itemId];
			if (ids !== selectedIds) select(ids);
		}
		setContextMenu({ x, y, ids });
	};

	const contextMenuEntries = (ids: string[]): ContextMenuEntry[] => {
		const paste: ContextMenuEntry = {
			label: "Pegar",
			hint: shortcut("V"),
			disabled: !hasCopiedItems(),
			onSelect: () => select(pasteCopiedItems()),
		};
		if (ids.length === 0) {
			return [
				paste,
				{
					label: "Seleccionar todo",
					hint: shortcut("A"),
					disabled: items.length === 0,
					onSelect: () => select(items.map((i) => i.id)),
				},
				{ label: "Agregar texto", onSelect: handleAddText, separated: true },
			];
		}
		const targets = items.filter((i) => ids.includes(i.id));
		const copy: ContextMenuEntry = {
			label: "Copiar",
			hint: shortcut("C"),
			onSelect: () => copyItems(ids),
		};
		if (targets.some((i) => i.locked)) {
			return [
				copy,
				{
					label: "Desbloquear",
					hint: shortcut("L", { shift: true }),
					onSelect: () => toggleLock(ids),
				},
			];
		}
		const single = targets.length === 1 ? targets[0] : undefined;
		const entries: ContextMenuEntry[] = [];
		if (single && isTextItem(single)) {
			entries.push({ label: "Editar texto", onSelect: () => setEditingId(single.id) });
		}
		if (single && !isTextItem(single) && toolbarActions && toolbarActions.onCrop) {
			entries.push({ label: "Recortar", onSelect: () => startCrop(single.id) });
		}
		entries.push(
			{ ...copy, separated: entries.length > 0 },
			paste,
			{ label: "Duplicar", hint: shortcut("D"), onSelect: () => select(duplicateItems(ids)) },
			{
				label: "Subir una capa",
				hint: shortcut("]"),
				separated: true,
				onSelect: () => moveItemsOneLayer(ids, "up"),
			},
			{
				label: "Bajar una capa",
				hint: shortcut("["),
				onSelect: () => moveItemsOneLayer(ids, "down"),
			},
			{
				label: "Al frente",
				hint: shortcut("]", { shift: true }),
				onSelect: () => bringItemsToFront(ids),
			},
			{
				label: "Al fondo",
				hint: shortcut("[", { shift: true }),
				onSelect: () => sendItemsToBack(ids),
			},
			{
				label: "Bloquear",
				hint: shortcut("L", { shift: true }),
				separated: true,
				onSelect: () => toggleLock(ids),
			},
			{
				label: "Quitar",
				hint: "Supr",
				danger: true,
				onSelect: () => {
					removeItems(ids);
					select([]);
					showRemovedToast(ids.length);
				},
			},
		);
		return entries;
	};

	// ── Saving and leaving ────────────────────────────────────────────────

	// Small JPEG so 20 saved boards stay well inside the localStorage quota.
	const captureThumbnail = (): string | undefined =>
		stageRef.current
			? captureStage(stageRef.current, {
					scaleFactor: scale,
					pixelRatio: THUMBNAIL_WIDTH / logicalWidth,
					mimeType: "image/jpeg",
					quality: 0.8,
				})
			: undefined;

	const handleSave = () => {
		const result = saveCurrentCanvas(captureThumbnail());
		if (result.status === "full") {
			showToast(
				`Ya tienes ${MAX_SAVED_CANVASES} tableros guardados. Elimina uno para guardar este.`,
				{
					tone: "error",
					action: { label: "Ir a Tableros", onClick: () => (window.location.href = "/boards") },
				},
			);
			return;
		}
		showToast("Guardado en Tableros.");
	};

	const handleExport = () => {
		if (items.length === 0) return;
		const saved = autoSaveActiveCanvas(captureThumbnail());
		// A full library can't take this board: say so before leaving.
		if (saved?.status === "full") {
			showToast(
				`No se guardó en Tableros: ya tienes ${MAX_SAVED_CANVASES}. Elimina uno para guardarlo, o exporta igual.`,
				{
					tone: "error",
					durationMs: 10_000,
					action: { label: "Exportar igual", onClick: () => (window.location.href = "/export") },
				},
			);
			return;
		}
		window.location.href = "/export";
	};

	// ── Layout ────────────────────────────────────────────────────────────

	const stageWidth = logicalWidth * scale;
	let toolbarStyle: React.CSSProperties | null = null;
	let toolbarAbove = true;
	if (selectedItems.length > 0 && !interacting && !editingId) {
		// Over the whole selection's bounds.
		const all = selectedItems.map(itemBounds);
		const b = {
			minX: Math.min(...all.map((x) => x.minX)),
			maxX: Math.max(...all.map((x) => x.maxX)),
			minY: Math.min(...all.map((x) => x.minY)),
			maxY: Math.max(...all.map((x) => x.maxY)),
		};
		const centerX = Math.min(stageWidth, Math.max(0, ((b.minX + b.maxX) / 2) * scale));
		// Where the bar would sit (stage px), above or below the selection.
		const band = (above: boolean) => {
			const top = above
				? b.minY * scale - TOOLBAR_GAP_ABOVE - TOOLBAR_HEIGHT
				: b.maxY * scale + TOOLBAR_GAP_BELOW;
			return { top, bottom: top + TOOLBAR_HEIGHT };
		};
		// Does the bar there hide a text that isn't part of the selection?
		const coversText = (above: boolean) => {
			const { top, bottom } = band(above);
			return items.some((i) => {
				if (!isTextItem(i) || i.hidden || selectedIds.includes(i.id)) return false;
				const t = itemBounds(i);
				return (
					t.maxY * scale > top &&
					t.minY * scale < bottom &&
					t.maxX * scale > centerX - TOOLBAR_HALF_WIDTH &&
					t.minX * scale < centerX + TOOLBAR_HALF_WIDTH
				);
			});
		};
		const roomAbove = b.minY * scale > TOOLBAR_CLEARANCE;
		const roomBelow = band(false).bottom < logicalHeight * scale;
		// Above by default; below when there's no room above or the bar would
		// hide a title there and not below.
		toolbarAbove = roomAbove && !(coversText(true) && roomBelow && !coversText(false));
		toolbarStyle = {
			left: centerX,
			top: toolbarAbove ? b.minY * scale - TOOLBAR_GAP_ABOVE : b.maxY * scale + TOOLBAR_GAP_BELOW,
			transform: `translate(-50%, ${toolbarAbove ? "-100%" : "0"})`,
		};
	}

	const toolbarActions = selectedItems.length > 0 && {
		items: selectedItems,
		onUpdate: (patch: Parameters<typeof updateItem>[1]) =>
			selectedItem && updateItem(selectedItem.id, patch),
		onBringToFront: () => bringItemsToFront(selectedIds),
		onSendToBack: () => sendItemsToBack(selectedIds),
		onMoveLayer: (direction: "up" | "down") => moveItemsOneLayer(selectedIds, direction),
		onToggleLock: () => toggleLock(selectedIds),
		onRemove: removeSelected,
		onEditText: () => selectedItem && setEditingId(selectedItem.id),
		onDuplicate: () => select(duplicateItems(selectedIds)),
		onCrop:
			selectedItem &&
			!isTextItem(selectedItem) &&
			!rows
				.find((r) => r.item.id === selectedItem.id)
				?.warnings.some((w) => w.kind === "load-error")
				? () => startCrop(selectedItem.id)
				: undefined,
		onAlign: (edge: AlignEdge, reference: AlignReference) =>
			updateItems(alignPatches(selectedItems, edge, reference, sheet)),
		onDistribute: (axis: DistributeAxis) => updateItems(distributePatches(selectedItems, axis)),
	};

	// The desktop column ends in Exportar; the drawer and the phone panel
	// don't repeat it, the header carries it there.
	const printList = (showExport: boolean) => (
		<PrintList
			showExport={showExport}
			rows={rows}
			warningCount={warningCount}
			selectedIds={selectedIds}
			onSelect={(id, additive) => {
				selectItem(id, additive);
				// On mobile the half-height panel would cover the item just picked.
				if (!isTabletUp) setMobilePanel(null);
			}}
			onDismiss={handleDismiss}
			onRetry={(item) => item.imageSrc && retryCanvasImage(item.imageSrc)}
			onRemove={handleRemoveRow}
			onToggleHidden={(id) => {
				const item = items.find((i) => i.id === id);
				if (item) updateItem(id, { hidden: !item.hidden });
			}}
			onReorder={reorderItems}
			onToggleLock={(id) => toggleLock([id])}
			onSave={handleSave}
			onExport={handleExport}
		/>
	);

	const photosPanel = (
		<PhotosPanel
			onPickPhoto={handlePickPhoto}
			onAddText={handleAddText}
			templateCount={collageTargets.length}
			templateUsesSelection={collageUsesSelection}
			onApplyTemplate={applyCollage}
			className="h-full"
		/>
	);

	return (
		<div className="grid h-[calc(100dvh-3.5rem)] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] md:grid-rows-[auto_minmax(0,1fr)]">
			<EditorHeader
				warningCount={warningCount}
				onOpenList={openListDrawer}
				onExport={handleExport}
				canExport={items.length > 0}
			/>

			<div className="grid min-h-0 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
				{isTabletUp && (
					<aside className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark min-h-0 border-r">
						{photosPanel}
					</aside>
				)}

				<section aria-label="Hoja" className="relative flex min-h-0 min-w-0 flex-col">
					<SheetToolbar
						canUndo={canUndo}
						canRedo={canRedo}
						onUndo={undo}
						onRedo={redo}
						realScale={scale}
						onZoomOut={() => setScale(scale / ZOOM_STEP)}
						onZoomIn={() => setScale(scale * ZOOM_STEP)}
						onFit={() => setZoom(1)}
						onRealSize={() => setScale(1)}
					/>
					<div
						ref={viewportRef}
						className={`relative min-h-0 flex-1 overflow-auto ${spaceHeld ? "cursor-grab active:cursor-grabbing" : ""}`}
						onDrop={handleDrop}
						onDragOver={(e) => e.preventDefault()}
					>
						<div className="flex min-h-full min-w-full p-3 md:p-6">
							<div
								data-sheet
								className="m-auto grid md:grid-cols-[20px_auto] md:grid-rows-[20px_auto]"
							>
								{isTabletUp && (
									<>
										<span aria-hidden="true" />
										<SheetRuler
											orientation="horizontal"
											lengthMm={config.widthMm}
											pxPerMm={MM_TO_PX * scale}
										/>
										<SheetRuler
											orientation="vertical"
											lengthMm={config.heightMm}
											pxPerMm={MM_TO_PX * scale}
										/>
									</>
								)}
								<div className="relative">
									<KonvaCanvas
										stageRef={stageRef}
										logicalWidth={logicalWidth}
										logicalHeight={logicalHeight}
										items={items}
										selectedIds={selectedIds}
										onSelectItem={selectItem}
										onClearSelection={() => select([])}
										onMarqueeSelect={selectMany}
										scaleFactor={scale}
										warnedIds={warnedIds}
										editingId={editingId ?? croppingId}
										onDoubleClickItem={handleDoubleClick}
										crop={
											croppingItem && cropRect
												? {
														item: croppingItem,
														rect: cropRect,
														aspect: cropRatio(cropAspect, cropFlipped),
														onChange: setCropRect,
														onCommit: commitCrop,
													}
												: null
										}
										onInteractionChange={setInteracting}
										onCopied={select}
										onContextMenu={openContextMenu}
									/>
									{items.length === 0 && (
										<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
											<p className="text-df-muted text-sm font-semibold">
												Haz clic en una foto del panel Fotos, o arrástrala aquí, para empezar
											</p>
											<p className="text-df-muted max-w-64 text-xs">
												La línea punteada es el margen de 5 mm que la impresora puede no imprimir.
											</p>
										</div>
									)}
									{editingItem && (
										<TextEditOverlay
											key={editingItem.id}
											item={editingItem}
											scale={scale}
											onCommit={commitText}
											onCancel={() => setEditingId(null)}
										/>
									)}
									{isTabletUp && toolbarStyle && croppingItem && (
										<CropToolbar
											variant="floating"
											style={toolbarStyle}
											aspect={cropAspect}
											onAspect={changeCropAspect}
											flipped={cropFlipped}
											onFlip={cropCanFlip ? flipCropAspect : undefined}
											onCancel={cancelCrop}
											onDone={commitCrop}
										/>
									)}
									{isTabletUp && toolbarActions && toolbarStyle && !croppingItem && (
										<ItemToolbar
											{...toolbarActions}
											variant="floating"
											style={toolbarStyle}
											panelSide={toolbarAbove ? "above" : "below"}
										/>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Mobile: half-height panel over the sheet, no backdrop so the board stays visible. */}
					{!isTabletUp && mobilePanel && (
						<div
							id="mobile-panel"
							className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark absolute inset-x-0 bottom-0 z-30 flex h-[50dvh] flex-col rounded-t-3xl border-t shadow-[0_-12px_32px_-12px_rgb(17_24_39/0.3)]"
						>
							<div className="flex shrink-0 justify-end px-2 pt-1">
								<button
									type="button"
									onClick={() => setMobilePanel(null)}
									aria-label="Cerrar panel"
									className="text-df-muted dark:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark flex h-11 w-11 items-center justify-center rounded-full"
								>
									<X className="h-4 w-4" aria-hidden="true" />
								</button>
							</div>
							<div className="min-h-0 flex-1">
								{mobilePanel === "fotos" ? photosPanel : printList(false)}
							</div>
						</div>
					)}
				</section>

				{isDesktop && (
					<aside className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark min-h-0 border-l">
						{printList(true)}
					</aside>
				)}
			</div>

			{/* Mobile bottom bar: the item's actions when something is selected, otherwise the panel tabs. */}
			{!isTabletUp && (
				<nav
					aria-label={toolbarActions ? "Acciones del elemento" : "Paneles del editor"}
					className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark h-16 border-t"
				>
					{croppingItem ? (
						<CropToolbar
							variant="docked"
							aspect={cropAspect}
							onAspect={changeCropAspect}
							flipped={cropFlipped}
							onFlip={cropCanFlip ? flipCropAspect : undefined}
							onCancel={cancelCrop}
							onDone={commitCrop}
						/>
					) : toolbarActions && !editingId ? (
						<ItemToolbar {...toolbarActions} variant="docked" />
					) : (
						<div className="grid h-full grid-cols-2">
							<MobileTab
								label="Fotos"
								active={mobilePanel === "fotos"}
								onClick={() => setMobilePanel((p) => (p === "fotos" ? null : "fotos"))}
							>
								<Images className="h-5 w-5" aria-hidden="true" />
							</MobileTab>
							<MobileTab
								label={warningCount > 0 ? `Lista (${warningCount})` : "Lista"}
								active={mobilePanel === "lista"}
								onClick={() => setMobilePanel((p) => (p === "lista" ? null : "lista"))}
							>
								<ListChecks className="h-5 w-5" aria-hidden="true" />
							</MobileTab>
						</div>
					)}
				</nav>
			)}

			{/* Tablet: the print list as a drawer opened from the header. */}
			{isTabletUp && !isDesktop && listDrawerOpen && (
				// A dimmed sheet behind the drawer; a click there closes it.
				<button
					type="button"
					tabIndex={-1}
					aria-label="Cerrar la lista"
					onClick={closeListDrawer}
					className="bg-df-ink/20 fixed inset-0 top-14 z-30 cursor-default dark:bg-black/40"
				/>
			)}
			{isTabletUp && !isDesktop && listDrawerOpen && (
				<div
					role="dialog"
					aria-label="Lista de impresión"
					className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark fixed top-14 right-0 bottom-0 z-40 w-80 border-l shadow-[-12px_0_32px_-12px_rgb(17_24_39/0.3)]"
				>
					<button
						ref={drawerCloseRef}
						type="button"
						onClick={closeListDrawer}
						aria-label="Cerrar la lista"
						className="text-df-muted dark:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full"
					>
						<X className="h-4 w-4" aria-hidden="true" />
					</button>
					{printList(false)}
				</div>
			)}

			{contextMenu && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					entries={contextMenuEntries(contextMenu.ids)}
					label={
						contextMenu.ids.length === 0
							? "Acciones de la hoja"
							: contextMenu.ids.length === 1
								? "Acciones del elemento"
								: `Acciones de ${contextMenu.ids.length} elementos`
					}
					onClose={closeContextMenu}
				/>
			)}

			{/* Centred over the sheet (the right column ends in Exportar), above the phone's bottom bar. */}
			<Toast
				placement="center"
				className="max-md:bottom-16"
				message={toast?.message ?? null}
				action={toast?.action}
				tone={toast?.tone}
				onDismiss={dismissToast}
			/>
		</div>
	);
}

function MobileTab({
	label,
	active,
	onClick,
	children,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-expanded={active}
			aria-controls="mobile-panel"
			className={[
				"flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
				active
					? "text-df-primary dark:text-df-primary-dark"
					: "text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark",
			].join(" ")}
		>
			{children}
			{label}
		</button>
	);
}
