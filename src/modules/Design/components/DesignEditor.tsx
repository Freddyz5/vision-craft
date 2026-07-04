import React, { useEffect, useRef, useState } from "react";
import { ImagesTray } from "./ImagesTray";
import { KonvaCanvas } from "./KonvaCanvas";
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
import type { SelectedItemId } from "../types";
import type Konva from "konva";
import {
	Minus,
	Plus,
	X,
	BringToFront,
	SendToBack,
	Trash2,
	ArrowRight,
	CircleCheck,
} from "lucide-react";

const MM_TO_PX = 96 / 25.4;

export default function DesignEditor() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);
	const viewMode = useStore(designViewModeStore);

	const [selectedCanvas, setSelectedCanvas] = useState(false);
	const [zoom, setZoom] = useState(1);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Convert canvas config to logical pixels
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
	const stageRef = useRef<Konva.Stage | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const [scaleFactor, setScaleFactor] = useState(1);

	// Get currently selected item
	const selectedItem = items.find((i) => i.id === selectedId);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Handle responsive scaling of the canvas
	useEffect(() => {
		const updateScale = () => {
			if (!containerRef.current) return;
			const container = containerRef.current;
			const padding = 64; // 32px padding on all sides

			const availableWidth = container.clientWidth - padding;
			const availableHeight = container.clientHeight - padding;

			const scaleX = availableWidth / logicalWidth;
			const scaleY = availableHeight / logicalHeight;

			// Fit within container
			const scale = Math.min(scaleX, scaleY, 1);
			setScaleFactor(scale);
		};

		setTimeout(updateScale, 10);
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, [logicalWidth, logicalHeight]);

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

	const handleCanvas = () => {
		toggleDesignViewMode();
		setSelectedCanvas(!selectedCanvas);
	};

	return (
		<section className="flex flex-1 items-start gap-8 px-8 pb-10">
			{/* ════ LEFT: Canvas ════ */}
			<div className="relative min-w-0 flex-1 space-y-8">
				<article
					ref={containerRef}
					className="bg-base-200/50 dark:bg-base-300/20 border-df-primary/10 relative flex min-h-[480px] flex-1 items-center justify-center overflow-auto rounded-3xl border-2 p-8"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					{/* Zoom controls */}
					<nav
						aria-label="Zoom del lienzo"
						className="bg-base-100/90 dark:bg-df-surface-dark/95 border-base-200 absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-xl border p-1.5 shadow-md backdrop-blur-xs dark:border-gray-800"
					>
						<button
							type="button"
							onClick={() => setZoom((prev) => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))))}
							className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
							title="Alejar"
						>
							<Minus className="h-3.5 w-3.5" aria-hidden="true" />
						</button>
						<span className="text-df-ink dark:text-df-ink-dark min-w-[40px] px-1 text-center text-xs font-semibold select-none">
							{Math.round(zoom * 100)}%
						</span>
						<button
							type="button"
							onClick={() => setZoom((prev) => Math.min(3, parseFloat((prev + 0.1).toFixed(1))))}
							className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
							title="Acercar"
						>
							<Plus className="h-3.5 w-3.5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={() => setZoom(1)}
							className="btn btn-xs btn-ghost text-df-primary dark:text-df-primary-dark text-[10px] font-bold uppercase"
							title="100%"
						>
							100%
						</button>
					</nav>

					{/* Floating Contextual Inspector Panel */}
					{selectedId && selectedItem && (
						<aside
							aria-label="Inspector del elemento"
							className="bg-base-100/95 dark:bg-df-surface-dark/95 border-base-200 animate-fade-in text-df-ink dark:text-df-ink-dark absolute top-4 right-4 z-20 w-64 space-y-4 rounded-2xl border p-4 shadow-xl backdrop-blur-xs dark:border-gray-800"
						>
							<header className="border-base-200 flex items-center justify-between border-b pb-2 dark:border-gray-800">
								<h2 className="text-df-muted dark:text-df-muted-dark text-xs font-bold tracking-wider uppercase">
									{selectedItem.type === "text" ? "Inspector de Texto" : "Inspector de Imagen"}
								</h2>
								<button
									type="button"
									onClick={() => setSelectedId(null)}
									className="btn btn-xs btn-circle btn-ghost"
									aria-label="Cerrar inspector"
								>
									<X className="h-3.5 w-3.5" aria-hidden="true" />
								</button>
							</header>

							{/* Layer actions */}
							<section className="flex flex-col gap-2" aria-label="Capa y orden">
								<h3 className="text-df-muted dark:text-df-muted-dark text-[10px] font-bold tracking-wider uppercase">
									Capa / Orden
								</h3>
								<div className="flex gap-2">
									<button
										onClick={() => {
											bringToFront(selectedItem.id);
											showToast("Elemento traído al frente");
										}}
										type="button"
										className="btn btn-xs btn-outline flex-1"
										title="Traer al frente"
									>
										<BringToFront className="h-3.5 w-3.5" aria-hidden="true" />
										Al Frente
									</button>
									<button
										onClick={() => {
											sendToBack(selectedItem.id);
											showToast("Elemento enviado al fondo");
										}}
										type="button"
										className="btn btn-xs btn-outline flex-1"
										title="Enviar al fondo"
									>
										<SendToBack className="h-3.5 w-3.5" aria-hidden="true" />
										Al Fondo
									</button>
								</div>
							</section>

							{/* Text specific settings */}
							{selectedItem.type === "text" && (
								<section
									className="border-base-200 space-y-3 border-t pt-2 dark:border-gray-800"
									aria-label="Propiedades de texto"
								>
									<div className="form-control w-full">
										<label htmlFor="item-text-content" className="label py-1">
											<span className="label-text text-xs font-semibold">Editar Texto</span>
										</label>
										<textarea
											id="item-text-content"
											value={selectedItem.text || ""}
											onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
											className="textarea textarea-bordered textarea-xs bg-base-100 dark:bg-df-bg-dark min-h-[60px] w-full"
											rows={2}
										/>
									</div>

									<div className="form-control w-full">
										<label htmlFor="item-font-family" className="label py-1">
											<span className="label-text text-xs font-semibold">Tipografía</span>
										</label>
										<select
											id="item-font-family"
											value={selectedItem.fontFamily || "Inter"}
											onChange={(e) => updateItem(selectedItem.id, { fontFamily: e.target.value })}
											className="select select-bordered select-xs bg-base-100 dark:bg-df-bg-dark w-full"
										>
											<option value="Inter">Sans-Serif (Inter)</option>
											<option value="Georgia">Serif (Georgia)</option>
											<option value="Courier New">Monospace (Courier)</option>
											<option value="Comic Sans MS">Handwriting (Comic)</option>
										</select>
									</div>

									<div className="form-control w-full">
										<div className="flex items-center justify-between py-1">
											<span className="label-text text-xs font-semibold">Tamaño</span>
											<span className="font-mono text-xs font-semibold">
												{selectedItem.fontSize || 24}px
											</span>
										</div>
										<input
											type="range"
											min="12"
											max="120"
											value={selectedItem.fontSize || 24}
											onChange={(e) => {
												const newSize = parseInt(e.target.value);
												updateItem(selectedItem.id, {
													fontSize: newSize,
													// Adjust bounding box size roughly
													height: newSize * 1.5,
												});
											}}
											className="range range-xs range-primary"
										/>
									</div>

									<div className="form-control w-full">
										<label htmlFor="item-fill-color" className="label py-1">
											<span className="label-text text-xs font-semibold">Color</span>
										</label>
										<div className="flex items-center gap-3">
											<input
												id="item-fill-color"
												type="color"
												value={selectedItem.fillColor || "#7C3AED"}
												onChange={(e) => updateItem(selectedItem.id, { fillColor: e.target.value })}
												className="border-base-300 h-8 w-8 cursor-pointer rounded border dark:border-gray-700"
											/>
											<span className="font-mono text-xs font-semibold">
												{selectedItem.fillColor || "#7C3AED"}
											</span>
										</div>
									</div>
								</section>
							)}

							{/* Delete action */}
							<section
								className="border-base-200 border-t pt-2 dark:border-gray-800"
								aria-label="Borrado"
							>
								<button
									type="button"
									onClick={() => {
										removeItem(selectedItem.id);
										setSelectedId(null);
										showToast("Elemento eliminado.");
									}}
									className="btn btn-xs btn-error btn-outline w-full"
								>
									<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
									Borrar Elemento
								</button>
							</section>
						</aside>
					)}

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

				<article className="flex w-full justify-center gap-3">
					<button
						onClick={handleSave}
						className="bg-df-primary flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
					>
						Guardar
					</button>

					<a
						href="/export"
						className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r px-8 py-2.5 text-base font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
					>
						Exportar
						<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
					</a>

					<button
						onClick={handleCanvas}
						className={`flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${selectedCanvas ? "bg-df-accent" : "bg-df-primary"}`}
					>
						{selectedCanvas ? "Mis imagenes" : "Mis Lienzos"}
					</button>
				</article>
			</div>

			{/* ════ RIGHT: Images Tray ════ */}
			<ImagesTray viewMode={viewMode} selectedId={selectedId} setSelectedId={setSelectedId} />

			{/* Lightweight Toast Notifications */}
			{toastMessage && (
				<div className="toast toast-end toast-bottom z-50">
					<div className="alert alert-success flex items-center gap-2 font-semibold text-white shadow-lg">
						<CircleCheck className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
						<span>{toastMessage}</span>
					</div>
				</div>
			)}
		</section>
	);
}
