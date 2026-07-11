import { Printer } from "lucide-react";
import type { ExportMode, PrintConfig } from "../types";
import { PRINT_PAPERS } from "../types";
import type { PaperId, PaperOrientation } from "../hooks/usePosterPrintConfig";
import ExportModeSelector from "./ExportModeSelector";

interface ExportPrintOptionsProps {
	exportMode: ExportMode;
	onExportModeChange: (mode: ExportMode) => void;
	paperId: PaperId;
	onPaperIdChange: (id: PaperId) => void;
	paperOrientation: PaperOrientation;
	onOrientationChange: (orientation: PaperOrientation) => void;
	posterCols: number;
	onPosterColsChange: (cols: number) => void;
	posterRows: number;
	onPosterRowsChange: (rows: number) => void;
	transposePrintConfig: PrintConfig | null;
	fitPageScale: number;
	selectedPaper: { label: string; widthMm: number; heightMm: number };
	onPrintPreview: () => void;
}

/** "Cómo quieres exportar" sidebar article: mode selector, paper/orientation, poster grid size, and the print CTA. */
export function ExportPrintOptions({
	exportMode,
	onExportModeChange,
	paperId,
	onPaperIdChange,
	paperOrientation,
	onOrientationChange,
	posterCols,
	onPosterColsChange,
	posterRows,
	onPosterRowsChange,
	transposePrintConfig,
	fitPageScale,
	selectedPaper,
	onPrintPreview,
}: ExportPrintOptionsProps) {
	const showPaperControls = exportMode === "poster" || exportMode === "fit-page";

	return (
		<article className="flex flex-col gap-4">
			<p className="text-df-muted dark:text-df-muted-dark text-center text-[9px] font-bold tracking-[0.22em] uppercase">
				Cómo quieres exportar
			</p>

			<ExportModeSelector value={exportMode} onChange={onExportModeChange} />

			{showPaperControls && (
				<div className="bg-df-primary dark:bg-df-primary-dark shadow-df-primary/25 dark:shadow-df-primary-dark/20 space-y-3 rounded-xl border-transparent p-4 text-white shadow-md">
					<div>
						<label
							htmlFor="export-paper-size"
							className="mb-2 block text-[10px] font-bold tracking-widest uppercase"
						>
							PAPEL DE IMPRESORA
						</label>
						<select
							id="export-paper-size"
							className="w-full rounded-xl bg-white p-2 text-black dark:bg-gray-800/50 dark:text-white"
							value={paperId}
							onChange={(e) => onPaperIdChange(e.target.value as PaperId)}
						>
							{PRINT_PAPERS.map((p) => (
								<option key={p.id} value={p.id}>
									{p.label} ({p.widthMm} × {p.heightMm} mm)
								</option>
							))}
						</select>
					</div>

					<fieldset>
						<legend className="mb-2 block text-[10px] font-bold tracking-widest uppercase">
							ORIENTACIÓN
						</legend>
						<div className="grid grid-cols-2 gap-2" role="group">
							{[
								{ value: "portrait" as const, label: "Vertical" },
								{ value: "landscape" as const, label: "Horizontal" },
							].map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => onOrientationChange(opt.value)}
									className={`rounded-lg py-1.5 text-xs font-bold transition-all duration-150 ${
										paperOrientation === opt.value
											? "text-df-primary dark:text-df-primary-dark bg-white shadow-sm"
											: "bg-white/15 text-white hover:bg-white/25"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</fieldset>

					{exportMode === "poster" && (
						<fieldset className="mt-3 space-y-3">
							<legend className="mb-2 block text-[10px] font-bold tracking-widest uppercase">
								Tamaño del póster
							</legend>
							<p className="text-xs leading-relaxed">
								La cuadrícula se ajusta para llenar el lienzo con hojas completas. Si aumentas
								columnas o filas, el póster crece; si las reduces, se recorta más.
							</p>
							<div className="grid grid-cols-2 gap-3">
								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold tracking-widest uppercase">Columnas</span>
									<input
										type="number"
										min="1"
										max="12"
										step="1"
										value={posterCols}
										onChange={(e) =>
											onPosterColsChange(Math.max(1, parseInt(e.target.value || "1", 10)))
										}
										className="input input-sm input-bordered bg-base-100 dark:bg-df-bg-dark"
									/>
								</label>

								<label className="flex flex-col gap-1">
									<span className="text-[10px] font-bold tracking-widest uppercase">Filas</span>
									<input
										type="number"
										min="1"
										max="12"
										step="1"
										value={posterRows}
										onChange={(e) =>
											onPosterRowsChange(Math.max(1, parseInt(e.target.value || "1", 10)))
										}
										className="input input-sm input-bordered bg-base-100 dark:bg-df-bg-dark"
									/>
								</label>
							</div>
							{transposePrintConfig && (
								<div className="bg-base-200/70 dark:bg-base-300/10 space-y-1 rounded-xl px-3 py-2 text-xs">
									<p>
										Poster final: {Math.round(transposePrintConfig.posterWidthMm)} x{" "}
										{Math.round(transposePrintConfig.posterHeightMm)} mm
									</p>
									<p>
										Cobertura visible por hoja:{" "}
										{Math.round(transposePrintConfig.pageViewportWidthMm)} x{" "}
										{Math.round(transposePrintConfig.pageViewportHeightMm)} mm del lienzo
									</p>
								</div>
							)}
						</fieldset>
					)}

					{exportMode === "fit-page" && (
						<p className="text-[11px] opacity-80">
							Escala automática: {Math.round(fitPageScale * 100)}%
						</p>
					)}

					{exportMode === "poster" && transposePrintConfig && (
						<p className="text-[11px] opacity-80">
							{transposePrintConfig.cols} × {transposePrintConfig.rows} hojas ·{" "}
							{transposePrintConfig.tiles.length} total
						</p>
					)}
				</div>
			)}

			{showPaperControls && (
				<button
					onClick={onPrintPreview}
					className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-gradient-to-r px-8 py-2.5 text-base font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
				>
					{exportMode === "poster"
						? transposePrintConfig
							? `Imprimir (${transposePrintConfig.tiles.length} hojas)`
							: "Imprimir (múltiples hojas)"
						: `Imprimir en ${selectedPaper.label}`}
					<Printer className="h-5 w-5" aria-hidden="true" />
				</button>
			)}
		</article>
	);
}
