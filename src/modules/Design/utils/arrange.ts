import type { CanvasItem } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { SAFE_MARGIN_MM, itemBounds, type Sheet } from "./printChecks";

export type AlignEdge = "left" | "center" | "right" | "top" | "middle" | "bottom";
/** Align to the selection's own bounds, or to the sheet's printable area. */
export type AlignReference = "selection" | "sheet";
export type DistributeAxis = "horizontal" | "vertical";

type Patches = Record<string, Partial<Pick<CanvasItem, "x" | "y">>>;
interface Frame {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

function unionBounds(items: CanvasItem[]): Frame {
	const all = items.map(itemBounds);
	return {
		minX: Math.min(...all.map((b) => b.minX)),
		maxX: Math.max(...all.map((b) => b.maxX)),
		minY: Math.min(...all.map((b) => b.minY)),
		maxY: Math.max(...all.map((b) => b.maxY)),
	};
}

/**
 * Moves that line `items` up on one edge or centre line. "sheet" means the
 * area inside the 5 mm safe margin, so aligning to the page never pushes
 * anything where a home printer can't reach. Positions use each item's
 * drawn (rotated) bounds.
 */
export function alignPatches(
	items: CanvasItem[],
	edge: AlignEdge,
	reference: AlignReference,
	sheet: Sheet,
): Patches {
	const m = SAFE_MARGIN_MM * MM_TO_PX;
	const frame: Frame =
		reference === "sheet"
			? { minX: m, maxX: sheet.width - m, minY: m, maxY: sheet.height - m }
			: unionBounds(items);
	const patches: Patches = {};
	for (const item of items) {
		const b = itemBounds(item);
		switch (edge) {
			case "left":
				patches[item.id] = { x: item.x + frame.minX - b.minX };
				break;
			case "center":
				patches[item.id] = { x: item.x + (frame.minX + frame.maxX) / 2 - (b.minX + b.maxX) / 2 };
				break;
			case "right":
				patches[item.id] = { x: item.x + frame.maxX - b.maxX };
				break;
			case "top":
				patches[item.id] = { y: item.y + frame.minY - b.minY };
				break;
			case "middle":
				patches[item.id] = { y: item.y + (frame.minY + frame.maxY) / 2 - (b.minY + b.maxY) / 2 };
				break;
			case "bottom":
				patches[item.id] = { y: item.y + frame.maxY - b.maxY };
				break;
		}
	}
	return patches;
}

/**
 * Spread three or more items so the gaps between them are equal along one
 * axis; the first and last stay where they are.
 */
export function distributePatches(items: CanvasItem[], axis: DistributeAxis): Patches {
	if (items.length < 3) return {};
	const horizontal = axis === "horizontal";
	const measured = items
		.map((item) => {
			const b = itemBounds(item);
			return horizontal
				? { item, start: b.minX, size: b.maxX - b.minX }
				: { item, start: b.minY, size: b.maxY - b.minY };
		})
		.sort((a, b) => a.start - b.start);
	const first = measured[0];
	const last = measured[measured.length - 1];
	const span = last.start + last.size - first.start;
	const gap = (span - measured.reduce((sum, m) => sum + m.size, 0)) / (measured.length - 1);

	const patches: Patches = {};
	let cursor = first.start;
	for (const { item, start, size } of measured) {
		const shift = cursor - start;
		patches[item.id] = horizontal ? { x: item.x + shift } : { y: item.y + shift };
		cursor += size + gap;
	}
	return patches;
}
