import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText } from "react-konva";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	exportJson,
	importJson,
	saveCurrentCanvas,
} from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import type { ExportMode } from "../types";
import { PRINT_PAPERS, buildPrintConfig } from "../types";
import {
	buildDirectPrintHtml,
	buildTiledPrintHtml,
	createDirectPrintIframe,
	createTiledPrintIframe,
} from "../utils/printHelpers";
import { TileGridOverlay } from "./TileGridOverlay";
import { WallSizePreview } from "./WallSizePreview";
import ExportOptionsButton from "./ExportOptionsButton";
import ExportModeSelector from "./ExportModeSelector";
import {
	Printer,
	Image as ImageIcon,
	FileJson,
	Save,
	Upload,
	X,
	CircleCheck,
	Layers,
	Gauge,
} from "lucide-react";

function StaticImage({ src, x, y, width, height, rotation, scaleFactor }: any) {
	const [image, setImage] = useState<HTMLImageElement | undefined>();
	useEffect(() => {
		const img = new window.Image();
		img.crossOrigin = "Anonymous";
		img.src = src;
		img.onload = () => setImage(img);
	}, [src]);
	return (
		<KonvaImage
			image={image}
			x={x * scaleFactor}
			y={y * scaleFactor}
			width={width * scaleFactor}
			height={height * scaleFactor}
			rotation={rotation}
		/>
	);
}

function StaticText({
	text,
	x,
	y,
	width,
	height,
	rotation,
	scaleFactor,
	fontSize,
	fillColor,
	fontFamily,
	fontStyle,
}: any) {
	return (
		<KonvaText
			text={text || ""}
			x={x * scaleFactor}
			y={y * scaleFactor}
			width={width * scaleFactor}
			height={height * scaleFactor}
			rotation={rotation}
			fontSize={(fontSize || 24) * scaleFactor}
			fill={fillColor || "#111827"}
			fontFamily={fontFamily || "Inter"}
			fontStyle={fontStyle || "normal"}
		/>
	);
}

export default function ExportPanel() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);

	// Canvas dimensions for preview
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	// Export mode: which of the 4 mutually-exclusive export tracks is active.
	const [exportMode, setExportMode] = useState<ExportMode>("fit-page");
	const [paperId, setPaperId] = useState<"a4" | "a3" | "us-letter">("a4");
	const [paperOrientation, setPaperOrientation] = useState<"portrait" | "landscape">("portrait");
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

	// Re-sincroniza columnas/filas cuando cambia el papel o el tamaño del lienzo.
	// Ajustado durante el render (patrón recomendado por React) en vez de en un
	// useEffect, para evitar el setState síncrono dentro de un efecto.
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

	// Auto-scale (≤ 100%) needed to fit the canvas inside the selected paper, used by "fit-page" mode.
	const fitPageScale = useMemo(() => {
		return Math.min(
			selectedPaper.widthMm / config.widthMm,
			selectedPaper.heightMm / config.heightMm,
			1,
		);
	}, [selectedPaper, config.widthMm, config.heightMm]);

	// Canvas scaling state
	const containerRef = useRef<HTMLDivElement>(null);
	const [scaleFactor, setScaleFactor] = useState(1);
	const [mounted] = useState(true);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [printModalOpen, setPrintModalOpen] = useState(false);
	const [printModalHtml, setPrintModalHtml] = useState<string | null>(null);
	const [printModalLoaded, setPrintModalLoaded] = useState(false);
	const [printModalTitle, setPrintModalTitle] = useState("Imprimir / Guardar PDF");
	const printIframeRef = useRef<HTMLIFrameElement>(null);

	// Konva stage ref for PNG export
	const stageRef = useRef<any>(null);
	const [wallPreviewSrc, setWallPreviewSrc] = useState<string | null>(null);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Calculate scale factor for canvas preview
	useEffect(() => {
		const resize = () => {
			if (!containerRef.current) return;
			const width = containerRef.current.clientWidth;
			const height = containerRef.current.clientHeight;
			// Provide some padding
			const padding = 32;
			const availableWidth = width - padding * 2;
			const availableHeight = height - padding * 2;

			const scaleX = availableWidth / logicalWidth;
			const scaleY = availableHeight / logicalHeight;
			// Max scale 1 so we don't blow it up
			setScaleFactor(Math.max(0.01, Math.min(scaleX, scaleY, 1)));
		};

		let ro: ResizeObserver | null = null;
		if (containerRef.current && "ResizeObserver" in window) {
			ro = new ResizeObserver(() => resize());
			ro.observe(containerRef.current);
		}

		requestAnimationFrame(resize);
		window.addEventListener("resize", resize);
		return () => {
			window.removeEventListener("resize", resize);
			if (ro) ro.disconnect();
		};
	}, [logicalWidth, logicalHeight]);

	// Se muestra la vista previa del póster solo en modo "poster" con config válida.
	const showPosterPreview = mounted && exportMode === "poster" && !!transposePrintConfig;

	// Si dejamos de cumplir la condición de arriba, limpiamos la preview anterior.
	// Ajustado durante el render en vez de al inicio del efecto de abajo, para
	// evitar el setState síncrono dentro del cuerpo del efecto.
	const [prevShowPosterPreview, setPrevShowPosterPreview] = useState(showPosterPreview);
	if (showPosterPreview !== prevShowPosterPreview) {
		setPrevShowPosterPreview(showPosterPreview);
		if (!showPosterPreview) {
			setWallPreviewSrc(null);
		}
	}

	useEffect(() => {
		if (!showPosterPreview || !transposePrintConfig) return;

		let cancelled = false;
		const capturePreview = () => {
			const stage = stageRef.current;
			if (!stage) return;

			const overlayNodes = stage.find(".poster-grid-overlay");
			const previewScale = scaleFactor;
			const posterX = transposePrintConfig.startXMm * MM_TO_PX * previewScale;
			const posterY = transposePrintConfig.startYMm * MM_TO_PX * previewScale;
			const posterWidth =
				transposePrintConfig.pageViewportWidthMm *
				transposePrintConfig.cols *
				MM_TO_PX *
				previewScale;
			const posterHeight =
				transposePrintConfig.pageViewportHeightMm *
				transposePrintConfig.rows *
				MM_TO_PX *
				previewScale;

			try {
				overlayNodes.forEach((node: any) => node.visible(false));
				stage.batchDraw();

				const dataURL = stage.toDataURL({
					x: posterX,
					y: posterY,
					width: posterWidth,
					height: posterHeight,
					pixelRatio: Math.max(1, 1 / Math.max(previewScale, 0.01)),
				});
				if (!cancelled) {
					setWallPreviewSrc(dataURL);
				}
			} catch {
				if (!cancelled) {
					setWallPreviewSrc(null);
				}
			} finally {
				overlayNodes.forEach((node: any) => node.visible(true));
				stage.batchDraw();
			}
		};

		const frameId = requestAnimationFrame(capturePreview);
		const timeoutId = window.setTimeout(capturePreview, 500);

		return () => {
			cancelled = true;
			window.cancelAnimationFrame(frameId);
			window.clearTimeout(timeoutId);
		};
	}, [showPosterPreview, transposePrintConfig, scaleFactor, items]);

	const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

	const openPrintModal = (html: string, title?: string) => {
		setPrintModalTitle(title ?? "Imprimir / Guardar PDF");
		setPrintModalHtml(html);
		setPrintModalLoaded(false);
		setPrintModalOpen(true);
	};

	const closePrintModal = () => {
		setPrintModalOpen(false);
		setPrintModalHtml(null);
		setPrintModalLoaded(false);
	};

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
			openPrintModal(
				buildTiledPrintHtml(config, items, transposePrintConfig, {
					autoPrint: false,
					closeAfterPrint: false,
				}),
				`Imprimir (${transposePrintConfig.tiles.length} hojas)`,
			);
			return;
		}
		if (exportMode === "fit-page") {
			openPrintModal(
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

	const handleExportJson = () => {
		const currentCanvas = {
			id: crypto.randomUUID(),
			name: config.name || "Exported Canvas",
			createdAt: new Date().toISOString(),
			config,
			items,
		};
		exportJson(currentCanvas as any);
		showToast("Exportación JSON iniciada.");
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

	const handleSaveToBrowser = () => {
		let thumbnail: string | undefined;
		if (stageRef.current) {
			thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.5 });
		}
		saveCurrentCanvas(thumbnail);
		showToast("Guardado correctamente en Mis Lienzos.");
	};

	const fileInputRef = useRef<HTMLInputElement>(null);
	const handleImportClick = () => {
		fileInputRef.current?.click();
	};
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			await importJson(file);
			showToast("Lienzo importado exitosamente.");
			window.location.href = "/design";
		} catch (err: any) {
			showToast("Error importando: " + err.message);
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<section className="flex flex-1 items-start gap-8 px-8 pb-10">
			{/* Left Area - Canvas Preview */}
			<div className="min-w-0 flex-1 space-y-8">
				<header>
					<p className="text-primary mb-2 text-xs font-bold tracking-[0.2em] uppercase">
						Vista Previa
					</p>
					<h2 className="text-4xl font-extrabold">{config.name || "Untitled Vision"}</h2>
				</header>

				<div
					className="bg-base-200/40 dark:bg-base-300/10 border-base-300 relative flex h-[calc(100vh-20rem)] min-h-[520px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-4 shadow-inner dark:border-gray-800"
					ref={containerRef}
				>
					{exportMode === "poster" && transposePrintConfig && (
						<div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm dark:bg-black/80">
							<Layers className="h-3.5 w-3.5" aria-hidden="true" />
							{transposePrintConfig.tiles.length} hojas · {selectedPaper.label}{" "}
							{paperOrientation === "landscape" ? "Horizontal" : "Vertical"}
						</div>
					)}
					{mounted && (
						<div className="border-base-300 overflow-hidden rounded-sm border bg-white shadow-2xl transition-all duration-300">
							<Stage
								width={logicalWidth * scaleFactor}
								height={logicalHeight * scaleFactor}
								ref={stageRef}
							>
								<Layer>
									<Rect
										width={logicalWidth * scaleFactor}
										height={logicalHeight * scaleFactor}
										fill="white"
									/>
									{sortedItems.map((item) => {
										if (item.type === "text" || (!!item.text && !item.imageSrc)) {
											return (
												<StaticText
													key={item.id}
													text={item.text}
													x={item.x}
													y={item.y}
													width={item.width}
													height={item.height}
													rotation={item.rotation}
													scaleFactor={scaleFactor}
													fontSize={item.fontSize}
													fillColor={item.fillColor}
													fontFamily={item.fontFamily}
													fontStyle={item.fontStyle}
												/>
											);
										}
										if (!item.imageSrc) return null;
										return (
											<StaticImage
												key={item.id}
												src={item.imageSrc}
												x={item.x}
												y={item.y}
												width={item.width}
												height={item.height}
												rotation={item.rotation}
												scaleFactor={scaleFactor}
											/>
										);
									})}
									{exportMode === "poster" && transposePrintConfig && (
										<TileGridOverlay
											printConfig={transposePrintConfig}
											pxPerMm={MM_TO_PX * scaleFactor}
											boundsWidthPx={logicalWidth * scaleFactor}
											boundsHeightPx={logicalHeight * scaleFactor}
										/>
									)}
								</Layer>
							</Stage>
						</div>
					)}
				</div>

				<div className="text-base-content/60 mt-6 flex items-center gap-6 text-sm font-semibold">
					<div className="flex items-center gap-2">
						<ImageIcon className="h-4 w-4" aria-hidden="true" />
						{config.orientation === "landscape"
							? `${config.widthMm} × ${config.heightMm} mm`
							: `${config.widthMm} × ${config.heightMm} mm`}
					</div>
					{exportMode === "poster" && transposePrintConfig && (
						<div className="flex items-center gap-2">
							<Layers className="h-4 w-4" aria-hidden="true" />
							{transposePrintConfig.cols} x {transposePrintConfig.rows} hojas ({selectedPaper.label}
							)
						</div>
					)}
					<div className="flex items-center gap-2">
						<Gauge className="h-4 w-4" aria-hidden="true" />
						{exportDpi} DPI export
					</div>
				</div>

				{exportMode === "poster" && transposePrintConfig && (
					<div className="border-base-300 bg-base-200/40 dark:bg-base-300/10 rounded-2xl border p-5 dark:border-gray-800">
						<p className="text-df-muted dark:text-df-muted-dark mb-3 text-center text-[9px] font-bold tracking-[0.22em] uppercase">
							Tamaño final en la pared
						</p>
						<WallSizePreview
							posterWidthMm={transposePrintConfig.posterWidthMm}
							posterHeightMm={transposePrintConfig.posterHeightMm}
							previewSrc={wallPreviewSrc}
							cols={transposePrintConfig.cols}
							rows={transposePrintConfig.rows}
						/>
					</div>
				)}
			</div>

			{/* Right Area - Sidebar */}
			<aside className="bg-base-100/80 dark:bg-df-surface-dark/70 border-df-primary/30 sticky top-24 -mt-65 h-[calc(100vh-8rem)] w-96 shrink-0 space-y-4 overflow-y-scroll rounded-3xl border-2 p-5 backdrop-blur-sm">
				<div className="space-y-10">
					{/* Export Mode Selector */}
					<article className="flex flex-col gap-4">
						<p className="text-df-muted dark:text-df-muted-dark text-center text-[9px] font-bold tracking-[0.22em] uppercase">
							Cómo quieres exportar
						</p>

						<ExportModeSelector value={exportMode} onChange={setExportMode} />

						{(exportMode === "poster" || exportMode === "fit-page") && (
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
										onChange={(e) => setPaperId(e.target.value as any)}
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
												onClick={() => setPaperOrientation(opt.value)}
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
												<span className="text-[10px] font-bold tracking-widest uppercase">
													Columnas
												</span>
												<input
													type="number"
													min="1"
													max="12"
													step="1"
													value={posterCols}
													onChange={(e) =>
														setPosterCols(Math.max(1, parseInt(e.target.value || "1", 10)))
													}
													className="input input-sm input-bordered bg-base-100 dark:bg-df-bg-dark"
												/>
											</label>

											<label className="flex flex-col gap-1">
												<span className="text-[10px] font-bold tracking-widest uppercase">
													Filas
												</span>
												<input
													type="number"
													min="1"
													max="12"
													step="1"
													value={posterRows}
													onChange={(e) =>
														setPosterRows(Math.max(1, parseInt(e.target.value || "1", 10)))
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

						{(exportMode === "poster" || exportMode === "fit-page") && (
							<button
								onClick={handlePrintPreview}
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

					{/* Export Options */}
					<article className="flex flex-col gap-2">
						<p className="text-df-muted dark:text-df-muted-dark pb-2 text-center text-[9px] font-bold tracking-[0.22em] uppercase">
							Opciones de exportación
						</p>

						{exportMode === "image" && (
							<>
								<div className="bg-df-surface dark:bg-df-surface-dark rounded-2xl border-2 border-gray-200 p-4 dark:border-gray-700">
									<div className="flex items-center justify-between">
										<span className="text-df-ink dark:text-df-ink-dark text-xs font-semibold">
											DPI de exportación
										</span>
										<select
											className="select select-bordered select-sm bg-base-100 dark:bg-df-bg-dark"
											value={exportDpi}
											onChange={(e) => setExportDpi(parseInt(e.target.value) as any)}
										>
											<option value={150}>150</option>
											<option value={300}>300</option>
										</select>
									</div>
								</div>

								<ExportOptionsButton
									name="Descargar como PNG"
									description="Imagen sin pérdida"
									icon={<ImageIcon className="h-5 w-5 text-[#20d4a4]" aria-hidden="true" />}
									onClick={handleDownloadPng}
								/>

								<ExportOptionsButton
									name="Descargar como JPG"
									description="Más liviano para compartir"
									icon={<ImageIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />}
									onClick={handleDownloadJpg}
								/>
							</>
						)}

						{exportMode === "data" && (
							<>
								<ExportOptionsButton
									name="Guardar en el Navegador"
									description="Almacenamiento Local"
									icon={<Save className="h-5 w-5 text-blue-600" aria-hidden="true" />}
									onClick={handleSaveToBrowser}
								/>

								<div className="flex gap-2">
									<ExportOptionsButton
										name="Exportar como JSON"
										description="Metadatos sin procesar"
										icon={<FileJson className="h-5 w-5 text-gray-400" aria-hidden="true" />}
										onClick={handleExportJson}
									/>
									<button
										title="Importar JSON"
										className="bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 flex w-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700"
										onClick={handleImportClick}
									>
										<Upload
											className="h-5 w-5 text-purple-600 dark:text-purple-400"
											aria-hidden="true"
										/>
									</button>
								</div>

								<input
									type="file"
									accept="application/json"
									ref={fileInputRef}
									onChange={handleFileChange}
									className="hidden"
								/>
							</>
						)}
					</article>
				</div>
			</aside>

			{toastMessage && (
				<div className="toast toast-end toast-bottom z-50">
					<div className="alert alert-success flex items-center gap-2 font-semibold text-white shadow-lg">
						<CircleCheck className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
						<span>{toastMessage}</span>
					</div>
				</div>
			)}

			{printModalOpen && (
				<div className="bg-df-bg/80 dark:bg-df-bg-dark/80 fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
					<div className="bg-df-surface dark:bg-df-surface-dark border-df-border dark:border-df-border-dark flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
						<div className="border-df-border dark:border-df-border-dark flex shrink-0 items-center justify-between border-b p-6">
							<div className="min-w-0">
								<h2 className="text-df-ink dark:text-df-ink-dark truncate text-xl font-bold">
									{printModalTitle}
								</h2>
								<p className="text-df-muted dark:text-df-muted-dark mt-1 text-sm">
									Revisa la vista previa y luego imprime o guarda como PDF.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={handleModalPrint}
									disabled={!printModalLoaded}
									className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark rounded-full bg-gradient-to-r px-4 py-2 font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Imprimir / Guardar PDF
								</button>
								<button
									onClick={closePrintModal}
									className="bg-df-surface-alt dark:bg-df-surface-alt-dark hover:bg-df-border dark:hover:bg-df-border-dark text-df-ink dark:text-df-ink-dark rounded-full p-2.5 transition-colors"
									aria-label="Cerrar modal"
								>
									<X className="h-5 w-5" strokeWidth={2.5} />
								</button>
							</div>
						</div>

						<div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900">
							<div className="relative min-h-0 flex-1">
								{printModalHtml && (
									<iframe
										ref={printIframeRef}
										title="Vista previa de impresión"
										className="h-full w-full"
										srcDoc={printModalHtml}
										onLoad={() => setPrintModalLoaded(true)}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
