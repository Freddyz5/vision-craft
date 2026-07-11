import type React from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { Image as ImageIcon, Layers, Gauge } from "lucide-react";
import type { CanvasConfig, CanvasItem } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import type { ExportMode, PrintConfig } from "../types";
import { StaticImage, StaticText } from "./StaticCanvasItems";
import { TileGridOverlay } from "./TileGridOverlay";
import { WallSizePreview } from "./WallSizePreview";

interface ExportCanvasPreviewProps {
	config: CanvasConfig;
	items: CanvasItem[];
	logicalWidth: number;
	logicalHeight: number;
	scaleFactor: number;
	exportMode: ExportMode;
	exportDpi: number;
	transposePrintConfig: PrintConfig | null;
	selectedPaper: { label: string; widthMm: number; heightMm: number };
	paperOrientation: "portrait" | "landscape";
	wallPreviewSrc: string | null;
	stageRef: React.RefObject<Konva.Stage | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportCanvasPreview({
	config,
	items,
	logicalWidth,
	logicalHeight,
	scaleFactor,
	exportMode,
	exportDpi,
	transposePrintConfig,
	selectedPaper,
	paperOrientation,
	wallPreviewSrc,
	stageRef,
	containerRef,
}: ExportCanvasPreviewProps) {
	const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
	const showPosterMeta = exportMode === "poster" && !!transposePrintConfig;

	return (
		<div className="min-w-0 flex-1 space-y-8">
			<header>
				<p className="text-primary mb-2 text-xs font-bold tracking-[0.2em] uppercase">
					Vista Previa
				</p>
				<h2 className="text-4xl font-extrabold">{config.name || "Untitled Vision"}</h2>
			</header>

			<div
				className="bg-df-surface dark:bg-base-300/10 border-base-300 relative flex h-[calc(100vh-20rem)] min-h-[520px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-4 shadow-inner dark:border-gray-800"
				ref={containerRef}
			>
				{showPosterMeta && (
					<div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm dark:bg-black/80">
						<Layers className="h-3.5 w-3.5" aria-hidden="true" />
						{transposePrintConfig!.tiles.length} hojas · {selectedPaper.label}{" "}
						{paperOrientation === "landscape" ? "Horizontal" : "Vertical"}
					</div>
				)}
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
							{showPosterMeta && (
								<TileGridOverlay
									printConfig={transposePrintConfig!}
									pxPerMm={MM_TO_PX * scaleFactor}
									boundsWidthPx={logicalWidth * scaleFactor}
									boundsHeightPx={logicalHeight * scaleFactor}
								/>
							)}
						</Layer>
					</Stage>
				</div>
			</div>

			<div className="text-base-content/60 mt-6 flex items-center gap-6 text-sm font-semibold">
				<div className="flex items-center gap-2">
					<ImageIcon className="h-4 w-4" aria-hidden="true" />
					{config.widthMm} × {config.heightMm} mm
				</div>
				{showPosterMeta && (
					<div className="flex items-center gap-2">
						<Layers className="h-4 w-4" aria-hidden="true" />
						{transposePrintConfig!.cols} x {transposePrintConfig!.rows} hojas ({selectedPaper.label}
						)
					</div>
				)}
				<div className="flex items-center gap-2">
					<Gauge className="h-4 w-4" aria-hidden="true" />
					{exportDpi} DPI export
				</div>
			</div>

			{showPosterMeta && (
				<div className="border-base-300 bg-base-200/40 dark:bg-base-300/10 rounded-2xl border p-5 dark:border-gray-800">
					<p className="text-df-muted dark:text-df-muted-dark mb-3 text-center text-[9px] font-bold tracking-[0.22em] uppercase">
						Tamaño final en la pared
					</p>
					<WallSizePreview
						posterWidthMm={transposePrintConfig!.posterWidthMm}
						posterHeightMm={transposePrintConfig!.posterHeightMm}
						previewSrc={wallPreviewSrc}
						cols={transposePrintConfig!.cols}
						rows={transposePrintConfig!.rows}
					/>
				</div>
			)}
		</div>
	);
}
