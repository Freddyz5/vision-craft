import type { ExportMode } from "../types";
import { EXPORT_MODE_OPTIONS } from "../types";

interface ExportModeSelectorProps {
	value: ExportMode;
	onChange: (mode: ExportMode) => void;
}

/**
 * 4 mutually-exclusive radio-cards for choosing the active export track
 * (poster / fit-page / image / data). Extracted from ExportPanel so the
 * mode catalogue (EXPORT_MODE_OPTIONS, in types.ts) has a single owner.
 */
export default function ExportModeSelector({ value, onChange }: ExportModeSelectorProps) {
	return (
		<>
			{EXPORT_MODE_OPTIONS.map(({ mode, title, description }) => (
				<label
					key={mode}
					className={`grid flex-1 cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 rounded-xl border-2 p-3 transition-all duration-150 ${
						value === mode
							? "bg-df-primary dark:bg-df-primary-dark shadow-df-primary/25 dark:shadow-df-primary-dark/20 dark:text-df-on-primary-dark border-transparent text-white shadow-md"
							: "text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 border-gray-200 hover:shadow-sm dark:border-gray-700"
					} `}
				>
					<span className="text-sm font-semibold">{title}</span>
					<input
						type="radio"
						name="export-mode"
						className={`radio radio-sm row-span-2 ${
							value === mode
								? "bg-df-primary dark:bg-df-primary-dark"
								: "bg-gray-200 dark:bg-gray-700"
						} `}
						checked={value === mode}
						onChange={() => onChange(mode)}
					/>
					<span className="text-xs opacity-85">{description}</span>
				</label>
			))}
		</>
	);
}
