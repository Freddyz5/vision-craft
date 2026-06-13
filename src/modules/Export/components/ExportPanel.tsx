import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import {
	Stage,
	Layer,
	Rect,
	Image as KonvaImage,
	Text as KonvaText,
	Line,
} from "react-konva";
import {
	activeCanvasConfigStore,
	activeCanvasItemsStore,
	exportJson,
	importJson,
	saveCurrentCanvas,
} from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { PRINT_PAPERS, buildPrintConfig } from "../types";
import {
	buildDirectPrintHtml,
	buildTiledPrintHtml,
} from "../utils/printHelpers";
import { TiledPrintPreview } from "./TiledPrintPreview";
import ExportOptionsButton from "./ExportOptionsButton";

// SVG Icons
const IconPrint = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<polyline points="6 9 6 2 18 2 18 9"></polyline>
		<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
		<rect x="6" y="14" width="12" height="8"></rect>
	</svg>
);
const IconPDF = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
		<polyline points="14 2 14 8 20 8"></polyline>
		<path d="M16 13H8"></path>
		<path d="M16 17H8"></path>
		<polyline points="10 9 9 9 8 9"></polyline>
	</svg>
);
const IconPNG = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
    className="text-[#20d4a4]"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
		<circle cx="8.5" cy="8.5" r="1.5"></circle>
		<polyline points="21 15 16 10 5 21"></polyline>
	</svg>
);
const IconJSON = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
    className="text-gray-400"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<polyline points="16 18 22 12 16 6"></polyline>
		<polyline points="8 6 2 12 8 18"></polyline>
	</svg>
);
const IconSave = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
    className="text-blue-600"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
		<polyline points="17 21 17 13 7 13 7 21"></polyline>
		<polyline points="7 3 7 8 15 8"></polyline>
	</svg>
);

const IconJPG = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		className="text-amber-500"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
		<path d="M7 15h2a2 2 0 0 0 2-2V9"></path>
		<path d="M13 15h2a2 2 0 0 0 2-2V9h-2"></path>
	</svg>
);

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

	// Print / Export strategy
	const [exportStrategy, setExportStrategy] = useState<
		"original" | "transpose"
	>("original");
	const [paperId, setPaperId] = useState<"a4" | "a3" | "us-letter">("a4");
	const selectedPaper = useMemo(
		() => PRINT_PAPERS.find((p) => p.id === paperId) ?? PRINT_PAPERS[0],
		[paperId],
	);

	const transposePrintConfig = useMemo(() => {
		if (exportStrategy !== "transpose") return null;
		return buildPrintConfig(config.widthMm, config.heightMm, paperId);
	}, [exportStrategy, config.widthMm, config.heightMm, paperId]);

	const [transposeScale, setTransposeScale] = useState(1);
	const [transposeShiftX, setTransposeShiftX] = useState(0);
	const [transposeShiftY, setTransposeShiftY] = useState(0);

	// Canvas scaling state
	const containerRef = useRef<HTMLDivElement>(null);
	const [scaleFactor, setScaleFactor] = useState(1);
	const [mounted, setMounted] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [printModalOpen, setPrintModalOpen] = useState(false);
	const [printModalHtml, setPrintModalHtml] = useState<string | null>(null);
	const [printModalLoaded, setPrintModalLoaded] = useState(false);
	const [printModalTitle, setPrintModalTitle] = useState("Imprimir / Guardar PDF");
	const [printModalKind, setPrintModalKind] = useState<"original" | "transpose">(
		"original",
	);
	const printIframeRef = useRef<HTMLIFrameElement>(null);
	const transposePreviewRef = useRef<HTMLDivElement>(null);
	const [transposePreviewFit, setTransposePreviewFit] = useState(1);

	// Konva stage ref for PNG export
	const stageRef = useRef<any>(null);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Calculate scale factor for canvas preview
	useEffect(() => {
		setMounted(true);
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

	const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

	const openPrintModal = (
		html: string,
		title?: string,
		kind?: "original" | "transpose",
	) => {
		setPrintModalTitle(title ?? "Imprimir / Guardar PDF");
		setPrintModalHtml(html);
		setPrintModalLoaded(false);
		setPrintModalKind(kind ?? "original");
		setPrintModalOpen(true);
	};

	const closePrintModal = () => {
		setPrintModalOpen(false);
		setPrintModalHtml(null);
		setPrintModalLoaded(false);
	};

	const handleModalPrint = async () => {
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
		if (exportStrategy === "transpose") {
			const printConfig = buildPrintConfig(
				config.widthMm,
				config.heightMm,
				paperId,
				{
					canvasScale: transposeScale,
					shiftXMm: transposeShiftX,
					shiftYMm: transposeShiftY,
				},
			);
			openPrintModal(
				buildTiledPrintHtml(config, items, printConfig, {
					autoPrint: false,
					closeAfterPrint: false,
				}),
				"Imprimir (múltiples hojas)",
				"transpose",
			);
			return;
		}
		openPrintModal(
			buildDirectPrintHtml(config, items, {
				mode: "trueSize",
				autoPrint: false,
				closeAfterPrint: false,
			}),
			"Imprimir (tamaño original)",
			"original",
		);
	};

	useEffect(() => {
		if (!printModalOpen) return;
		if (printModalKind !== "transpose") return;
		const printConfig = buildPrintConfig(
			config.widthMm,
			config.heightMm,
			paperId,
			{
				canvasScale: transposeScale,
				shiftXMm: transposeShiftX,
				shiftYMm: transposeShiftY,
			},
		);
		setPrintModalHtml(
			buildTiledPrintHtml(config, items, printConfig, {
				autoPrint: false,
				closeAfterPrint: false,
			}),
		);
	}, [
		printModalOpen,
		printModalKind,
		config,
		items,
		paperId,
		transposeScale,
		transposeShiftX,
		transposeShiftY,
	]);

	useEffect(() => {
		if (!printModalOpen) return;
		if (printModalKind !== "transpose") return;
		const el = transposePreviewRef.current;
		if (!el) return;

		const update = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			const pad = 32;
			const docW = logicalWidth * transposeScale;
			const docH = logicalHeight * transposeScale;
			const fit = Math.min(
				1,
				(w - pad * 2) / docW,
				(h - pad * 2) / docH,
			);
			setTransposePreviewFit(Number.isFinite(fit) && fit > 0 ? fit : 1);
		};

		let ro: ResizeObserver | null = null;
		if ("ResizeObserver" in window) {
			ro = new ResizeObserver(() => update());
			ro.observe(el);
		}
		requestAnimationFrame(update);
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("resize", update);
			if (ro) ro.disconnect();
		};
	}, [
		printModalOpen,
		printModalKind,
		logicalWidth,
		logicalHeight,
		transposeScale,
	]);

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

	const handleDownloadPdf = () => {
		handlePrintPreview();
	};

	const handleSaveToBrowser = () => {
		saveCurrentCanvas();
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
		<section className="flex-1 flex gap-8 px-8 pb-10 items-start">
			{/* Left Area - Canvas Preview */}
			<div className="flex-1 min-w-0 space-y-8">
				<header>
					<p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">
						Vista Previa
					</p>
					<h2 className="text-4xl font-extrabold ">
						{config.name || "Untitled Vision"}
					</h2>
				</header>

				<div
					className="flex-1 relative flex items-center justify-center overflow-hidden rounded-xl shadow-inner p-4 min-h-[520px] h-[calc(100vh-20rem)] bg-base-200/40 dark:bg-base-300/10 border border-base-300 dark:border-gray-800"
					ref={containerRef}>
					{mounted && (
						<div
							className="shadow-2xl rounded-sm overflow-hidden bg-white transition-all duration-300 border border-base-300"
						>
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
								</Layer>
							</Stage>
						</div>
					)}
				</div>

				<div className="mt-6 flex items-center gap-6 text-sm font-semibold text-base-content/60">
						<div className="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
								<circle cx="8.5" cy="8.5" r="1.5"></circle>
								<polyline points="21 15 16 10 5 21"></polyline>
							</svg>
							{config.orientation === "landscape"
								? `${config.widthMm} × ${config.heightMm} mm`
								: `${config.widthMm} × ${config.heightMm} mm`}
						</div>
						{exportStrategy === "transpose" && transposePrintConfig && (
							<div className="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="M3 6h18M3 12h18M3 18h18" />
								</svg>
								{transposePrintConfig.tiles.length} hojas ({selectedPaper.label})
							</div>
						)}
						<div className="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<path d="M2 12h4l3-9 5 18 3-9h5"></path>
							</svg>
							{exportDpi} DPI export
						</div>
				</div>

				{exportStrategy === "transpose" && (
					<div className="pt-2">
						<TiledPrintPreview
							canvasW={config.widthMm}
							canvasH={config.heightMm}
							paperId={paperId}
							containerWidth={
								containerRef.current?.clientWidth
									? containerRef.current.clientWidth - 32
									: 400
							}
						/>
					</div>
				)}
			</div>

			{/* Right Area - Sidebar */}
			<aside className="w-96 h-[calc(100vh-8rem)] overflow-y-scroll shrink-0 sticky top-24 -mt-65 bg-base-100/80 dark:bg-df-surface-dark/70 rounded-3xl p-5 space-y-4 border-2 border-df-primary/30 backdrop-blur-sm">
				<div className="space-y-10">
					{/* Print Settings */}
					<article className="flex flex-col gap-4">
						<p className="text-[9px] font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">
							Cómo quieres imprimir
						</p>

						<label
							className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2
                ${
									exportStrategy === "original"
										? "bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20"
										: "border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm"
								}
                `}>
							<div>
								<span className="font-semibold text-sm block">Tamaño original</span>
								<span className="text-xs opacity-70">
									Imprime el lienzo a tamaño real
								</span>
							</div>
							<input
								type="radio"
								name="print-strategy"
								className={`radio radio-sm
                  ${
										exportStrategy === "original"
											? "bg-df-primary dark:bg-df-primary-dark"
											: "bg-gray-200 dark:bg-gray-700"
									}
                `}
								checked={exportStrategy === "original"}
								onChange={() => setExportStrategy("original")}
							/>
						</label>

						<label
							className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2
                ${
									exportStrategy === "transpose"
										? "bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20"
										: "border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm"
								}`}>
							<div>
								<span className="font-semibold text-sm block">Transponer a hojas</span>
								<span className="text-xs opacity-70">
									Divide el lienzo en varias hojas para unir
								</span>
							</div>
							<input
								type="radio"
								name="print-strategy"
								className={`radio radio-sm
                  ${
										exportStrategy === "transpose"
											? "bg-df-primary dark:bg-df-primary-dark"
											: "bg-gray-200 dark:bg-gray-700"
									}
                `}
								checked={exportStrategy === "transpose"}
								onChange={() => setExportStrategy("transpose")}
							/>
						</label>

						{exportStrategy === "transpose" && (
							<div className="p-4 rounded-xl bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20">
								<label className="text-[10px] font-bold tracking-widest uppercase mb-2 block">
									PAPEL DE IMPRESORA
								</label>
								<select
									className="w-full p-2 rounded-xl bg-white text-black dark:bg-gray-800/50 dark:text-white"
									value={paperId}
									onChange={(e) => setPaperId(e.target.value as any)}>
									{PRINT_PAPERS.map((p) => (
										<option key={p.id} value={p.id}>
											{p.label} ({p.widthMm} × {p.heightMm} mm)
										</option>
									))}
								</select>
							</div>
						)}

						<button
							onClick={handlePrintPreview}
							className="w-full inline-flex items-center justify-center gap-3 px-8 py-2.5 rounded-full cursor-pointer font-bold text-base text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-df-primary/30 dark:shadow-df-primary-dark/20">
							Imprimir / Guardar PDF
							<IconPrint />
						</button>
					</article>

					{/* Export Options */}
					<article className="flex flex-col gap-2">
						<p className="text-[9px] pb-2 font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">
							Opciones de exportación
						</p>

						<div className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-df-surface dark:bg-df-surface-dark">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-df-ink dark:text-df-ink-dark">
									DPI de exportación
								</span>
								<select
									className="select select-bordered select-sm bg-base-100 dark:bg-df-bg-dark"
									value={exportDpi}
									onChange={(e) =>
										setExportDpi(parseInt(e.target.value) as any)
									}>
									<option value={150}>150</option>
									<option value={300}>300</option>
								</select>
							</div>
						</div>

						<ExportOptionsButton
							name="Descargar como PDF"
							description="Diálogo de impresión (Guardar como PDF)"
							icon={<IconPDF />}
							onClick={handleDownloadPdf}
						/>

						<ExportOptionsButton
							name="Descargar como PNG"
							description="Imagen sin pérdida"
							icon={<IconPNG />}
							onClick={handleDownloadPng}
						/>

						<ExportOptionsButton
							name="Descargar como JPG"
							description="Más liviano para compartir"
							icon={<IconJPG />}
							onClick={handleDownloadJpg}
						/>

						<ExportOptionsButton
							name="Guardar en el Navegador"
							description="Almacenamiento Local"
							icon={<IconSave />}
							onClick={handleSaveToBrowser}
						/>

						<div className="flex gap-2">
							<ExportOptionsButton
								name="Exportar como JSON"
								description="Metadatos sin procesar"
								icon={<IconJSON />}
								onClick={handleExportJson}
							/>
							<button
								title="Importar JSON"
								className="w-14 flex items-center justify-center cursor-pointer rounded-2xl border-2 transition-all duration-200 border-gray-200 dark:border-gray-700 bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:-translate-y-0.5 hover:shadow-md"
								onClick={handleImportClick}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-purple-600 dark:text-purple-400">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
									<polyline points="17 8 12 3 7 8"></polyline>
									<line x1="12" y1="3" x2="12" y2="15"></line>
								</svg>
							</button>
						</div>

						<input
							type="file"
							accept="application/json"
							ref={fileInputRef}
							onChange={handleFileChange}
							className="hidden"
						/>
					</article>
				</div>
			</aside>

			{toastMessage && (
				<div className="toast toast-end toast-bottom z-50">
					<div className="alert alert-success shadow-lg text-white font-semibold flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="stroke-current shrink-0 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{toastMessage}</span>
					</div>
				</div>
			)}

			{printModalOpen && (
				<div className="fixed inset-0 z-[120] bg-df-bg/80 dark:bg-df-bg-dark/80 backdrop-blur-sm flex justify-center items-center p-4">
					<div className="bg-df-surface dark:bg-df-surface-dark w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl shadow-2xl border border-df-border dark:border-df-border-dark overflow-hidden">
						<div className="flex justify-between items-center p-6 border-b border-df-border dark:border-df-border-dark shrink-0">
							<div className="min-w-0">
								<h2 className="text-xl font-bold text-df-ink dark:text-df-ink-dark truncate">
									{printModalTitle}
								</h2>
								<p className="text-sm text-df-muted dark:text-df-muted-dark mt-1">
									Revisa la vista previa y luego imprime o guarda como PDF.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={handleModalPrint}
									disabled={!printModalLoaded}
									className="px-4 py-2 rounded-full font-bold text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									Imprimir / Guardar PDF
								</button>
								<button
									onClick={closePrintModal}
									className="p-2.5 bg-df-surface-alt dark:bg-df-surface-alt-dark hover:bg-df-border dark:hover:bg-df-border-dark rounded-full transition-colors text-df-ink dark:text-df-ink-dark"
									aria-label="Cerrar modal"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
								</button>
							</div>
						</div>

						<div className="flex-1 bg-white dark:bg-gray-900 flex flex-col min-h-0">
							{printModalKind === "transpose" && (
								<div className="shrink-0 p-4 border-b border-df-border dark:border-df-border-dark bg-df-surface dark:bg-df-surface-dark">
									<div className="grid grid-cols-3 gap-3">
										<label className="flex flex-col gap-1">
											<span className="text-[10px] font-bold tracking-widest uppercase text-df-muted dark:text-df-muted-dark">
												Escala
											</span>
											<input
												type="range"
												min="0.5"
												max="2"
												step="0.05"
												value={transposeScale}
												onChange={(e) =>
													setTransposeScale(
														parseFloat(e.target.value),
													)
												}
												className="range range-xs range-primary"
											/>
											<span className="text-xs font-semibold text-df-ink dark:text-df-ink-dark">
												{Math.round(transposeScale * 100)}%
											</span>
										</label>

										<label className="flex flex-col gap-1">
											<span className="text-[10px] font-bold tracking-widest uppercase text-df-muted dark:text-df-muted-dark">
												Corte X
											</span>
											<input
												type="range"
												min="0"
												max={selectedPaper.widthMm}
												step="1"
												value={transposeShiftX}
												onChange={(e) =>
													setTransposeShiftX(
														parseFloat(e.target.value),
													)
												}
												className="range range-xs range-primary"
											/>
											<span className="text-xs font-semibold text-df-ink dark:text-df-ink-dark">
												{Math.round(transposeShiftX)} mm
											</span>
										</label>

										<label className="flex flex-col gap-1">
											<span className="text-[10px] font-bold tracking-widest uppercase text-df-muted dark:text-df-muted-dark">
												Corte Y
											</span>
											<input
												type="range"
												min="0"
												max={selectedPaper.heightMm}
												step="1"
												value={transposeShiftY}
												onChange={(e) =>
													setTransposeShiftY(
														parseFloat(e.target.value),
													)
												}
												className="range range-xs range-primary"
											/>
											<span className="text-xs font-semibold text-df-ink dark:text-df-ink-dark">
												{Math.round(transposeShiftY)} mm
											</span>
										</label>
									</div>
								</div>
							)}

							<div className="flex-1 min-h-0 relative">
								{printModalKind === "transpose" && (
									<div
										ref={transposePreviewRef}
										className="absolute inset-0 overflow-hidden flex items-center justify-center p-6"
									>
										{(() => {
											const printConfig = buildPrintConfig(
												config.widthMm,
												config.heightMm,
												paperId,
												{
													canvasScale: transposeScale,
													shiftXMm: transposeShiftX,
													shiftYMm: transposeShiftY,
												},
											);

											const canvasScale = printConfig.canvasScale ?? 1;
											const docW = logicalWidth * canvasScale;
											const docH = logicalHeight * canvasScale;
											const stageW = docW * transposePreviewFit;
											const stageH = docH * transposePreviewFit;
											const itemScale = canvasScale * transposePreviewFit;

											const paperWpx =
												printConfig.paperWidthMm * MM_TO_PX;
											const paperHpx =
												printConfig.paperHeightMm * MM_TO_PX;
											const startXPx = printConfig.startXMm * MM_TO_PX;
											const startYPx = printConfig.startYMm * MM_TO_PX;

											const verticalLines: number[] = [];
											for (let c = 0; c <= printConfig.cols; c++) {
												const x = startXPx + c * paperWpx;
												if (x >= 0 && x <= docW) verticalLines.push(x);
											}

											const horizontalLines: number[] = [];
											for (let r = 0; r <= printConfig.rows; r++) {
												const y = startYPx + r * paperHpx;
												if (y >= 0 && y <= docH) horizontalLines.push(y);
											}

											return (
												<div className="rounded-2xl bg-base-200/60 dark:bg-base-300/10 border border-base-300 dark:border-gray-800 p-4 shadow-inner">
													<Stage
														width={stageW}
														height={stageH}
													>
														<Layer>
															<Rect
																x={0}
																y={0}
																width={stageW}
																height={stageH}
																fill="white"
															/>

															{sortedItems.map((item) => {
																if (
																	item.type === "text" ||
																	(!!item.text && !item.imageSrc)
																) {
																	return (
																		<StaticText
																			key={item.id}
																			text={item.text}
																			x={item.x}
																			y={item.y}
																			width={item.width}
																			height={item.height}
																			rotation={item.rotation}
																			scaleFactor={itemScale}
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
																		scaleFactor={itemScale}
																	/>
																);
															})}

															{printConfig.tiles.map((tile, i) => {
																const x =
																	(tile.offsetXMm * MM_TO_PX) *
																	transposePreviewFit;
																const y =
																	(tile.offsetYMm * MM_TO_PX) *
																	transposePreviewFit;
																const w = paperWpx * transposePreviewFit;
																const h = paperHpx * transposePreviewFit;
																if (x > stageW || y > stageH || x + w < 0 || y + h < 0)
																	return null;
																return (
																	<Rect
																		key={`tile-${i}`}
																		x={x}
																		y={y}
																		width={w}
																		height={h}
																		stroke="#7C3AED"
																		strokeWidth={1}
																		dash={[6, 4]}
																		opacity={0.85}
																	/>
																);
															})}

															{verticalLines.map((x, idx) => (
																<Line
																	key={`v-${idx}`}
																	points={[
																		x * transposePreviewFit,
																		0,
																		x * transposePreviewFit,
																		stageH,
																	]}
																	stroke="#EF4444"
																	strokeWidth={1}
																	opacity={0.8}
																/>
															))}
															{horizontalLines.map((y, idx) => (
																<Line
																	key={`h-${idx}`}
																	points={[
																		0,
																		y * transposePreviewFit,
																		stageW,
																		y * transposePreviewFit,
																	]}
																	stroke="#EF4444"
																	strokeWidth={1}
																	opacity={0.8}
																/>
															))}
														</Layer>
													</Stage>
													<div className="mt-3 flex items-center justify-between text-xs text-df-muted dark:text-df-muted-dark">
														<span>
															{printConfig.tiles.length} hojas • {selectedPaper.label}
														</span>
														<span>
															{Math.round(config.widthMm * canvasScale)} ×{" "}
															{Math.round(config.heightMm * canvasScale)} mm
														</span>
													</div>
												</div>
											);
										})()}
									</div>
								)}

								{printModalHtml && (
									<iframe
										ref={printIframeRef}
										title="Vista previa de impresión"
										className={printModalKind === "transpose" ? "hidden" : "w-full h-full"}
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
