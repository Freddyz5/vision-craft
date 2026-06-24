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
					className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2
            ${
							value === mode
								? "bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20"
								: "border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm"
						}
            `}>
					<div>
						<span className="font-semibold text-sm block">{title}</span>
						<span className="text-xs opacity-70">{description}</span>
					</div>
					<input
						type="radio"
						name="export-mode"
						className={`radio radio-sm
              ${
								value === mode
									? "bg-df-primary dark:bg-df-primary-dark"
									: "bg-gray-200 dark:bg-gray-700"
							}
            `}
						checked={value === mode}
						onChange={() => onChange(mode)}
					/>
				</label>
			))}
		</>
	);
}
