import { useEffect, useState } from "react";
import type Konva from "konva";
import type { CanvasItem } from "../../../shared/store/canvasStore";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import type { PrintConfig } from "../types";
import { captureStage } from "../../../shared/utils/stageCapture";

interface UseWallPreviewCaptureOptions {
	stageRef: React.RefObject<Konva.Stage | null>;
	enabled: boolean;
	printConfig: PrintConfig | null;
	scaleFactor: number;
	items: CanvasItem[];
}

/**
 * Captures a downscaled screenshot of just the assembled poster area (hiding
 * the grid overlay) whenever poster mode is active, for the WallSizePreview
 * "how big will this be on my wall" illustration.
 */
export function useWallPreviewCapture({
	stageRef,
	enabled,
	printConfig,
	scaleFactor,
	items,
}: UseWallPreviewCaptureOptions) {
	const [wallPreviewSrc, setWallPreviewSrc] = useState<string | null>(null);

	// Clear the stale preview as soon as we stop showing it. Adjusted during
	// render instead of at the top of the effect below, to avoid a
	// synchronous setState inside the effect body.
	const [prevEnabled, setPrevEnabled] = useState(enabled);
	if (enabled !== prevEnabled) {
		setPrevEnabled(enabled);
		if (!enabled) setWallPreviewSrc(null);
	}

	useEffect(() => {
		if (!enabled || !printConfig) return;

		let cancelled = false;
		const capturePreview = () => {
			const stage = stageRef.current;
			if (!stage) return;

			try {
				const dataURL = captureStage(stage, {
					scaleFactor,
					pixelRatio: 1,
					region: {
						x: printConfig.startXMm * MM_TO_PX,
						y: printConfig.startYMm * MM_TO_PX,
						width: printConfig.pageViewportWidthMm * printConfig.cols * MM_TO_PX,
						height: printConfig.pageViewportHeightMm * printConfig.rows * MM_TO_PX,
					},
				});
				if (!cancelled) {
					setWallPreviewSrc(dataURL);
				}
			} catch {
				if (!cancelled) {
					setWallPreviewSrc(null);
				}
			}
		};

		const frameId = requestAnimationFrame(capturePreview);
		const timeoutId = window.setTimeout(capturePreview, 500);

		return () => {
			cancelled = true;
			window.cancelAnimationFrame(frameId);
			window.clearTimeout(timeoutId);
		};
	}, [enabled, printConfig, scaleFactor, items, stageRef]);

	return wallPreviewSrc;
}
