import { useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { activeCanvasConfigStore, activeCanvasItemsStore } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import type { ExportMode } from "../types";
import {
	buildDirectPrintHtml,
	buildTiledPrintHtml,
	createDirectPrintIframe,
	createTiledPrintIframe,
} from "../utils/printHelpers";
import { usePosterPrintConfig } from "../hooks/usePosterPrintConfig";
import { useWallPreviewCapture } from "../hooks/useWallPreviewCapture";
import { usePrintModal } from "../hooks/usePrintModal";
import { useToast } from "../../../shared/hooks/useToast";
import { useContainerScale } from "../../../shared/hooks/useContainerScale";
import { Toast } from "../../../shared/components/Toast";
import { ExportCanvasPreview } from "./ExportCanvasPreview";
import { ExportPrintOptions } from "./ExportPrintOptions";
import { ExportDownloadOptions } from "./ExportDownloadOptions";
import { PrintPreviewModal } from "./PrintPreviewModal";

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
	const { toastMessage, showToast } = useToast();
	const printModal = usePrintModal();
	const printIframeRef = useRef<HTMLIFrameElement>(null);

	// Konva stage ref for PNG export
	const stageRef = useRef<any>(null);

	const showPosterPreview = exportMode === "poster" && !!transposePrintConfig;
	const wallPreviewSrc = useWallPreviewCapture({
		stageRef,
		enabled: showPosterPreview,
		printConfig: transposePrintConfig,
		scaleFactor,
		items,
	});

	const handleModalPrint = async () => {
		const started =
			exportMode === "poster" && transposePrintConfig
				? createTiledPrintIframe(config, items, transposePrintConfig)
				: exportMode === "fit-page"
					? createDirectPrintIframe(config, items, {
							mode: "fitToPaper",
							paperWidthMm: selectedPaper.widthMm,
							paperHeightMm: selectedPaper.heightMm,
						})
					: false;

		if (started) return;

		const win = printIframeRef.current?.contentWindow as any;
		if (!win) {
			showToast("No se pudo iniciar la impresión.");
			return;
		}
		try {
			if (typeof win.__waitForAssets === "function") {
				await win.__waitForAssets();
			}
			win.focus?.();
			win.print?.();
		} catch (err: any) {
			showToast("No se pudo iniciar la impresión: " + (err?.message || "Error"));
		}
	};

	const handlePrintPreview = () => {
		if (exportMode === "poster" && transposePrintConfig) {
			printModal.open(
				buildTiledPrintHtml(config, items, transposePrintConfig, {
					autoPrint: false,
					closeAfterPrint: false,
				}),
				`Imprimir (${transposePrintConfig.tiles.length} hojas)`,
			);
			return;
		}
		if (exportMode === "fit-page") {
			printModal.open(
				buildDirectPrintHtml(config, items, {
					mode: "fitToPaper",
					paperWidthMm: selectedPaper.widthMm,
					paperHeightMm: selectedPaper.heightMm,
					autoPrint: false,
					closeAfterPrint: false,
				}),
				`Imprimir (ajustado a ${selectedPaper.label})`,
			);
			return;
		}
	};

	const [exportDpi, setExportDpi] = useState<150 | 300>(150);
	const getExportPixelRatio = () => exportDpi / 96;

	const downloadDataUrl = (dataURL: string, filename: string) => {
		const link = document.createElement("a");
		link.download = filename;
		link.href = dataURL;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleDownloadPng = () => {
		if (stageRef.current) {
			// Unscale it back to original resolution for export
			const originalScale = stageRef.current.scale();
			stageRef.current.scale({ x: 1, y: 1 });
			stageRef.current.width(logicalWidth);
			stageRef.current.height(logicalHeight);

			const dataURL = stageRef.current.toDataURL({
				pixelRatio: getExportPixelRatio(),
			});

			// Restore scale
			stageRef.current.scale(originalScale);
			stageRef.current.width(logicalWidth * scaleFactor);
			stageRef.current.height(logicalHeight * scaleFactor);

			downloadDataUrl(dataURL, `${config.name || "vision-board"}.png`);
			showToast("PNG descargado.");
		}
	};

	const handleDownloadJpg = () => {
		if (stageRef.current) {
			const originalScale = stageRef.current.scale();
			stageRef.current.scale({ x: 1, y: 1 });
			stageRef.current.width(logicalWidth);
			stageRef.current.height(logicalHeight);

			const dataURL = stageRef.current.toDataURL({
				pixelRatio: getExportPixelRatio(),
				mimeType: "image/jpeg",
				quality: 0.92,
			});

			stageRef.current.scale(originalScale);
			stageRef.current.width(logicalWidth * scaleFactor);
			stageRef.current.height(logicalHeight * scaleFactor);

			downloadDataUrl(dataURL, `${config.name || "vision-board"}.jpg`);
			showToast("JPG descargado.");
		}
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
						onDownloadPng={handleDownloadPng}
						onDownloadJpg={handleDownloadJpg}
					/>
				</div>
			</aside>

			<Toast message={toastMessage} />

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
