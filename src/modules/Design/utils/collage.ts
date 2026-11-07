import type { CanvasItem, ImageCrop } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { SAFE_MARGIN_MM, itemBounds, type Sheet } from "./printChecks";

export type CollageLayout = "grid" | "mosaic" | "featured";

/** Space between photos in a collage. */
const GAP_MM = 4;
/** Share of the sheet the featured photo takes. */
const FEATURED_SHARE = 0.6;

interface Cell {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Where each photo's own (natural) proportions come from: the loaded image
 * when known, else its current box.
 */
export type AspectOf = (item: CanvasItem) => number;

/** The crop that fills a `cellAspect` box from a photo of `photoAspect`, trimmed from the centre. */
export function coverCrop(photoAspect: number, cellAspect: number): ImageCrop | undefined {
	if (Math.abs(photoAspect - cellAspect) < 1e-3) return undefined;
	if (photoAspect > cellAspect) {
		const width = cellAspect / photoAspect;
		return { x: (1 - width) / 2, y: 0, width, height: 1 };
	}
	const height = photoAspect / cellAspect;
	return { x: 0, y: (1 - height) / 2, width: 1, height };
}

/**
 * Uniform cells, the last row centred. The column count picks cells close
 * to square while leaving as few empty slots as possible.
 */
function gridCells(n: number, area: Cell, gap: number): Cell[] {
	let cols = 1;
	let best = Infinity;
	for (let c = 1; c <= n; c++) {
		const r = Math.ceil(n / c);
		const aspect = (area.width - gap * (c - 1)) / c / ((area.height - gap * (r - 1)) / r);
		const score = Math.abs(Math.log(aspect)) + (r * c - n) * 0.6;
		if (score < best) {
			best = score;
			cols = c;
		}
	}
	const rows = Math.ceil(n / cols);
	const width = (area.width - gap * (cols - 1)) / cols;
	const height = (area.height - gap * (rows - 1)) / rows;
	return Array.from({ length: n }, (_, i) => {
		const row = Math.floor(i / cols);
		const inRow = row === rows - 1 ? n - row * cols : cols;
		const offset = ((cols - inRow) * (width + gap)) / 2;
		return {
			x: area.x + offset + (i % cols) * (width + gap),
			y: area.y + row * (height + gap),
			width,
			height,
		};
	});
}

/**
 * Justified rows: each row's photos keep their proportions side by side
 * across the full width, then rows are stretched to fill the height.
 */
function mosaicCells(aspects: number[], area: Cell, gap: number): Cell[] {
	const n = aspects.length;
	const avg = aspects.reduce((a, b) => a + b, 0) / n;
	const rowCount = Math.min(
		n,
		Math.max(1, Math.round(Math.sqrt((n * area.height * avg) / area.width))),
	);
	// Split into rows of nearly equal size, in order.
	const rows: number[][] = [];
	let start = 0;
	for (let r = 0; r < rowCount; r++) {
		const size = Math.round((n - start) / (rowCount - r));
		rows.push(aspects.slice(start, start + size).map((_, j) => start + j));
		start += size;
	}
	const naturalHeights = rows.map(
		(row) => (area.width - gap * (row.length - 1)) / row.reduce((sum, i) => sum + aspects[i], 0),
	);
	const fit = (area.height - gap * (rows.length - 1)) / naturalHeights.reduce((a, b) => a + b, 0);
	const cells: Cell[] = [];
	let y = area.y;
	rows.forEach((row, r) => {
		const height = naturalHeights[r] * fit;
		let x = area.x;
		for (const i of row) {
			const width = aspects[i] * naturalHeights[r];
			cells[i] = { x, y, width, height };
			x += width + gap;
		}
		y += height + gap;
	});
	return cells;
}

/** One large photo (top on a portrait sheet, left on a landscape one), the rest in a grid. */
function featuredCells(n: number, area: Cell, gap: number): Cell[] {
	if (n === 1) return [area];
	const portrait = area.height >= area.width;
	const big: Cell = portrait
		? { ...area, height: (area.height - gap) * FEATURED_SHARE }
		: { ...area, width: (area.width - gap) * FEATURED_SHARE };
	const rest: Cell = portrait
		? { ...area, y: area.y + big.height + gap, height: area.height - big.height - gap }
		: { ...area, x: area.x + big.width + gap, width: area.width - big.width - gap };
	return [big, ...gridCells(n - 1, rest, gap)];
}

/** Below this share of the printable height, a band between texts is too thin for a collage. */
const MIN_FREE_SHARE = 0.4;

/**
 * The tallest full-width band of `area` that no text crosses (texts keep
 * a gap around them), so a collage never covers a title or a caption.
 * When the texts leave no band worth using, the whole area.
 */
function freeBand(area: Cell, texts: CanvasItem[], gap: number): Cell {
	const blocked = texts
		.map(itemBounds)
		.map((b) => [Math.max(area.y, b.minY - gap), Math.min(area.y + area.height, b.maxY + gap)])
		.filter(([top, bottom]) => bottom > top)
		.sort((a, b) => a[0] - b[0]);
	let best: Cell | null = null;
	let cursor = area.y;
	for (const [top, bottom] of [...blocked, [area.y + area.height, area.y + area.height]]) {
		if (top - cursor > (best?.height ?? 0)) {
			best = { ...area, y: cursor, height: top - cursor };
		}
		cursor = Math.max(cursor, bottom);
	}
	return best && best.height >= area.height * MIN_FREE_SHARE ? best : area;
}

/**
 * Patches that lay `photos` out on the sheet's printable area (inside the
 * safe margin), in the band the board's `texts` leave free. Photos keep
 * their reading order (top-to-bottom, then left-to-right); for "featured"
 * the photo `featuredId` names goes big, else the currently largest one.
 * Each photo is straightened and cropped from the centre to fill its cell.
 */
export function collagePatches(
	photos: CanvasItem[],
	layout: CollageLayout,
	sheet: Sheet,
	aspectOf: AspectOf,
	{ texts = [], featuredId }: { texts?: CanvasItem[]; featuredId?: string } = {},
): Record<string, Partial<CanvasItem>> {
	if (photos.length === 0) return {};
	const m = SAFE_MARGIN_MM * MM_TO_PX;
	const gap = GAP_MM * MM_TO_PX;
	const printable: Cell = {
		x: m,
		y: m,
		width: sheet.width - 2 * m,
		height: sheet.height - 2 * m,
	};
	const area = freeBand(printable, texts, gap);

	const ordered = [...photos].sort((a, b) => {
		const ay = a.y + a.height / 2;
		const by = b.y + b.height / 2;
		return Math.abs(ay - by) > 20 ? ay - by : a.x - b.x;
	});
	if (layout === "featured") {
		const featured =
			ordered.find((p) => p.id === featuredId) ??
			ordered.reduce((best, p) => (p.width * p.height > best.width * best.height ? p : best));
		ordered.splice(ordered.indexOf(featured), 1);
		ordered.unshift(featured);
	}

	const cells =
		layout === "grid"
			? gridCells(ordered.length, area, gap)
			: layout === "mosaic"
				? mosaicCells(ordered.map(aspectOf), area, gap)
				: featuredCells(ordered.length, area, gap);

	return Object.fromEntries(
		ordered.map((photo, i) => {
			const cell = cells[i];
			return [
				photo.id,
				{
					x: cell.x,
					y: cell.y,
					width: cell.width,
					height: cell.height,
					rotation: 0,
					crop: coverCrop(aspectOf(photo), cell.width / cell.height),
				},
			];
		}),
	);
}
