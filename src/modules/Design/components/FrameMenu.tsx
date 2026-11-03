import { useId } from "react";
import { Frame } from "lucide-react";
import type { CanvasItem, ImageFrame } from "../../../shared/store/canvasStore";
import { PanelSlider, ToolPopover } from "./ToolPopover";

const BORDER_COLORS = [
	{ value: "#FFFFFF", label: "Blanco" },
	{ value: "#111827", label: "Tinta" },
	{ value: "#7C3AED", label: "Violeta" },
	{ value: "#E7D9C4", label: "Arena" },
];

interface FrameMenuProps {
	item: CanvasItem;
	onChange: (frame: ImageFrame | undefined) => void;
}

/**
 * "Marco" for a photo (desktop only, per the editor brief): a border with
 * its thickness in mm and colour, a polaroid card, and a soft shadow.
 */
export function FrameMenu({ item, onChange }: FrameMenuProps) {
	const frame = item.frame ?? {};
	const set = (patch: Partial<ImageFrame>) => onChange({ ...frame, ...patch });
	const borderColor = frame.borderColor ?? "#FFFFFF";
	const hintId = useId();

	return (
		<ToolPopover
			label="Marco"
			panelLabel="Marco de la foto"
			widthClass="w-72"
			icon={<Frame className="h-4 w-4" aria-hidden="true" />}
		>
			<PanelSlider
				label="Borde"
				value={frame.borderMm ?? 0}
				min={0}
				max={10}
				suffix=" mm"
				onChange={(v) => set({ borderMm: v })}
			/>
			<fieldset className="flex items-center gap-2">
				<legend className="sr-only">Color del borde</legend>
				{BORDER_COLORS.map((c) => (
					<button
						key={c.value}
						type="button"
						aria-label={c.label}
						aria-pressed={borderColor.toUpperCase() === c.value}
						title={c.label}
						onClick={() => set({ borderColor: c.value, borderMm: frame.borderMm || 3 })}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-7 w-7 rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2",
							borderColor.toUpperCase() === c.value
								? "border-df-primary dark:border-df-primary-dark ring-df-primary dark:ring-df-primary-dark ring-2 ring-offset-2"
								: "border-df-hairline dark:border-df-hairline-dark",
						].join(" ")}
						style={{ backgroundColor: c.value }}
					/>
				))}
				<label className="border-df-hairline dark:border-df-hairline-dark has-focus-visible:outline-df-primary dark:has-focus-visible:outline-df-primary-dark relative ml-auto h-7 w-7 cursor-pointer overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2">
					<span className="sr-only">Otro color</span>
					<input
						type="color"
						value={borderColor}
						onChange={(e) => set({ borderColor: e.target.value, borderMm: frame.borderMm || 3 })}
						className="absolute inset-0 cursor-pointer opacity-0"
					/>
				</label>
			</fieldset>

			<div className="space-y-1">
				{(
					[
						["polaroid", "Polaroid", "Tarjeta blanca con espacio abajo"],
						["shadow", "Sombra suave", "Despega la foto de la hoja"],
					] as const
				).map(([key, label, hint]) => (
					<div
						key={key}
						className="hover:bg-df-well dark:hover:bg-df-well-dark rounded-xl px-2 py-1.5"
					>
						<label className="text-df-ink dark:text-df-ink-dark flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold">
							{label}
							<input
								type="checkbox"
								checked={!!frame[key]}
								onChange={(e) => set({ [key]: e.target.checked })}
								aria-describedby={`${hintId}-${key}`}
								className="accent-df-primary dark:accent-df-primary-dark h-4 w-4"
							/>
						</label>
						<p id={`${hintId}-${key}`} className="text-df-muted dark:text-df-muted-dark text-xs">
							{hint}
						</p>
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={() => onChange(undefined)}
				disabled={!item.frame}
				className="text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark w-full rounded-full py-1.5 text-xs font-semibold disabled:opacity-40"
			>
				Quitar marco
			</button>
		</ToolPopover>
	);
}
