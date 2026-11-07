import type { CanvasItem, ImageCrop } from "../../../shared/store/canvasStore";

/** A rectangle in logical px, in the item's own (unrotated) frame: 0,0 is its top-left. */
export interface LocalRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const CROP_ASPECTS = [
	{ id: "free", label: "Libre", ratio: null },
	{ id: "1:1", label: "1:1", ratio: 1 },
	{ id: "4:5", label: "4:5", ratio: 4 / 5 },
	{ id: "3:2", label: "3:2", ratio: 3 / 2 },
] as const;
export type CropAspectId = (typeof CROP_ASPECTS)[number]["id"];

const FULL: ImageCrop = { x: 0, y: 0, width: 1, height: 1 };
/** Smallest crop box, in logical px. */
export const MIN_CROP = 20;

/** Where the whole (uncropped) photo sits in the item's frame. */
export function fullImageRect(item: CanvasItem): LocalRect {
	const c = item.crop ?? FULL;
	const width = item.width / c.width;
	const height = item.height / c.height;
	return { x: -c.x * width, y: -c.y * height, width, height };
}

/** Keep `rect` inside `bounds`, shrinking it if it's bigger. */
export function clampRect(rect: LocalRect, bounds: LocalRect): LocalRect {
	const width = Math.min(Math.max(rect.width, MIN_CROP), bounds.width);
	const height = Math.min(Math.max(rect.height, MIN_CROP), bounds.height);
	return {
		width,
		height,
		x: Math.min(Math.max(rect.x, bounds.x), bounds.x + bounds.width - width),
		y: Math.min(Math.max(rect.y, bounds.y), bounds.y + bounds.height - height),
	};
}

/** The biggest rect of `ratio` (w/h) centred on `around`, kept inside `bounds`. */
export function fitAspect(around: LocalRect, ratio: number, bounds: LocalRect): LocalRect {
	let width = around.width;
	let height = width / ratio;
	if (height > around.height) {
		height = around.height;
		width = height * ratio;
	}
	const cx = around.x + around.width / 2;
	const cy = around.y + around.height / 2;
	return clampRect({ x: cx - width / 2, y: cy - height / 2, width, height }, bounds);
}

/**
 * A photo's size and crop when its box becomes `box` (a rect in the item's
 * current frame, e.g. one side dragged), without stretching the photo: it
 * keeps its scale and place, and grows only as much as it must to still
 * cover the new box. So a side handle or a typed width crops, like Canva.
 */
export function resizePhotoBox(
	item: CanvasItem,
	box: LocalRect,
): Pick<CanvasItem, "width" | "height" | "crop"> {
	const full = fullImageRect(item);
	const grow = Math.max(1, box.width / full.width, box.height / full.height);
	const width = full.width * grow;
	const height = full.height * grow;
	// Grow around the box's centre, then slide just enough to cover the box.
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	let x = cx - ((cx - full.x) / full.width) * width;
	let y = cy - ((cy - full.y) / full.height) * height;
	x = Math.min(box.x, Math.max(box.x + box.width - width, x));
	y = Math.min(box.y, Math.max(box.y + box.height - height, y));
	const crop: ImageCrop = {
		x: (box.x - x) / width,
		y: (box.y - y) / height,
		width: box.width / width,
		height: box.height / height,
	};
	const whole = crop.x < 1e-4 && crop.y < 1e-4 && crop.width > 0.9999 && crop.height > 0.9999;
	return { width: box.width, height: box.height, crop: whole ? undefined : crop };
}

/**
 * The item after cropping to `rect`: its box becomes the rect (moved into
 * place through the item's rotation) and `crop` the matching fraction of the
 * photo; a crop that covers the whole photo is dropped.
 */
export function applyCrop(item: CanvasItem, rect: LocalRect): Partial<CanvasItem> {
	const full = fullImageRect(item);
	const rad = (item.rotation * Math.PI) / 180;
	const crop: ImageCrop = {
		x: Math.max(0, (rect.x - full.x) / full.width),
		y: Math.max(0, (rect.y - full.y) / full.height),
		width: Math.min(1, rect.width / full.width),
		height: Math.min(1, rect.height / full.height),
	};
	const whole = crop.x < 1e-4 && crop.y < 1e-4 && crop.width > 0.9999 && crop.height > 0.9999;
	return {
		x: item.x + rect.x * Math.cos(rad) - rect.y * Math.sin(rad),
		y: item.y + rect.x * Math.sin(rad) + rect.y * Math.cos(rad),
		width: rect.width,
		height: rect.height,
		crop: whole ? undefined : crop,
	};
}
