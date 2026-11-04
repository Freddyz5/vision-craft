import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import type { CanvasImageEntry } from "../../../shared/store/canvasImages";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { polaroidPhotoBox } from "../../../shared/utils/frame";

/** Home printers can't reach the paper's edge; keep text this far inside it. */
export const SAFE_MARGIN_MM = 5;
/** Photo sharpness on paper, in pixels per inch of printed size. */
export const PPI_GOOD = 200;
export const PPI_MIN = 150;

// Overlaps smaller than this are rounding, not a problem worth flagging.
const TOLERANCE_PX = 0.5 * MM_TO_PX;

export type PrintWarningKind = "load-error" | "outside" | "margin" | "low-quality";

export interface PrintWarning {
	kind: PrintWarningKind;
	message: string;
	/** What to do about it. */
	hint: string;
}

export interface Sheet {
	/** Logical px (96 dpi). */
	width: number;
	height: number;
}

/** Axis-aligned bounds of the item as drawn: Konva rotates around its top-left corner. */
export function itemBounds(item: CanvasItem) {
	const rad = (item.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const corners = [
		[0, 0],
		[item.width, 0],
		[item.width, item.height],
		[0, item.height],
	].map(([dx, dy]) => [item.x + dx * cos - dy * sin, item.y + dx * sin + dy * cos]);
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	return {
		minX: Math.min(...xs),
		minY: Math.min(...ys),
		maxX: Math.max(...xs),
		maxY: Math.max(...ys),
	};
}

/** Printed sharpness of a photo: its pixels over its size on paper, on the weaker axis. */
export function imagePpi(item: CanvasItem, image?: CanvasImageEntry): number | null {
	if (!image?.naturalWidth || !image.naturalHeight || item.width <= 0 || item.height <= 0) {
		return null;
	}
	// Only the cropped part of the photo is spread over the printed box (or
	// over a polaroid's smaller window).
	const box = item.frame?.polaroid
		? polaroidPhotoBox(item.width, item.height)
		: { width: item.width, height: item.height };
	const ppiX = (image.naturalWidth * (item.crop?.width ?? 1)) / (box.width / 96);
	const ppiY = (image.naturalHeight * (item.crop?.height ?? 1)) / (box.height / 96);
	return Math.round(Math.min(ppiX, ppiY));
}

/** What would go wrong printing this item, most serious first. */
export function checkItem(
	item: CanvasItem,
	sheet: Sheet,
	image?: CanvasImageEntry,
): PrintWarning[] {
	const warnings: PrintWarning[] = [];
	const text = isTextItem(item);

	if (!text && image?.status === "error") {
		warnings.push({
			kind: "load-error",
			message: "No se pudo cargar",
			hint: "Reintenta la carga o quítala; así no saldrá en lo impreso.",
		});
	}

	const b = itemBounds(item);
	const outside =
		b.minX < -TOLERANCE_PX ||
		b.minY < -TOLERANCE_PX ||
		b.maxX > sheet.width + TOLERANCE_PX ||
		b.maxY > sheet.height + TOLERANCE_PX;
	if (outside) {
		warnings.push({
			kind: "outside",
			message: "Se sale del papel",
			hint: "Lo que queda fuera de la hoja no se imprime. Muévelo o hazlo más pequeño.",
		});
	} else if (text) {
		const m = SAFE_MARGIN_MM * MM_TO_PX - TOLERANCE_PX;
		if (b.minX < m || b.minY < m || b.maxX > sheet.width - m || b.maxY > sheet.height - m) {
			warnings.push({
				kind: "margin",
				message: "Texto en el margen",
				hint: "La impresora puede cortar los últimos 5 mm. Aleja el texto del borde.",
			});
		}
	}

	if (!text) {
		const ppi = imagePpi(item, image);
		if (ppi !== null && ppi < PPI_MIN) {
			warnings.push({
				kind: "low-quality",
				message: `Baja calidad · ${ppi} ppp`,
				hint: "Se verá borrosa en papel. Hazla más pequeña o usa una foto más grande.",
			});
		}
	}

	return warnings;
}

/** A warning the person chose to ignore stays ignored until the page reloads. */
export function warningKey(itemId: string, kind: PrintWarningKind): string {
	return `${itemId}:${kind}`;
}
