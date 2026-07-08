import React, { useRef, useState } from "react";
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
	saveCurrentCanvas,
	sendToBack,
	updateItem,
	removeItem,
} from "../../../shared/store/canvasStore";
import { designViewModeStore, toggleDesignViewMode } from "../../../shared/store/designViewStore";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { Toast } from "../../../shared/components/Toast";
import type { SelectedItemId } from "../types";
import type Konva from "konva";

const MM_TO_PX = 96 / 25.4;

export default function DesignEditor() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);
	const viewMode = useStore(designViewModeStore);

	const [zoom, setZoom] = useState(1);
	const { toastMessage, showToast } = useToast();

	// Convert canvas config to logical pixels
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
	const stageRef = useRef<Konva.Stage | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const scaleFactor = useContainerScale(containerRef, logicalWidth, logicalHeight);

	// Get currently selected item
	const selectedItem = items.find((i) => i.id === selectedId);

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

	const handleSave = () => {
		let thumbnail = undefined;
		if (stageRef?.current) {
			thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.5 });
		}
		saveCurrentCanvas(thumbnail);
		showToast("Lienzo guardado exitosamente.");
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<section className="flex flex-1 items-start gap-8 px-8 pb-10">
			{/* ════ LEFT: Canvas ════ */}
			<div className="relative min-w-0 flex-1 space-y-8">
				<article
					ref={containerRef}
					className="bg-base-200/50 dark:bg-base-300/20 border-df-primary/10 relative flex min-h-120 flex-1 items-center justify-center overflow-auto rounded-3xl border-2 p-8"
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
					isCanvasView={viewMode === "canvases"}
					onToggleView={toggleDesignViewMode}
				/>
			</div>

			{/* ════ RIGHT: Item Inspector (when selected) or Images Tray ════ */}
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

			<Toast message={toastMessage} />
		</section>
	);
}
