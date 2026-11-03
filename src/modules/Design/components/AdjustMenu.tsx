import { FlipHorizontal2, FlipVertical2, SlidersHorizontal } from "lucide-react";
import type { CanvasItem, ImageAdjust } from "../../../shared/store/canvasStore";
import { PanelSlider, ToolPopover } from "./ToolPopover";

// Colour filters, previewed on the photo itself with the CSS equivalent.
const LOOKS = [
	{ id: undefined, label: "Original", css: "none" },
	{ id: "bw", label: "B/N", css: "grayscale(1)" },
	{ id: "sepia", label: "Sepia", css: "sepia(1)" },
] as const;

interface AdjustMenuProps {
	item: CanvasItem;
	onChange: (adjust: ImageAdjust | undefined) => void;
}

/**
 * "Ajustes" for a photo (desktop only, per the editor brief): opacity, flip,
 * a colour look and brightness/contrast/blur. Stored on the item and applied
 * when drawing, so the photo itself never changes.
 */
export function AdjustMenu({ item, onChange }: AdjustMenuProps) {
	const adjust = item.adjust ?? {};
	const set = (patch: Partial<ImageAdjust>) => onChange({ ...adjust, ...patch });

	return (
		<ToolPopover
			label="Ajustes"
			panelLabel="Ajustes de la foto"
			widthClass="w-80"
			icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
		>
			<div className="grid grid-cols-3 gap-2">
				{LOOKS.map((look) => (
					<button
						key={look.label}
						type="button"
						aria-pressed={adjust.filter === look.id}
						onClick={() => set({ filter: look.id })}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex flex-col items-center gap-1 rounded-xl p-1 text-[11px] font-semibold focus-visible:outline-2",
							adjust.filter === look.id
								? "bg-df-primary/10 dark:bg-df-primary-dark/15 text-df-primary dark:text-df-primary-dark"
								: "text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark",
						].join(" ")}
					>
						<img
							src={item.imageSrc}
							alt=""
							className="h-12 w-full rounded-lg object-cover"
							style={{ filter: look.css }}
						/>
						{look.label}
					</button>
				))}
			</div>

			<PanelSlider
				label="Opacidad"
				value={Math.round((adjust.opacity ?? 1) * 100)}
				min={10}
				max={100}
				suffix=" %"
				onChange={(v) => set({ opacity: v / 100 })}
			/>
			<PanelSlider
				label="Brillo"
				value={Math.round((adjust.brightness ?? 0) * 100)}
				min={-50}
				max={50}
				onChange={(v) => set({ brightness: v / 100 })}
			/>
			<PanelSlider
				label="Contraste"
				value={Math.round(adjust.contrast ?? 0)}
				min={-50}
				max={50}
				onChange={(v) => set({ contrast: v })}
			/>
			<PanelSlider
				label="Desenfoque"
				value={Math.round((adjust.blur ?? 0) * 1000)}
				min={0}
				max={20}
				onChange={(v) => set({ blur: v / 1000 })}
			/>

			<div className="flex items-center gap-2">
				{(
					[
						["flipX", "Horizontal", "Voltear en horizontal", FlipHorizontal2],
						["flipY", "Vertical", "Voltear en vertical", FlipVertical2],
					] as const
				).map(([key, text, label, Icon]) => (
					<button
						key={key}
						type="button"
						aria-label={label}
						aria-pressed={!!adjust[key]}
						onClick={() => set({ [key]: !adjust[key] })}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold focus-visible:outline-2",
							adjust[key]
								? "bg-df-primary/10 dark:bg-df-primary-dark/15 text-df-primary dark:text-df-primary-dark"
								: "bg-df-well dark:bg-df-well-dark text-df-ink dark:text-df-ink-dark",
						].join(" ")}
					>
						<Icon className="h-4 w-4" aria-hidden="true" />
						{text}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={() => onChange(undefined)}
				disabled={!item.adjust}
				className="text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark w-full rounded-full py-1.5 text-xs font-semibold disabled:opacity-40"
			>
				Restablecer
			</button>
		</ToolPopover>
	);
}
