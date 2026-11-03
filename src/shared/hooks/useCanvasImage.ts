import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
	canvasImagesStore,
	requestCanvasImage,
	type CanvasImageEntry,
} from "../store/canvasImages";

export type { CanvasImageStatus } from "../store/canvasImages";

const LOADING: CanvasImageEntry = { status: "loading" };
const MISSING: CanvasImageEntry = { status: "error" };

/** The shared load state of `url` (see canvasImagesStore), starting the load if needed. */
export function useCanvasImage(url?: string): CanvasImageEntry {
	const images = useStore(canvasImagesStore, { keys: url ? [url] : [] });

	useEffect(() => {
		if (url) requestCanvasImage(url);
	}, [url]);

	if (!url) return MISSING;
	return images[url] ?? LOADING;
}
