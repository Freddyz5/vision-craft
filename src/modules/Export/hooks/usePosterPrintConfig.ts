import { useMemo, useState } from "react";
import type { CanvasConfig } from "../../../shared/store/canvasStore";
import type { ExportMode } from "../types";
import { PRINT_PAPERS, buildPrintConfig } from "../types";

export type PaperId = "a4" | "a3" | "us-letter";
export type PaperOrientation = "portrait" | "landscape";

/**
 * Derives the paper/poster print configuration (selected paper, poster grid
 * cols/rows, PrintConfig, fit-page auto-scale) from the active canvas size.
 * Poster cols/rows reset to their canvas-derived defaults whenever the paper
 * or canvas size changes (adjusted during render, React's recommended
 * pattern, to avoid a synchronous setState inside a useEffect body).
 */
export function usePosterPrintConfig(config: CanvasConfig, exportMode: ExportMode) {
	const [paperId, setPaperId] = useState<PaperId>("a4");
	const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>("portrait");

	const selectedPaper = useMemo(() => {
		const preset = PRINT_PAPERS.find((p) => p.id === paperId) ?? PRINT_PAPERS[0];
		if (paperOrientation === "landscape") {
			return { ...preset, widthMm: preset.heightMm, heightMm: preset.widthMm };
		}
		return preset;
	}, [paperId, paperOrientation]);

	const defaultPosterCols = useMemo(
		() => Math.max(1, Math.ceil(config.widthMm / selectedPaper.widthMm)),
		[config.widthMm, selectedPaper.widthMm],
	);
	const defaultPosterRows = useMemo(
		() => Math.max(1, Math.ceil(config.heightMm / selectedPaper.heightMm)),
		[config.heightMm, selectedPaper.heightMm],
	);
	const [posterCols, setPosterCols] = useState(defaultPosterCols);
	const [posterRows, setPosterRows] = useState(defaultPosterRows);

	const [prevPosterDefaults, setPrevPosterDefaults] = useState({
		cols: defaultPosterCols,
		rows: defaultPosterRows,
	});
	if (
		prevPosterDefaults.cols !== defaultPosterCols ||
		prevPosterDefaults.rows !== defaultPosterRows
	) {
		setPrevPosterDefaults({ cols: defaultPosterCols, rows: defaultPosterRows });
		setPosterCols(defaultPosterCols);
		setPosterRows(defaultPosterRows);
	}

	const transposePrintConfig = useMemo(() => {
		if (exportMode !== "poster") return null;
		return buildPrintConfig(config.widthMm, config.heightMm, paperId, {
			orientation: paperOrientation,
			cols: posterCols,
			rows: posterRows,
		});
	}, [
		exportMode,
		config.widthMm,
		config.heightMm,
		paperId,
		paperOrientation,
		posterCols,
		posterRows,
	]);

	// Auto-scale (<= 100%) needed to fit the canvas inside the selected paper, used by "fit-page" mode.
	const fitPageScale = useMemo(() => {
		return Math.min(
			selectedPaper.widthMm / config.widthMm,
			selectedPaper.heightMm / config.heightMm,
			1,
		);
	}, [selectedPaper, config.widthMm, config.heightMm]);

	return {
		paperId,
		setPaperId,
		paperOrientation,
		setPaperOrientation,
		selectedPaper,
		posterCols,
		setPosterCols,
		posterRows,
		setPosterRows,
		transposePrintConfig,
		fitPageScale,
	};
}
