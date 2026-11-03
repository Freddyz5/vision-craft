import type React from "react";
import { useStore } from "@nanostores/react";
import { ImagePlus, Type } from "lucide-react";
import { selectedImagesStore } from "../../../shared/store/boardStore";
import { activeCanvasItemsStore } from "../../../shared/store/canvasStore";
import ImageCard from "../../Explore/components/ImageCard";

interface PhotosPanelProps {
	/** Click: add the photo to the sheet (or select it if it's already there). */
	onPickPhoto: (photo: { imageSrc: string; alt: string; width: number; height: number }) => void;
	onAddText: () => void;
	className?: string;
}

/** The photos chosen in Explora, always at hand: click to add, or drag onto the sheet. */
export function PhotosPanel({ onPickPhoto, onAddText, className = "" }: PhotosPanelProps) {
	const photos = useStore(selectedImagesStore);
	const items = useStore(activeCanvasItemsStore);

	const handleDragStart = (
		e: React.DragEvent<HTMLElement>,
		photo: { imageSrc: string; alt: string; width: number; height: number },
	) => {
		e.dataTransfer.setData("application/x-vision-photo", JSON.stringify(photo));
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<section aria-labelledby="photos-panel-title" className={`flex min-h-0 flex-col ${className}`}>
			<div className="space-y-3 px-4 pt-4 pb-3">
				<h2 id="photos-panel-title" className="text-df-ink dark:text-df-ink-dark text-sm font-bold">
					Tus fotos
					<span className="text-df-muted dark:text-df-muted-dark ml-1.5 font-semibold">
						{photos.length}
					</span>
				</h2>
				<button
					type="button"
					onClick={onAddText}
					className="text-df-primary dark:text-df-primary-dark bg-df-primary/10 dark:bg-df-primary-dark/15 hover:bg-df-primary/15 dark:hover:bg-df-primary-dark/25 focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2"
				>
					<Type className="h-3.5 w-3.5" aria-hidden="true" />
					Agregar texto
				</button>
			</div>

			{photos.length === 0 ? (
				<div className="text-df-muted dark:text-df-muted-dark flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-10 text-center text-sm">
					<ImagePlus className="h-6 w-6" aria-hidden="true" />
					<p>Aún no elegiste fotos para este tablero.</p>
					<a
						href="/explore"
						className="text-df-primary dark:text-df-primary-dark border-df-primary/40 dark:border-df-primary-dark/40 hover:bg-df-primary/10 dark:hover:bg-df-primary-dark/15 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
					>
						Ir a Explora
					</a>
				</div>
			) : (
				// eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style; el rol explícito evita que Safari/VoiceOver pierda la semántica de lista.
				<ul
					role="list"
					className="grid min-h-0 flex-1 grid-flow-row-dense auto-rows-[88px] grid-cols-2 gap-2.5 overflow-y-auto px-4 pb-4"
				>
					{photos.map((img, index) => {
						const photo = {
							imageSrc: img.imageSrc,
							alt: img.alt,
							width: img.width || 800,
							height: img.height || 600,
						};
						return (
							<ImageCard
								key={`${img.imageSrc}-${index}`}
								width={String(photo.width)}
								height={String(photo.height)}
								imageSrc={img.imageSrc}
								alt={img.alt}
								selected={items.some((i) => i.imageSrc === img.imageSrc)}
								onClick={() => onPickPhoto(photo)}
								onDragStart={(e) => handleDragStart(e, photo)}
							/>
						);
					})}
				</ul>
			)}
		</section>
	);
}
