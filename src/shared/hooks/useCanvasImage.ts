import { useEffect, useState } from "react";

export type CanvasImageStatus = "loading" | "loaded" | "error";

interface CanvasImageState {
	url?: string;
	image?: HTMLImageElement;
	status: CanvasImageStatus;
}

/**
 * Loads `url` as an HTMLImageElement for a Konva stage. `crossOrigin` is
 * required so the stage can still be exported with toDataURL (a tainted
 * canvas throws), which also means a server that sends no CORS headers makes
 * the load fail: that surfaces as status "error" instead of a silent blank.
 */
export function useCanvasImage(url?: string): CanvasImageState {
	const [state, setState] = useState<CanvasImageState>({ status: "loading" });

	useEffect(() => {
		if (!url) return;
		let cancelled = false;
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			if (!cancelled) setState({ url, image: img, status: "loaded" });
		};
		img.onerror = () => {
			if (!cancelled) setState({ url, status: "error" });
		};
		img.src = url;
		return () => {
			cancelled = true;
			img.onload = null;
			img.onerror = null;
		};
	}, [url]);

	if (!url) return { status: "error" };
	// The stored result belongs to a previous url until the effect catches up.
	if (state.url !== url) return { url, status: "loading" };
	return state;
}
