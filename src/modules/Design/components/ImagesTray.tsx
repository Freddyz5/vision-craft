import React from "react";
import { useStore } from "@nanostores/react";
import { selectedImagesStore } from "../../../shared/store/boardStore";
import {
	activeCanvasItemsStore,
	addItem,
	savedCanvasesStore,
} from "../../../shared/store/canvasStore";
import ImageCard from "../../Explore/components/ImageCard";
import CanvasCard from "./CanvasCard";
import { Type } from "lucide-react";

interface ImagesTrayProps {
	viewMode?: "images" | "canvases";
	selectedId?: string | null;
	setSelectedId: (id: string | null) => void;
}

export function ImagesTray({ viewMode = "images", setSelectedId }: ImagesTrayProps) {
	const selectedImages = useStore(selectedImagesStore);
	const canvasItems = useStore(activeCanvasItemsStore);
	const savedCanvases = useStore(savedCanvasesStore);

	// For drag start on images
	const handleDragStart = (
		e: React.DragEvent<HTMLImageElement>,
		imageSrc: string,
		width: number,
		height: number,
	) => {
		e.dataTransfer.setData("imageSrc", imageSrc);
		e.dataTransfer.setData("imgWidth", width.toString());
		e.dataTransfer.setData("imgHeight", height.toString());
	};

	const handleAddClick = (imageSrc: string, width: number, height: number) => {
		// If the image is already on the canvas, select it and return (no duplicates)
		const existing = canvasItems.find((i) => i.imageSrc === imageSrc);
		if (existing) {
			setSelectedId(existing.id);
			return;
		}

		const targetW = 200;
		const targetH = (height / width) * targetW;

		const newItem = {
			id: crypto.randomUUID(),
			type: "image" as const,
			imageSrc,
			alt: "Added Image",
			x: 50, // naive positioning
			y: 50,
			width: targetW,
			height: targetH,
			rotation: 0,
			zIndex: canvasItems.length,
		};
		addItem(newItem);
		setSelectedId(newItem.id);
	};

	const handleAddText = () => {
		const newItem = {
			id: crypto.randomUUID(),
			type: "text" as const,
			text: "Sueña en grande",
			x: 100,
			y: 100,
			width: 250,
			height: 60,
			rotation: 0,
			fontSize: 28,
			fillColor: "#7C3AED",
			fontFamily: "Inter",
			zIndex: canvasItems.length,
		};
		addItem(newItem);
		setSelectedId(newItem.id);
	};

	return (
		<aside
			className="bg-df-surface dark:bg-df-surface-dark lg:border-df-primary/20 min-h-0 w-full flex-1 space-y-4 overflow-y-auto p-5 lg:sticky lg:top-24 lg:-mt-55 lg:h-[calc(100vh-8rem)] lg:w-96 lg:flex-none lg:shrink-0 lg:overflow-y-scroll lg:rounded-3xl lg:border-2 lg:shadow-md"
			aria-label="Bandeja de imagenes"
		>
			{viewMode === "canvases" ? (
				<>
					{/* Canvases */}
					{/* Label */}
					<p className="text-df-muted dark:text-df-muted-dark text-center text-[9px] font-bold tracking-[0.22em] uppercase">
						Mis Lienzos ({savedCanvases.length})
					</p>

					{/* Canvases Tray */}
					<article className="flex-1 space-y-4 overflow-y-auto p-4">
						{savedCanvases.length === 0 ? (
							<div className="text-base-content/50 mt-10 text-center">
								<p>No tienes lienzos guardados.</p>
								<p className="mt-2 text-xs">Guarda uno en el editor</p>
							</div>
						) : (
							<>
								{/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style; el rol explícito evita que Safari/VoiceOver pierda la semántica de lista. */}
								<ul role="list" className="space-y-3">
									{savedCanvases.map((canvas) => (
										<CanvasCard key={canvas.id} canvas={canvas} />
									))}
								</ul>
							</>
						)}
					</article>
				</>
			) : (
				<>
					{/* Images */}
					{/* Label */}
					<p className="text-df-muted dark:text-df-muted-dark mb-2 text-center text-[9px] font-bold tracking-[0.22em] uppercase">
						Tus Imágenes ({selectedImages.length})
					</p>

					<button
						onClick={handleAddText}
						className="bg-df-primary/10 hover:bg-df-primary/20 text-df-primary dark:text-df-primary-dark dark:bg-df-primary-dark/10 dark:hover:bg-df-primary-dark/20 border-df-primary/20 mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
					>
						<Type className="h-3.5 w-3.5" aria-hidden="true" />
						Agregar Texto
					</button>

					{/* Images Tray */}
					<article className="flex-1 space-y-4 overflow-y-auto p-4">
						{selectedImages.length === 0 ? (
							<div className="text-base-content/50 mt-10 text-center">
								<p>No hay imágenes seleccionadas.</p>
								<a href="/explore" className="btn btn-outline btn-sm mt-4">
									Explorar
								</a>
							</div>
						) : (
							<>
								{/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style; el rol explícito evita que Safari/VoiceOver pierda la semántica de lista. */}
								<ul
									role="list"
									className="grid grid-flow-row-dense auto-rows-[100px] grid-cols-2 gap-3"
								>
									{selectedImages.map((img, index) => {
										const inCanvas = canvasItems.some((i) => i.imageSrc === img.imageSrc);
										return (
											<ImageCard
												key={`${img.imageSrc}-${index}`}
												width={img.width.toString()}
												height={img.height.toString()}
												imageSrc={img.imageSrc}
												alt={img.alt}
												selected={inCanvas}
												onClick={() =>
													handleAddClick(img.imageSrc, img.width || 800, img.height || 600)
												}
												onDragStart={(e) =>
													handleDragStart(e, img.imageSrc, img.width || 800, img.height || 600)
												}
											/>
										);
									})}
								</ul>
							</>
						)}
					</article>
				</>
			)}
		</aside>
	);
}
