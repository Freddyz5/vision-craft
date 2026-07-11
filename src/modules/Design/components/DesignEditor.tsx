import React, { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { ImagesTray } from "./ImagesTray";
import { KonvaCanvas } from "./KonvaCanvas";
import { ZoomControls } from "./ZoomControls";
import { ItemInspector } from "./ItemInspector";
import { DesignActionBar } from "./DesignActionBar";
import { useStore } from "@nanostores/react";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	addItem,
	bringToFront,
	autoSaveActiveCanvas,
	saveCurrentCanvas,
	sendToBack,
	updateItem,
	removeItem,
} from "../../../shared/store/canvasStore";
import {
	historyPastStore,
	historyFutureStore,
	undo,
	redo,
	resetHistory,
} from "../../../shared/store/canvasHistory";
import { designViewModeStore, toggleDesignViewMode } from "../../../shared/store/designViewStore";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { useUndoRedoShortcuts } from "../hooks/useUndoRedoShortcuts";
import { Toast } from "../../../shared/components/Toast";
import type { SelectedItemId } from "../types";
import type Konva from "konva";

const MM_TO_PX = 96 / 25.4;

export default function DesignEditor() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);
	const viewMode = useStore(designViewModeStore);
	const canUndo = useStore(historyPastStore).length > 0;
	const canRedo = useStore(historyFutureStore).length > 0;

	const [zoom, setZoom] = useState(1);
	const { toastMessage, showToast } = useToast();

	useUndoRedoShortcuts();
	useEffect(() => resetHistory(), []);

	// Convert canvas config to logical pixels
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
	const stageRef = useRef<Konva.Stage | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const scaleFactor = useContainerScale(containerRef, logicalWidth, logicalHeight);

	// Get currently selected item
	const selectedItem = items.find((i) => i.id === selectedId);

	// Mobile: the tray/inspector is a collapsible bottom sheet. Auto-open it
	// when an item gets selected so the inspector is visible. Adjusted during
	// render (not in an effect) to avoid react-hooks/set-state-in-effect.
	const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
	const [prevSelectedId, setPrevSelectedId] = useState(selectedId);
	if (selectedId !== prevSelectedId) {
		setPrevSelectedId(selectedId);
		if (selectedId) setMobilePanelOpen(true);
	}

	// Handle Drag & Drop from ImagesTray
	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const imageSrc = e.dataTransfer.getData("imageSrc");
		const imgWidthRaw = e.dataTransfer.getData("imgWidth");
		const imgHeightRaw = e.dataTransfer.getData("imgHeight");

		if (!imageSrc) return;

		const imgWidth = parseInt(imgWidthRaw) || 800;
		const imgHeight = parseInt(imgHeightRaw) || 600;

		const totalScale = scaleFactor * zoom;

		if (stageRef.current) {
			stageRef.current.setPointersPositions(e);
			const pos = stageRef.current.getPointerPosition();

			if (pos) {
				// Adjust position for totalScale (scaleFactor * zoom)
				const x = pos.x / totalScale;
				const y = pos.y / totalScale;

				const targetW = 200;
				const targetH = (imgHeight / imgWidth) * targetW;

				// Center the image around the drop point
				addItem({
					id: crypto.randomUUID(),
					type: "image",
					imageSrc,
					alt: "Dropped Image",
					x: x - targetW / 2,
					y: y - targetH / 2,
					width: targetW,
					height: targetH,
					rotation: 0,
					zIndex: items.length,
				});
			}
		}
	};

	const captureThumbnail = (): string | undefined =>
		stageRef?.current ? stageRef.current.toDataURL({ pixelRatio: 0.5 }) : undefined;

	const handleSave = () => {
		saveCurrentCanvas(captureThumbnail());
		showToast("Lienzo guardado exitosamente.");
	};

	// Auto-save (unless empty) before advancing to the Export step.
	const handleGoExport = () => {
		autoSaveActiveCanvas(captureThumbnail());
		window.location.href = "/export";
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<section className="flex flex-1 flex-col gap-8 px-4 pb-24 sm:px-8 lg:flex-row lg:items-start lg:pb-10">
			{/* ════ LEFT: Canvas ════ */}
			<div className="relative min-w-0 flex-1 space-y-6 lg:space-y-8">
				<article
					ref={containerRef}
					className="bg-df-surface dark:bg-base-300/20 border-df-primary/10 relative flex min-h-96 flex-1 items-center justify-center overflow-auto rounded-3xl border-2 p-4 lg:min-h-120 lg:p-8"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					<ZoomControls
						zoom={zoom}
						onZoomOut={() => setZoom((prev) => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))))}
						onZoomIn={() => setZoom((prev) => Math.min(3, parseFloat((prev + 0.1).toFixed(1))))}
						onReset={() => setZoom(1)}
					/>

					<div className="border-base-300 overflow-hidden rounded-sm border bg-white shadow-2xl dark:border-gray-800">
						<KonvaCanvas
							stageRef={stageRef}
							logicalWidth={logicalWidth}
							logicalHeight={logicalHeight}
							items={items}
							selectedId={selectedId}
							setSelectedId={setSelectedId}
							scaleFactor={scaleFactor * zoom}
						/>
					</div>
				</article>

				<DesignActionBar
					onSave={handleSave}
					onExport={handleGoExport}
					onUndo={undo}
					onRedo={redo}
					canUndo={canUndo}
					canRedo={canRedo}
					isCanvasView={viewMode === "canvases"}
					onToggleView={toggleDesignViewMode}
				/>
			</div>

			{/* Mobile backdrop — tap to collapse the bottom sheet. */}
			{mobilePanelOpen && (
				<button
					type="button"
					aria-label="Cerrar panel"
					onClick={() => setMobilePanelOpen(false)}
					className="fixed inset-0 z-30 bg-black/40 lg:hidden"
				/>
			)}

			{/* ════ RIGHT: Item Inspector (when selected) or Images Tray ════
			    Sidebar on lg+ (the wrapper collapses via lg:contents so the
			    aside inside becomes the flex column). On mobile it's a
			    collapsible bottom sheet driven by mobilePanelOpen. */}
			<div
				className={[
					"border-df-primary/20 bg-df-surface dark:bg-df-surface-dark fixed inset-x-0 bottom-0 z-40 flex max-h-[80vh] flex-col rounded-t-3xl border-t-2 shadow-2xl transition-transform duration-300 lg:contents",
					mobilePanelOpen ? "translate-y-0" : "translate-y-[calc(100%-3.25rem)] lg:translate-y-0",
				].join(" ")}
			>
				<button
					type="button"
					onClick={() => setMobilePanelOpen((open) => !open)}
					aria-expanded={mobilePanelOpen}
					className="text-df-muted dark:text-df-muted-dark flex shrink-0 items-center justify-between px-5 py-3 text-[10px] font-bold tracking-[0.2em] uppercase lg:hidden"
				>
					{selectedId && selectedItem ? "Editar elemento" : "Tus imágenes / lienzos"}
					<ChevronUp
						className={`h-4 w-4 transition-transform ${mobilePanelOpen ? "rotate-180" : ""}`}
						aria-hidden="true"
					/>
				</button>

				{selectedId && selectedItem ? (
					<ItemInspector
						item={selectedItem}
						onClose={() => setSelectedId(null)}
						onUpdate={(patch) => updateItem(selectedItem.id, patch)}
						onBringToFront={() => {
							bringToFront(selectedItem.id);
							showToast("Elemento traído al frente");
						}}
						onSendToBack={() => {
							sendToBack(selectedItem.id);
							showToast("Elemento enviado al fondo");
						}}
						onDelete={() => {
							removeItem(selectedItem.id);
							setSelectedId(null);
							showToast("Elemento eliminado.");
						}}
					/>
				) : (
					<ImagesTray viewMode={viewMode} selectedId={selectedId} setSelectedId={setSelectedId} />
				)}
			</div>

			<Toast message={toastMessage} />
		</section>
	);
}
