import { Circle, Heart, Shapes, Square, SquareRoundCorner } from "lucide-react";
import type { ImageShape } from "../../../shared/store/canvasStore";
import { PanelSlider, ToolPopover } from "./ToolPopover";

const DEFAULT_RADIUS = 0.15;

const OPTIONS = [
	{ id: "rect", label: "Rectángulo", Icon: Square },
	{ id: "rounded", label: "Redondeada", Icon: SquareRoundCorner },
	{ id: "circle", label: "Círculo", Icon: Circle },
	{ id: "heart", label: "Corazón", Icon: Heart },
] as const;

interface ShapeMenuProps {
	shape: ImageShape | undefined;
	onChange: (shape: ImageShape | undefined) => void;
	/** Docked (mobile): the panel opens fixed above the bottom bar. */
	docked: boolean;
	/** Desktop: the name beside the icon. */
	showLabel?: boolean;
}

/** "Forma" in a photo's toolbar: the mask the photo is cut to, plus the corner radius. */
export function ShapeMenu({ shape, onChange, docked, showLabel }: ShapeMenuProps) {
	const current = shape?.kind ?? "rect";

	const pick = (id: (typeof OPTIONS)[number]["id"]) => {
		if (id === "rect") onChange(undefined);
		else if (id === "rounded")
			onChange({
				kind: "rounded",
				radius: shape?.kind === "rounded" ? shape.radius : DEFAULT_RADIUS,
			});
		else onChange({ kind: id });
	};

	return (
		<ToolPopover
			label="Forma"
			panelLabel="Forma de la foto"
			docked={docked}
			showLabel={showLabel}
			widthClass="w-80"
			icon={<Shapes className="h-4 w-4" aria-hidden="true" />}
		>
			<div className="grid grid-cols-4 gap-1">
				{OPTIONS.map(({ id, label, Icon }) => (
					<button
						key={id}
						type="button"
						aria-pressed={current === id}
						onClick={() => pick(id)}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-semibold transition-colors focus-visible:outline-2",
							current === id
								? "bg-df-primary/10 dark:bg-df-primary-dark/10 text-df-primary dark:text-df-primary-dark"
								: "text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark",
						].join(" ")}
					>
						<Icon className="h-5 w-5" aria-hidden="true" />
						{label}
					</button>
				))}
			</div>

			{shape?.kind === "rounded" && (
				<PanelSlider
					label="Esquinas"
					value={Math.round(shape.radius * 100)}
					min={2}
					max={50}
					suffix=" %"
					onChange={(v) => onChange({ kind: "rounded", radius: v / 100 })}
				/>
			)}
		</ToolPopover>
	);
}
