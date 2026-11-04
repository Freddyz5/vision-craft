import { map } from "nanostores";

export type CanvasImageStatus = "loading" | "loaded" | "error";

export interface CanvasImageEntry {
	status: CanvasImageStatus;
	image?: HTMLImageElement;
	naturalWidth?: number;
	naturalHeight?: number;
}

/**
 * Every image a stage has asked for, keyed by URL. Each URL loads once and
 * is shared by the Konva nodes (editor and export), the print list and the
 * print-quality checks, which need the photo's real pixel size.
 */
export const canvasImagesStore = map<Record<string, CanvasImageEntry>>({});

/**
 * Start loading `url` unless it already is. `crossOrigin` is required so the
 * stage can still be exported with toDataURL (a tainted canvas throws), which
 * also means a server that sends no CORS headers ends as status "error".
 */
export function requestCanvasImage(url: string): void {
	if (canvasImagesStore.get()[url]) return;
	canvasImagesStore.setKey(url, { status: "loading" });
	const img = new window.Image();
	img.crossOrigin = "anonymous";
	img.onload = () =>
		canvasImagesStore.setKey(url, {
			status: "loaded",
			image: img,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight,
		});
	img.onerror = () => canvasImagesStore.setKey(url, { status: "error" });
	img.src = url;
}

/** Forget a failed load and try again. */
export function retryCanvasImage(url: string): void {
	const { [url]: _failed, ...rest } = canvasImagesStore.get();
	canvasImagesStore.set(rest);
	requestCanvasImage(url);
}
