import { TEXT_DEFAULTS, type CanvasItem } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import type { Sheet } from "./printChecks";

/** New photos take this share of the sheet's width; new text is 36 pt. */
const PHOTO_WIDTH_SHARE = 0.4;
const TEXT_WIDTH_SHARE = 0.6;
const TEXT_FONT_SIZE = 48; // 36 pt at 96 dpi
/** Each new item lands a little down and right of the previous one, so none hides another. */
const CASCADE_MM = 6;
const CASCADE_STEPS = 6;

interface PhotoSource {
	imageSrc: string;
	alt?: string;
	width: number;
	height: number;
}

function topZ(items: CanvasItem[]): number {
	return Math.max(0, ...items.map((i) => i.zIndex)) + 1;
}

function cascade(items: CanvasItem[]): number {
	return (items.length % CASCADE_STEPS) * CASCADE_MM * MM_TO_PX;
}

/**
 * A photo sized to the sheet. Placed centred (cascading) unless `center`
 * gives the drop point in logical px.
 */
export function newPhotoItem(
	photo: PhotoSource,
	sheet: Sheet,
	items: CanvasItem[],
	center?: { x: number; y: number },
): CanvasItem {
	const ratio = photo.height > 0 && photo.width > 0 ? photo.height / photo.width : 0.75;
	let width = sheet.width * PHOTO_WIDTH_SHARE;
	let height = width * ratio;
	// Tall photos on a landscape sheet: fit the height instead.
	if (height > sheet.height * 0.6) {
		height = sheet.height * 0.6;
		width = height / ratio;
	}
	const offset = center ? 0 : cascade(items);
	const cx = center?.x ?? sheet.width / 2;
	const cy = center?.y ?? sheet.height / 2;
	return {
		id: crypto.randomUUID(),
		type: "image",
		imageSrc: photo.imageSrc,
		alt: photo.alt,
		x: cx - width / 2 + offset,
		y: cy - height / 2 + offset,
		width,
		height,
		rotation: 0,
		zIndex: topZ(items),
	};
}

export function newTextItem(sheet: Sheet, items: CanvasItem[]): CanvasItem {
	const width = sheet.width * TEXT_WIDTH_SHARE;
	const height = TEXT_FONT_SIZE * 1.2;
	const offset = cascade(items);
	return {
		id: crypto.randomUUID(),
		type: "text",
		text: "Sueña en grande",
		x: (sheet.width - width) / 2 + offset,
		// Near the top, like a title, so it doesn't land on a photo added to the centre.
		y: sheet.height * 0.12 + offset,
		width,
		height,
		rotation: 0,
		fontSize: TEXT_FONT_SIZE,
		fillColor: TEXT_DEFAULTS.fillColor,
		fontFamily: TEXT_DEFAULTS.fontFamily,
		zIndex: topZ(items),
	};
}
