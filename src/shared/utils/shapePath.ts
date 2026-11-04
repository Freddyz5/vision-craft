import type { ImageShape } from "../store/canvasStore";

/** The canvas path calls a shape needs (satisfied by Konva's Context and CanvasRenderingContext2D). */
interface PathContext {
	rect(x: number, y: number, w: number, h: number): void;
	ellipse(
		x: number,
		y: number,
		rx: number,
		ry: number,
		rotation: number,
		start: number,
		end: number,
	): void;
	roundRect(x: number, y: number, w: number, h: number, radii: number): void;
	moveTo(x: number, y: number): void;
	bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
	closePath(): void;
}

// A heart as fractions of its box: [c1x, c1y, c2x, c2y, x, y] per curve.
const HEART_START = [0.5, 0.158];
const HEART_CURVES = [
	[0.5, 0.126, 0.4545, 0, 0.2727, 0],
	[0, 0, 0, 0.395, 0, 0.395],
	[0, 0.579, 0.1818, 0.8105, 0.5, 1],
	[0.8182, 0.8105, 1, 0.579, 1, 0.395],
	[1, 0.395, 1, 0, 0.7273, 0],
	[0.5909, 0, 0.5, 0.126, 0.5, 0.158],
];

/**
 * Trace `shape` filling the box (x, y, w, h), for use as a clip. Shared by
 * the item render (editor, export, print) and crop mode, so the mask is the
 * same everywhere. No shape = the plain rectangle.
 */
export function traceShape(
	ctx: PathContext,
	shape: ImageShape | undefined,
	x: number,
	y: number,
	w: number,
	h: number,
): void {
	switch (shape?.kind) {
		case "circle":
			ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
			break;
		case "rounded":
			ctx.roundRect(x, y, w, h, Math.min(w, h) * Math.min(Math.max(shape.radius, 0), 0.5));
			break;
		case "heart":
			ctx.moveTo(x + HEART_START[0] * w, y + HEART_START[1] * h);
			for (const [c1x, c1y, c2x, c2y, ex, ey] of HEART_CURVES) {
				ctx.bezierCurveTo(
					x + c1x * w,
					y + c1y * h,
					x + c2x * w,
					y + c2y * h,
					x + ex * w,
					y + ey * h,
				);
			}
			ctx.closePath();
			break;
		default:
			ctx.rect(x, y, w, h);
	}
}
