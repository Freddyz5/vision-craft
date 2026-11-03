import React, { useEffect, useMemo, useRef, useState } from "react";
import { Images, ListChecks, X } from "lucide-react";
import { useStore } from "@nanostores/react";
import type Konva from "konva";
import { EditorHeader } from "./EditorHeader";
import { PhotosPanel } from "./PhotosPanel";
import { PrintList } from "./PrintList";
import { SheetToolbar } from "./SheetToolbar";
import { SheetRuler, RULER_SIZE } from "./SheetRuler";
import { KonvaCanvas } from "./KonvaCanvas";
import { ItemToolbar } from "./ItemToolbar";
import { TextEditOverlay } from "./TextEditOverlay";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	addItem,
	autoSaveActiveCanvas,
	bringToFront,
	duplicateItems,
	MAX_SAVED_CANVASES,
	removeItem,
	saveCurrentCanvas,
	sendToBack,
	updateItem,
} from "../../../shared/store/canvasStore";
import { retryCanvasImage } from "../../../shared/store/canvasImages";
import {
	historyFutureStore,
	historyPastStore,
	redo,
	resetHistory,
	undo,
} from "../../../shared/store/canvasHistory";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import { Toast } from "../../../shared/components/Toast";
import { captureStage } from "../../../shared/utils/stageCapture";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useEditorClipboard } from "../hooks/useEditorClipboard";
import { usePrintChecks } from "../hooks/usePrintChecks";
import { itemBounds, warningKey, type PrintWarningKind } from "../utils/printChecks";
import { newPhotoItem, newTextItem } from "../utils/newItems";
import type { SelectedItemId } from "../types";

const THUMBNAIL_WIDTH = 320;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_STEP = 1.25;
/** The floating toolbar clears the Transformer's rotate handle when it sits above an item. */
const TOOLBAR_GAP_ABOVE = 44;
const TOOLBAR_GAP_BELOW = 12;
/** Room it needs above the item (gap + its own height) before it flips below. */
const TOOLBAR_CLEARANCE = TOOLBAR_GAP_ABOVE + 48;

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

	const isTabletUp = useMediaQuery("(min-width: 768px)");
	const isDesktop = useMediaQuery("(min-width: 1024px)");

	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;
	const sheet = useMemo(
		() => ({ width: logicalWidth, height: logicalHeight }),
		[logicalWidth, logicalHeight],
	);

	const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [interacting, setInteracting] = useState(false);
	const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
	const [listDrawerOpen, setListDrawerOpen] = useState(false);
	const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
	const [zoom, setZoom] = useState(1);

	const selectedItem = items.find((i) => i.id === selectedId);
	const editingItem = items.find((i) => i.id === editingId);
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

	const select = (id: SelectedItemId) => {
		setSelectedId(id);
		if (id !== editingId) setEditingId(null);
	};

	const showRemovedToast = (count: number) =>
		showToast(count === 1 ? "Elemento quitado." : `${count} elementos quitados.`, {
			label: "Deshacer",
			onClick: undo,
		});

	useEditorShortcuts({
		selectedIds: selectedId ? [selectedId] : [],
		onClearSelection: () => select(null),
		onRemoved: showRemovedToast,
		onSelect: (ids) => select(ids[0] ?? null),
	});

	useEditorClipboard({
		selectedIds: selectedId ? [selectedId] : [],
		onSelect: (ids) => select(ids[0] ?? null),
	});

	// A press on the empty space around the sheet clears the selection.
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const clear = (e: PointerEvent) => {
			if (!(e.target as HTMLElement).closest("[data-sheet]")) {
				setSelectedId(null);
				setEditingId(null);
			}
		};
		viewport.addEventListener("pointerdown", clear);
		return () => viewport.removeEventListener("pointerdown", clear);
	}, []);

	useEffect(() => {
		if (!listDrawerOpen) return;
		const close = (e: KeyboardEvent) => e.key === "Escape" && setListDrawerOpen(false);
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [listDrawerOpen]);

	// ── Adding ────────────────────────────────────────────────────────────

	const handlePickPhoto = (photo: Parameters<typeof newPhotoItem>[0]) => {
		const existing = items.find((i) => i.imageSrc === photo.imageSrc);
		if (existing) {
			select(existing.id);
			return;
		}
		addItem(newPhotoItem(photo, sheet, items));
	};

	const handleAddText = () => {
		const item = newTextItem(sheet, items);
		addItem(item);
		setSelectedId(item.id);
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
		addItem(newPhotoItem(JSON.parse(raw), sheet, items, { x: pos.x / scale, y: pos.y / scale }));
	};

	// ── Selected item actions ─────────────────────────────────────────────

	const removeSelected = () => {
		if (!selectedItem) return;
		removeItem(selectedItem.id);
		select(null);
		showRemovedToast(1);
	};

	const handleRemoveRow = (id: string) => {
		removeItem(id);
		if (id === selectedId) select(null);
		showRemovedToast(1);
	};

	const handleDismiss = (id: string, kind: PrintWarningKind) =>
		setDismissed((prev) => new Set(prev).add(warningKey(id, kind)));

	const commitText = (text: string) => {
		if (editingItem && text !== editingItem.text) {
			updateItem(editingItem.id, { text: text.trim() ? text : "Texto" });
		}
		setEditingId(null);
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
				{ label: "Ir a Tableros", onClick: () => (window.location.href = "/boards") },
			);
			return;
		}
		showToast("Guardado en Tableros.");
	};

	const handleExport = () => {
		autoSaveActiveCanvas(captureThumbnail());
		window.location.href = "/export";
	};

	// ── Layout ────────────────────────────────────────────────────────────

	const stageWidth = logicalWidth * scale;
	let toolbarStyle: React.CSSProperties | null = null;
	if (selectedItem && !interacting && !editingId) {
		const b = itemBounds(selectedItem);
		const centerX = Math.min(stageWidth, Math.max(0, ((b.minX + b.maxX) / 2) * scale));
		const above = b.minY * scale > TOOLBAR_CLEARANCE;
		toolbarStyle = {
			left: centerX,
			top: above ? b.minY * scale - TOOLBAR_GAP_ABOVE : b.maxY * scale + TOOLBAR_GAP_BELOW,
			transform: `translate(-50%, ${above ? "-100%" : "0"})`,
		};
	}

	const toolbarActions = selectedItem && {
		item: selectedItem,
		onUpdate: (patch: Parameters<typeof updateItem>[1]) => updateItem(selectedItem.id, patch),
		onBringToFront: () => bringToFront(selectedItem.id),
		onSendToBack: () => sendToBack(selectedItem.id),
		onRemove: removeSelected,
		onEditText: () => setEditingId(selectedItem.id),
		onDuplicate: () => select(duplicateItems([selectedItem.id])[0] ?? null),
	};

	const printList = (
		<PrintList
			rows={rows}
			warningCount={warningCount}
			selectedId={selectedId}
			onSelect={(id) => {
				select(id);
				// On mobile the half-height panel would cover the item just picked.
				if (!isTabletUp) setMobilePanel(null);
			}}
			onDismiss={handleDismiss}
			onRetry={(item) => item.imageSrc && retryCanvasImage(item.imageSrc)}
			onRemove={handleRemoveRow}
			onSave={handleSave}
			onExport={handleExport}
		/>
	);

	const photosPanel = (
		<PhotosPanel onPickPhoto={handlePickPhoto} onAddText={handleAddText} className="h-full" />
	);

	return (
		<div className="grid h-[calc(100dvh-3.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] md:grid-rows-[auto_minmax(0,1fr)]">
			<EditorHeader warningCount={warningCount} onOpenList={() => setListDrawerOpen(true)} />

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
						className="relative min-h-0 flex-1 overflow-auto"
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
										selectedId={selectedId}
										setSelectedId={select}
										scaleFactor={scale}
										warnedIds={warnedIds}
										editingId={editingId}
										onEditText={(id) => {
											setSelectedId(id);
											setEditingId(id);
										}}
										onInteractionChange={setInteracting}
										onCopied={select}
									/>
									{items.length === 0 && (
										<p className="text-df-muted pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold">
											Toca una foto para añadirla
										</p>
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
									{isTabletUp && toolbarActions && toolbarStyle && (
										<ItemToolbar {...toolbarActions} variant="floating" style={toolbarStyle} />
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
							<button
								type="button"
								onClick={() => setMobilePanel(null)}
								aria-label="Cerrar panel"
								className="text-df-muted dark:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full"
							>
								<X className="h-4 w-4" aria-hidden="true" />
							</button>
							<div className="min-h-0 flex-1">
								{mobilePanel === "fotos" ? photosPanel : printList}
							</div>
						</div>
					)}
				</section>

				{isDesktop && (
					<aside className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark min-h-0 border-l">
						{printList}
					</aside>
				)}
			</div>

			{/* Mobile bottom bar: the item's actions when something is selected, otherwise the panel tabs. */}
			{!isTabletUp && (
				<nav
					aria-label={toolbarActions ? "Acciones del elemento" : "Paneles del editor"}
					className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark h-16 border-t"
				>
					{toolbarActions && !editingId ? (
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
				<div
					role="dialog"
					aria-label="Lista de impresión"
					className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark fixed top-14 right-0 bottom-0 z-40 w-80 border-l shadow-[-12px_0_32px_-12px_rgb(17_24_39/0.3)]"
				>
					<button
						type="button"
						onClick={() => setListDrawerOpen(false)}
						aria-label="Cerrar la lista"
						className="text-df-muted dark:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full"
					>
						<X className="h-4 w-4" aria-hidden="true" />
					</button>
					{printList}
				</div>
			)}

			<Toast message={toast?.message ?? null} action={toast?.action} onDismiss={dismissToast} />
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
