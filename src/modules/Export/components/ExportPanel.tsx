import { useRef, useState } from "react";
import type Konva from "konva";
import { useStore } from "@nanostores/react";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	markActiveCanvasExported,
} from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { sheetCount, type ExportMode } from "../types";
import { buildDirectPrintHtml, buildTiledPrintHtml, printHtml } from "../utils/printHelpers";
import { usePosterPrintConfig } from "../hooks/usePosterPrintConfig";
import { useWallPreviewCapture } from "../hooks/useWallPreviewCapture";
import { usePrintModal } from "../hooks/usePrintModal";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { captureStage } from "../../../shared/utils/stageCapture";
import { loadItemFonts } from "../../../shared/utils/fonts";
import { Toast } from "../../../shared/components/Toast";
import { ExportCanvasPreview } from "./ExportCanvasPreview";
import { ExportPrintOptions } from "./ExportPrintOptions";
import { ExportDownloadOptions } from "./ExportDownloadOptions";
import { PrintPreviewModal } from "./PrintPreviewModal";

/**
 * Resolution of printed pages. 250 ppp keeps photos sharp on paper while an
 * A3 page (the largest sheet offered) stays under Safari's ~16.7 MP canvas cap.
 */
const PRINT_DPI = 250;

/** Resolves after the browser has painted, e.g. a toast set just before. */
const nextPaint = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);

export default function ExportPanel() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);

	// Canvas dimensions for preview
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	// Export mode: which of the 4 mutually-exclusive export tracks is active.
	const [exportMode, setExportMode] = useState<ExportMode>("fit-page");

	const {
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
	} = usePosterPrintConfig(config, exportMode);

	// Canvas scaling state
	const containerRef = useRef<HTMLDivElement>(null);
	const scaleFactor = useContainerScale(containerRef, logicalWidth, logicalHeight);
	const { toast, showToast, dismissToast } = useToast();
	const printModal = usePrintModal();
	const printIframeRef = useRef<HTMLIFrameElement>(null);

	// Konva stage ref for PNG export
	const stageRef = useRef<Konva.Stage>(null);

	const showPosterPreview = exportMode === "poster" && !!transposePrintConfig;
	const wallPreviewSrc = useWallPreviewCapture({
		stageRef,
		enabled: showPosterPreview,
		printConfig: transposePrintConfig,
		scaleFactor,
		items,
	});

	// A capture draws text in whatever font is loaded at that moment: wait
	// for the board's fonts, then a paint, so text re-created on their
	// arrival (CanvasItemShape) is the one captured.
	const fontsReady = async () => {
		await loadItemFonts(items);
		await nextPaint();
	};

	// Pages are captured from the preview stage, which draws items with the
	// editor's own renderer, so crops, shapes and effects print as designed.
	const printPagesRef = useRef<string[]>([]);
	const preparingPrintRef = useRef(false);

	/**
	 * Each page blocks the main thread while it's drawn, so the toast says
	 * which one is on and gets a frame to paint before every page.
	 */
	const capturePrintPages = async (): Promise<string[]> => {
		await fontsReady();
		const stage = stageRef.current;
		if (!stage) return [];
		const jpeg = { mimeType: "image/jpeg" as const, quality: 0.95 };
		if (exportMode === "poster" && transposePrintConfig) {
			const pc = transposePrintConfig;
			const pages: string[] = [];
			for (const [i, tile] of pc.tiles.entries()) {
				if (pc.tiles.length > 1) {
					showToast(`Preparando la hoja ${i + 1} de ${pc.tiles.length}…`, {
						tone: "progress",
						durationMs: 60_000,
					});
				}
				await nextPaint();
				pages.push(
					captureStage(stage, {
						...jpeg,
						scaleFactor,
						// Canvas px are printed `canvasScale` times bigger on the tiles.
						pixelRatio: (PRINT_DPI / 96) * pc.canvasScale,
						region: {
							x: tile.offsetXMm * MM_TO_PX,
							y: tile.offsetYMm * MM_TO_PX,
							width: pc.pageViewportWidthMm * MM_TO_PX,
							height: pc.pageViewportHeightMm * MM_TO_PX,
						},
					}),
				);
			}
			return pages;
		}
		await nextPaint();
		// Fit-page prints the canvas at fitPageScale (never enlarged).
		return [
			captureStage(stage, { ...jpeg, scaleFactor, pixelRatio: (PRINT_DPI / 96) * fitPageScale }),
		];
	};

	const buildPrintHtml = (pages: string[], autoPrint: boolean) =>
		exportMode === "poster" && transposePrintConfig
			? buildTiledPrintHtml(pages, transposePrintConfig, { autoPrint, closeAfterPrint: autoPrint })
			: buildDirectPrintHtml(pages[0], config, {
					mode: "fitToPaper",
					paperWidthMm: selectedPaper.widthMm,
					paperHeightMm: selectedPaper.heightMm,
					autoPrint,
					closeAfterPrint: autoPrint,
				});

	const handleModalPrint = async () => {
		if (printHtml(buildPrintHtml(printPagesRef.current, true))) {
			markActiveCanvasExported();
			return;
		}

		const win = printIframeRef.current?.contentWindow as any;
		if (!win) {
			showToast("No se pudo iniciar la impresión.", { tone: "error" });
			return;
		}
		try {
			if (typeof win.__waitForAssets === "function") {
				await win.__waitForAssets();
			}
			win.focus?.();
			win.print?.();
			markActiveCanvasExported();
		} catch (err: any) {
			showToast("No se pudo iniciar la impresión: " + (err?.message || "Error"), { tone: "error" });
		}
	};

	const handlePrintPreview = async () => {
		// A second click while pages are still being drawn would draw them twice.
		if (exportMode === "image" || preparingPrintRef.current) return;
		preparingPrintRef.current = true;
		// Capturing big pages blocks for a moment: say so first.
		showToast("Preparando la impresión…", { tone: "progress", durationMs: 60_000 });
		try {
			printPagesRef.current = await capturePrintPages();
		} catch {
			showToast("No se pudo preparar la impresión.", { tone: "error" });
			return;
		} finally {
			preparingPrintRef.current = false;
		}
		dismissToast();
		printModal.open(
			buildPrintHtml(printPagesRef.current, false),
			exportMode === "poster" && transposePrintConfig
				? `Imprimir (${sheetCount(transposePrintConfig.tiles.length)})`
				: `Imprimir (ajustado a ${selectedPaper.label})`,
		);
	};

	const [exportDpi, setExportDpi] = useState<150 | 300>(150);

	const downloadDataUrl = (dataURL: string, filename: string) => {
		const link = document.createElement("a");
		link.download = filename;
		link.href = dataURL;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Captured from the preview stage at the chosen DPI, independent of how
	// big the preview happens to be drawn on screen.
	const downloadImage = async (mimeType: "image/png" | "image/jpeg", extension: "png" | "jpg") => {
		await fontsReady();
		const stage = stageRef.current;
		if (!stage) return;
		const dataURL = captureStage(stage, {
			scaleFactor,
			pixelRatio: exportDpi / 96,
			mimeType,
			quality: mimeType === "image/jpeg" ? 0.92 : undefined,
		});
		downloadDataUrl(dataURL, `${config.name || "vision-board"}.${extension}`);
		markActiveCanvasExported();
		showToast(`${extension.toUpperCase()} descargado.`);
	};

	return (
		<section className="flex flex-1 flex-col gap-8 px-4 pb-10 sm:px-8 lg:flex-row lg:items-start">
			<ExportCanvasPreview
				config={config}
				items={items}
				logicalWidth={logicalWidth}
				logicalHeight={logicalHeight}
				scaleFactor={scaleFactor}
				exportMode={exportMode}
				exportDpi={exportDpi}
				transposePrintConfig={transposePrintConfig}
				selectedPaper={selectedPaper}
				paperOrientation={paperOrientation}
				wallPreviewSrc={wallPreviewSrc}
				stageRef={stageRef}
				containerRef={containerRef}
			/>

			{/* Right Area - Sidebar */}
			<aside className="bg-df-surface dark:bg-df-surface-dark/70 border-df-primary/30 w-full shrink-0 space-y-4 rounded-3xl border-2 p-5 backdrop-blur-sm lg:sticky lg:top-24 lg:-mt-65 lg:h-[calc(100vh-8rem)] lg:w-96 lg:overflow-y-scroll">
				<div className="space-y-10">
					<ExportPrintOptions
						exportMode={exportMode}
						onExportModeChange={setExportMode}
						paperId={paperId}
						onPaperIdChange={setPaperId}
						paperOrientation={paperOrientation}
						onOrientationChange={setPaperOrientation}
						posterCols={posterCols}
						onPosterColsChange={setPosterCols}
						posterRows={posterRows}
						onPosterRowsChange={setPosterRows}
						transposePrintConfig={transposePrintConfig}
						fitPageScale={fitPageScale}
						selectedPaper={selectedPaper}
						onPrintPreview={handlePrintPreview}
					/>

					<ExportDownloadOptions
						exportMode={exportMode}
						exportDpi={exportDpi}
						onExportDpiChange={setExportDpi}
						onDownloadPng={() => void downloadImage("image/png", "png")}
						onDownloadJpg={() => void downloadImage("image/jpeg", "jpg")}
					/>
				</div>
			</aside>

			<Toast message={toast?.message ?? null} tone={toast?.tone} onDismiss={dismissToast} />

			<PrintPreviewModal
				open={printModal.isOpen}
				title={printModal.title}
				html={printModal.html}
				loaded={printModal.loaded}
				iframeRef={printIframeRef}
				onIframeLoad={() => printModal.setLoaded(true)}
				onPrint={handleModalPrint}
				onClose={printModal.close}
			/>
		</section>
	);
}
