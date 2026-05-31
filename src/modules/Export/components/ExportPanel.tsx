import React, { useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
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
	createTiledPrintIframe,
	createDirectPrintIframe,
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

export default function ExportPanel() {
	const config = useStore(activeCanvasConfigStore);
	const items = useStore(activeCanvasItemsStore);

	// Canvas dimensions for preview
	const logicalWidth = config.widthMm * MM_TO_PX;
	const logicalHeight = config.heightMm * MM_TO_PX;

	// Print state
	const [printMode, setPrintMode] = useState<"direct" | "tiled">("direct");
	const [paperId, setPaperId] = useState<"a4" | "a3" | "us-letter">("a4");

	// Canvas scaling state
	const containerRef = useRef<HTMLDivElement>(null);
	const [scaleFactor, setScaleFactor] = useState(1);
	const [mounted, setMounted] = useState(false);

	// Konva stage ref for PNG export
	const stageRef = useRef<any>(null);

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
			setScaleFactor(Math.min(scaleX, scaleY, 1));
		};
		resize();
		window.addEventListener("resize", resize);
		return () => window.removeEventListener("resize", resize);
	}, [logicalWidth, logicalHeight]);

	const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

	const handlePrintPreview = () => {
		if (printMode === "direct") {
			createDirectPrintIframe(config, items);
		} else {
			const printConfig = buildPrintConfig(
				config.widthMm,
				config.heightMm,
				paperId,
			);
			createTiledPrintIframe(config, items, printConfig);
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
	};

	const handleDownloadPng = () => {
		if (stageRef.current) {
			// Unscale it back to original resolution for export
			const originalScale = stageRef.current.scale();
			stageRef.current.scale({ x: 1, y: 1 });
			stageRef.current.width(logicalWidth);
			stageRef.current.height(logicalHeight);

			const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });

			// Restore scale
			stageRef.current.scale(originalScale);
			stageRef.current.width(logicalWidth * scaleFactor);
			stageRef.current.height(logicalHeight * scaleFactor);

			const link = document.createElement("a");
			link.download = `${config.name || "vision-board"}.png`;
			link.href = dataURL;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const handleDownloadPdf = () => {
		// We use direct print for PDF saving since OS print dialog allows "Save to PDF"
		createDirectPrintIframe(config, items);
	};

	const handleSaveToBrowser = () => {
		saveCurrentCanvas();
		alert("Guardado correctamente en Mis Lienzos");
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
			alert("Lienzo importado exitosamente.");
			window.location.href = "/design";
		} catch (err: any) {
			alert("Error importando: " + err.message);
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
					className="flex-1 relative flex items-center justify-center overflow-hidden rounded-xl  shadow-inner p-4"
					ref={containerRef}>
					{mounted && printMode === "direct" && (
						<div className="shadow-2xl rounded-sm overflow-hidden bg-white transition-all duration-300 border border-base-300">
							<Stage
								width={logicalWidth * scaleFactor}
								height={logicalHeight * scaleFactor}
								ref={stageRef}>
								<Layer>
									<Rect
										width={logicalWidth * scaleFactor}
										height={logicalHeight * scaleFactor}
										fill="white"
									/>
									{sortedItems.map((item) => (
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
									))}
								</Layer>
							</Stage>
						</div>
					)}
					{mounted && printMode === "tiled" && (
						<div className="w-full h-full flex items-center justify-center animate-fade-in">
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

				{printMode === "direct" && (
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
							300 DPI Rendering
						</div>
					</div>
				)}
			</div>

			{/* Right Area - Sidebar */}
			<aside className="w-96 h-[calc(100vh-8rem)] overflow-y-scroll shrink-0 sticky top-24 -mt-65 bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-5 space-y-4 border-2 border-df-primary/30">
				<div className="space-y-10">
					{/* Print Settings */}
					<article className="flex flex-col gap-4">
						<p className="text-[9px] font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">
							Opciones de impresión
						</p>

						<label
							className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2
                ${
									printMode === "direct"
										? "bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20"
										: "border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm"
								}
                `}>
							<span className="font-semibold text-sm">Hoja única</span>
							<input
								type="radio"
								name="layout"
								className={`radio radio-sm
                  ${
										printMode === "direct"
											? "bg-df-primary dark:bg-df-primary-dark"
											: "bg-gray-200 dark:bg-gray-700"
									}
                `}
								checked={printMode === "direct"}
								onChange={() => setPrintMode("direct")}
							/>
						</label>

						<label
							className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2
                ${
									printMode === "tiled"
										? "bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20"
										: "border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm"
								}`}>
							<div>
								<span className="font-semibold text-sm block">Póster</span>
								<span className="text-xs opacity-70">
									Se divide en varias partes
								</span>
							</div>
							<input
								type="radio"
								name="layout"
								className={`radio radio-sm
                  ${
										printMode === "tiled"
											? "bg-df-primary dark:bg-df-primary-dark"
											: "bg-gray-200 dark:bg-gray-700"
									}
                `}
								checked={printMode === "tiled"}
								onChange={() => setPrintMode("tiled")}
							/>
						</label>

						{printMode === "tiled" && (
							<div className="p-4 rounded-xl bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20">
								<label className="text-[10px] font-bold tracking-widest uppercase mb-2 block">
									PAPER SIZE
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
							Imprimir lienzo
							<IconPrint />
						</button>
					</article>

					{/* Export Options */}
					<article className="flex flex-col gap-2">
						<p className="text-[9px] pb-2 font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">
							Opciones de exportación
						</p>

						<ExportOptionsButton
							name="Descargar como PDF"
							description="Alta resolución (300 DPI)"
							icon={<IconPDF />}
							onClick={handleDownloadPdf}
						/>

						<ExportOptionsButton
							name="Descargar como PNG"
							description="Optimizado para la web (150 DPI)"
							icon={<IconPNG />}
							onClick={handleDownloadPng}
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
		</section>
	);
}
