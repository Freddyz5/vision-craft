import type React from "react";
import { useId, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { ImagePlus, Type } from "lucide-react";
import { selectedImagesStore } from "../../../shared/store/boardStore";
import { activeCanvasItemsStore } from "../../../shared/store/canvasStore";
import ImageCard from "../../Explore/components/ImageCard";
import type { CollageLayout } from "../utils/collage";

interface PhotosPanelProps {
	/** Click: add the photo to the sheet (or select it if it's already there). */
	onPickPhoto: (photo: { imageSrc: string; alt: string; width: number; height: number }) => void;
	onAddText: () => void;
	/** How many photos a template would arrange (the selected ones, or all). */
	templateCount: number;
	/** Whether that count is the selection rather than every photo on the sheet. */
	templateUsesSelection: boolean;
	onApplyTemplate: (layout: CollageLayout) => void;
	className?: string;
}

type Tab = "fotos" | "plantillas";

/**
 * The left column: the photos chosen in Explora (click to add, or drag
 * onto the sheet) and, in a second tab, the collage templates.
 */
export function PhotosPanel({
	onPickPhoto,
	onAddText,
	templateCount,
	templateUsesSelection,
	onApplyTemplate,
	className = "",
}: PhotosPanelProps) {
	const [tab, setTab] = useState<Tab>("fotos");
	const id = useId();
	const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ fotos: null, plantillas: null });

	const tabs: { id: Tab; label: string }[] = [
		{ id: "fotos", label: "Fotos" },
		{ id: "plantillas", label: "Plantillas" },
	];

	return (
		<section aria-label="Fotos y plantillas" className={`flex min-h-0 flex-col ${className}`}>
			<div
				role="tablist"
				aria-label="Panel"
				className="bg-df-well dark:bg-df-well-dark mx-4 mt-4 grid grid-cols-2 gap-1 rounded-full p-1"
			>
				{tabs.map((t) => (
					<button
						key={t.id}
						ref={(el) => {
							tabRefs.current[t.id] = el;
						}}
						type="button"
						role="tab"
						id={`${id}-${t.id}-tab`}
						aria-selected={tab === t.id}
						aria-controls={`${id}-${t.id}`}
						tabIndex={tab === t.id ? 0 : -1}
						onClick={() => setTab(t.id)}
						onKeyDown={(e) => {
							// Arrows move between the two tabs.
							if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
							const next: Tab = t.id === "fotos" ? "plantillas" : "fotos";
							setTab(next);
							tabRefs.current[next]?.focus();
						}}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-full py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2",
							tab === t.id
								? "bg-df-surface dark:bg-df-hairline-dark text-df-ink dark:text-df-ink-dark shadow-sm"
								: "text-df-ink/70 dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark",
						].join(" ")}
					>
						{t.label}
					</button>
				))}
			</div>

			<div
				role="tabpanel"
				id={`${id}-${tab}`}
				aria-labelledby={`${id}-${tab}-tab`}
				className="flex min-h-0 flex-1 flex-col"
			>
				{tab === "fotos" ? (
					<PhotosTab onPickPhoto={onPickPhoto} onAddText={onAddText} />
				) : (
					<TemplatesTab
						count={templateCount}
						usesSelection={templateUsesSelection}
						onApply={onApplyTemplate}
					/>
				)}
			</div>
		</section>
	);
}

function PhotosTab({
	onPickPhoto,
	onAddText,
}: Pick<PhotosPanelProps, "onPickPhoto" | "onAddText">) {
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
		<>
			<div className="space-y-3 px-4 pt-3 pb-3">
				<p className="text-df-muted dark:text-df-muted-dark text-xs font-semibold">
					{photos.length === 1 ? "1 foto elegida" : `${photos.length} fotos elegidas`}
				</p>
				<button
					type="button"
					onClick={onAddText}
					className="text-df-primary dark:text-df-primary-dark bg-df-primary/10 dark:bg-df-primary-dark/10 hover:bg-df-primary/15 dark:hover:bg-df-primary-dark/15 focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2"
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
		</>
	);
}

const TEMPLATES: { layout: CollageLayout; label: string; hint: string; cells: number[][] }[] = [
	{
		layout: "grid",
		label: "Cuadrícula",
		hint: "Todas del mismo tamaño",
		cells: [
			[2, 2, 17, 17],
			[21, 2, 17, 17],
			[2, 21, 17, 17],
			[21, 21, 17, 17],
		],
	},
	{
		layout: "mosaic",
		label: "Mosaico",
		hint: "Cada foto con su forma",
		cells: [
			[2, 2, 22, 15],
			[26, 2, 12, 15],
			[2, 19, 11, 19],
			[15, 19, 23, 19],
		],
	},
	{
		layout: "featured",
		label: "Destacada",
		hint: "Una grande (la que selecciones) y las demás abajo",
		cells: [
			[2, 2, 36, 22],
			[2, 26, 11, 12],
			[14.5, 26, 11, 12],
			[27, 26, 11, 12],
		],
	},
];

function TemplatesTab({
	count,
	usesSelection,
	onApply,
}: {
	count: number;
	usesSelection: boolean;
	onApply: (layout: CollageLayout) => void;
}) {
	return (
		<div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-3 pb-4">
			<p className="text-df-muted dark:text-df-muted-dark text-xs leading-relaxed">
				{count < 2
					? "Pon al menos dos fotos en la hoja para acomodarlas."
					: usesSelection
						? `Acomoda las ${count} fotos seleccionadas dentro del margen, sin tapar los textos. Puedes deshacerlo.`
						: `Acomoda las ${count} fotos de la hoja dentro del margen, sin tapar los textos. Puedes deshacerlo.`}
			</p>
			{TEMPLATES.map((t) => (
				<button
					key={t.layout}
					type="button"
					disabled={count < 2}
					onClick={() => onApply(t.layout)}
					className="border-df-hairline dark:border-df-hairline-dark hover:border-df-primary/50 dark:hover:border-df-primary-dark/50 focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg viewBox="0 0 40 40" className="h-12 w-12 shrink-0" aria-hidden="true">
						<rect width="40" height="40" rx="4" className="fill-df-well dark:fill-df-well-dark" />
						{t.cells.map(([x, y, w, h], i) => (
							<rect
								key={i}
								x={x}
								y={y}
								width={w}
								height={h}
								rx="1.5"
								className={
									i === 0
										? "fill-df-primary/70 dark:fill-df-primary-dark/70"
										: "fill-df-primary/35 dark:fill-df-primary-dark/35"
								}
							/>
						))}
					</svg>
					<span>
						<span className="text-df-ink dark:text-df-ink-dark block text-sm font-semibold">
							{t.label}
						</span>
						<span className="text-df-muted dark:text-df-muted-dark block text-xs">{t.hint}</span>
					</span>
				</button>
			))}
		</div>
	);
}
