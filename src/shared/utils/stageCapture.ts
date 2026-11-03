import type Konva from "konva";

/**
 * Konva name for nodes that help while editing but must never reach an
 * export: snapping guides, the poster tile grid, the print overlay.
 */
export const EDITOR_ONLY = "editor-only";

interface CaptureStageOptions {
	/** Stage px per logical px the stage is currently drawn at. */
	scaleFactor: number;
	/** Output px per logical px (e.g. `dpi / 96`). */
	pixelRatio: number;
	/** Region to capture, in logical px. The whole stage when omitted. */
	region?: { x: number; y: number; width: number; height: number };
	mimeType?: "image/png" | "image/jpeg";
	quality?: number;
}

/**
 * Data URL of the stage as it will print: selection handles and every
 * editor-only node are hidden during the capture, and the resolution is set
 * per logical px so the on-screen fit/zoom never changes the exported size.
 */
export function captureStage(stage: Konva.Stage, options: CaptureStageOptions): string {
	const { scaleFactor, pixelRatio, region, mimeType, quality } = options;
	const hidden = [...stage.find(`.${EDITOR_ONLY}`), ...stage.find("Transformer")].filter((node) =>
		node.visible(),
	);
	hidden.forEach((node) => node.visible(false));
	try {
		const area = {
			...(region && {
				x: region.x * scaleFactor,
				y: region.y * scaleFactor,
				width: region.width * scaleFactor,
				height: region.height * scaleFactor,
			}),
			pixelRatio: pixelRatio / scaleFactor,
		};
		if (mimeType !== "image/jpeg") return stage.toDataURL({ ...area, mimeType, quality });
		// JPEG has no transparency: anything the stage doesn't paint would turn
		// black, so composite onto white paper first.
		const drawn = stage.toCanvas(area);
		const paper = document.createElement("canvas");
		paper.width = drawn.width;
		paper.height = drawn.height;
		const ctx = paper.getContext("2d");
		if (!ctx) return drawn.toDataURL(mimeType, quality);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, paper.width, paper.height);
		ctx.drawImage(drawn, 0, 0);
		return paper.toDataURL(mimeType, quality);
	} finally {
		hidden.forEach((node) => node.visible(true));
	}
}
