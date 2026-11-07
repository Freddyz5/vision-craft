import Konva from "konva";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem } from "../store/canvasStore";
import { fontStack } from "./fonts";

type TextMeasure = Pick<CanvasItem, "text" | "width" | "fontSize" | "fontFamily" | "fontStyle">;

// One detached node, reused: measuring never touches a stage.
let probe: Konva.Text | null = null;

/**
 * The height (logical px) a text item's lines take at its width, font and
 * size, wrapped exactly as the shared render wraps them. A text item's
 * stored height must follow this, or the checks and handles that read it
 * drift from what prints.
 */
export function measureTextHeight(item: TextMeasure): number {
	probe ??= new Konva.Text({ lineHeight: TEXT_DEFAULTS.lineHeight, wrap: "word" });
	probe.setAttrs({
		text: item.text || " ",
		width: Math.max(1, item.width),
		fontSize: item.fontSize || TEXT_DEFAULTS.fontSize,
		fontFamily: fontStack(item.fontFamily),
		fontStyle: item.fontStyle || TEXT_DEFAULTS.fontStyle,
	});
	return probe.height();
}

/** Height patches for the text items whose stored height no longer fits their lines. */
export function textHeightPatches(items: CanvasItem[]): Record<string, Partial<CanvasItem>> {
	const patches: Record<string, Partial<CanvasItem>> = {};
	for (const item of items) {
		if (!isTextItem(item)) continue;
		const height = measureTextHeight(item);
		if (Math.abs(height - item.height) > 0.5) patches[item.id] = { height };
	}
	return patches;
}
