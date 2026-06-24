import { Group, Rect, Line } from "react-konva";
import type { PrintConfig } from "../types";

interface TileGridOverlayProps {
	printConfig: PrintConfig;
	/** px per canvas-mm at the current zoom level (e.g. MM_TO_PX * scaleFactor) */
	pxPerMm: number;
	/** Visible stage bounds (px), used to clip cut-lines/tiles outside the viewport */
	boundsWidthPx: number;
	boundsHeightPx: number;
}

/**
 * Renders the red cut-lines + dashed tile outlines for "poster" (multi-sheet)
 * print mode, as Konva primitives. Must be rendered inside a react-konva
 * <Layer>. Shared by the main /export preview (Fase 3) and the print modal's
 * interactive preview (Fase 6), so the overlay math lives in exactly one place.
 */
export function TileGridOverlay({
	printConfig,
	pxPerMm,
	boundsWidthPx,
	boundsHeightPx,
}: TileGridOverlayProps) {
	const pageWpx = printConfig.pageViewportWidthMm * pxPerMm;
	const pageHpx = printConfig.pageViewportHeightMm * pxPerMm;
	const startXPx = printConfig.startXMm * pxPerMm;
	const startYPx = printConfig.startYMm * pxPerMm;
	const gridStartXPx = Math.max(0, startXPx);
	const gridStartYPx = Math.max(0, startYPx);
	const gridEndXPx = Math.min(boundsWidthPx, startXPx + printConfig.cols * pageWpx);
	const gridEndYPx = Math.min(boundsHeightPx, startYPx + printConfig.rows * pageHpx);

	const verticalLines: number[] = [];
	for (let c = 0; c <= printConfig.cols; c++) {
		const x = startXPx + c * pageWpx;
		if (x >= 0 && x <= boundsWidthPx) verticalLines.push(x);
	}

	const horizontalLines: number[] = [];
	for (let r = 0; r <= printConfig.rows; r++) {
		const y = startYPx + r * pageHpx;
		if (y >= 0 && y <= boundsHeightPx) horizontalLines.push(y);
	}

	return (
		<Group name="poster-grid-overlay">
			{printConfig.tiles.map((tile, i) => {
				const x = tile.offsetXMm * pxPerMm;
				const y = tile.offsetYMm * pxPerMm;
				if (x > boundsWidthPx || y > boundsHeightPx || x + pageWpx < 0 || y + pageHpx < 0) {
					return null;
				}
				return (
					<Rect
						key={`tile-${i}`}
						x={x}
						y={y}
						width={pageWpx}
						height={pageHpx}
						stroke="#7C3AED"
						strokeWidth={2}
						dash={[6, 4]}
						opacity={0.85}
					/>
				);
			})}

			{verticalLines.map((x, idx) => (
				<Line
					key={`v-${idx}`}
					points={[x, gridStartYPx, x, gridEndYPx]}
					stroke="#7042FC"
					strokeWidth={2}
				/>
			))}

			{horizontalLines.map((y, idx) => (
				<Line
					key={`h-${idx}`}
					points={[gridStartXPx, y, gridEndXPx, y]}
					stroke="#7042FC"
					strokeWidth={2}
				/>
			))}
		</Group>
	);
}
