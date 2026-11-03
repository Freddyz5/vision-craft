import { useEffect, useId, useRef, useState } from "react";
import { Circle, Heart, Shapes, Square, SquareRoundCorner } from "lucide-react";
import type { ImageShape } from "../../../shared/store/canvasStore";

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
}

/** "Forma" in a photo's toolbar: the mask the photo is cut to, plus the corner radius. */
export function ShapeMenu({ shape, onChange, docked }: ShapeMenuProps) {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const current = shape?.kind ?? "rect";

	useEffect(() => {
		if (!open) return;
		const closeOnOutside = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.stopPropagation();
			setOpen(false);
		};
		document.addEventListener("pointerdown", closeOnOutside);
		document.addEventListener("keydown", closeOnEscape, true);
		return () => {
			document.removeEventListener("pointerdown", closeOnOutside);
			document.removeEventListener("keydown", closeOnEscape, true);
		};
	}, [open]);

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
		<div ref={rootRef} className={docked ? "flex shrink-0" : "relative"}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls={panelId}
				aria-label={docked ? undefined : "Forma"}
				title={docked ? undefined : "Forma"}
				className={[
					"text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2",
					docked
						? "min-w-14 flex-col gap-1 rounded-xl px-2 text-[11px] font-semibold"
						: "h-9 w-9 rounded-full",
					open ? "bg-df-well dark:bg-df-well-dark" : "",
				].join(" ")}
			>
				<Shapes className="h-4 w-4" aria-hidden="true" />
				{docked && <span>Forma</span>}
			</button>

			{open && (
				<div
					id={panelId}
					role="group"
					aria-label="Forma de la foto"
					className={[
						"bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark z-40 space-y-3 rounded-2xl border p-3 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]",
						// Fixed on mobile so the bar's horizontal scroll can't clip it.
						docked
							? "fixed inset-x-3 bottom-20"
							: "absolute top-full left-1/2 mt-2 w-80 -translate-x-1/2",
					].join(" ")}
				>
					<div className="grid grid-cols-4 gap-1">
						{OPTIONS.map(({ id, label, Icon }) => (
							<button
								key={id}
								type="button"
								aria-pressed={current === id}
								onClick={() => pick(id)}
								className={[
									"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-2",
									current === id
										? "bg-df-primary/10 dark:bg-df-primary-dark/15 text-df-primary dark:text-df-primary-dark"
										: "text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark",
								].join(" ")}
							>
								<Icon className="h-5 w-5" aria-hidden="true" />
								{label}
							</button>
						))}
					</div>

					{shape?.kind === "rounded" && (
						<label className="text-df-muted dark:text-df-muted-dark flex items-center gap-3 text-xs font-semibold">
							Esquinas
							<input
								type="range"
								min={2}
								max={50}
								value={Math.round(shape.radius * 100)}
								onChange={(e) =>
									onChange({ kind: "rounded", radius: Number(e.target.value) / 100 })
								}
								className="accent-df-primary dark:accent-df-primary-dark flex-1"
							/>
						</label>
					)}
				</div>
			)}
		</div>
	);
}
