import type { CanvasPreset } from "../constants/presets";

export const PresetCard = ({
	preset,
	isSelected,
	onSelect,
}: {
	preset: CanvasPreset;
	isSelected: boolean;
	onSelect: (id: string) => void;
}) => {
	// Derive aspect ratio for the visual preview rectangle
	const maxSide = 36; // px inside the card icon area
	const ratio = preset.widthMm / preset.heightMm;
	const isWider = ratio >= 1;
	const rectW = isWider ? maxSide : Math.round(maxSide * ratio);
	const rectH = isWider ? Math.round(maxSide / ratio) : maxSide;

	return (
		<button
			type="button"
			id={`preset-${preset.id}`}
			aria-pressed={isSelected}
			onClick={() => onSelect(preset.id)}
			className={[
				"relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200 outline-none",
				isSelected
					? "border-df-primary dark:border-df-primary-dark bg-df-primary/5 dark:bg-df-primary-dark/10 shadow-df-primary/10 dark:shadow-df-primary-dark/15 -translate-y-0.5 shadow-lg"
					: "bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 border-gray-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700",
			].join(" ")}
		>
			{/* Default badge */}
			{preset.isDefault && (
				<span
					aria-label="Formato por defecto"
					className="bg-df-primary dark:bg-df-primary-dark dark:text-df-on-primary-dark absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] whitespace-nowrap text-white uppercase shadow-sm"
				>
					Defecto
				</span>
			)}

			{/* Proportional shape preview */}
			<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
				{preset.id === "custom" ? (
					// Custom icon: dashed square with +
					<svg
						width={maxSide}
						height={maxSide}
						viewBox={`0 0 ${maxSide} ${maxSide}`}
						fill="none"
						aria-hidden="true"
					>
						<rect
							x="1"
							y="1"
							width={maxSide - 2}
							height={maxSide - 2}
							rx="3"
							strokeDasharray="4 3"
							className={
								isSelected
									? "stroke-df-primary dark:stroke-df-primary-dark"
									: "stroke-gray-400 dark:stroke-gray-500"
							}
							strokeWidth="1.5"
						/>
						<line
							x1={maxSide / 2}
							y1={maxSide / 2 - 7}
							x2={maxSide / 2}
							y2={maxSide / 2 + 7}
							className={
								isSelected
									? "stroke-df-primary dark:stroke-df-primary-dark"
									: "stroke-gray-400 dark:stroke-gray-500"
							}
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
						<line
							x1={maxSide / 2 - 7}
							y1={maxSide / 2}
							x2={maxSide / 2 + 7}
							y2={maxSide / 2}
							className={
								isSelected
									? "stroke-df-primary dark:stroke-df-primary-dark"
									: "stroke-gray-400 dark:stroke-gray-500"
							}
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
				) : (
					// Proportional rectangle
					<div
						style={{ width: rectW, height: rectH }}
						className={[
							"rounded-sm border-2 transition-colors duration-200",
							isSelected
								? "border-df-primary dark:border-df-primary-dark bg-df-primary/10 dark:bg-df-primary-dark/20"
								: "border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700",
						].join(" ")}
						aria-hidden="true"
					/>
				)}
			</div>

			{/* Label */}
			<div className="text-center">
				<p
					className={[
						"text-xs leading-tight font-semibold",
						isSelected
							? "text-df-primary dark:text-df-primary-dark"
							: "text-df-ink dark:text-df-ink-dark",
					].join(" ")}
				>
					{preset.label}
				</p>
				{preset.id !== "custom" && (
					<p className="text-df-muted dark:text-df-muted-dark mt-0.5 text-[10px]">
						{preset.description}
					</p>
				)}
			</div>
		</button>
	);
};

export default PresetCard;
