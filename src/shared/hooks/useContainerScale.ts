import { useEffect, useState } from "react";

/**
 * Scale factor (capped at 1) that fits a `logicalWidth` x `logicalHeight`
 * box inside `containerRef`'s content area, minus `padding` px per side.
 * Recomputes on container resize (ResizeObserver) and window resize.
 */
export function useContainerScale(
	containerRef: React.RefObject<HTMLElement | null>,
	logicalWidth: number,
	logicalHeight: number,
	padding = 32,
) {
	const [scaleFactor, setScaleFactor] = useState(1);

	useEffect(() => {
		const resize = () => {
			const container = containerRef.current;
			if (!container) return;

			const availableWidth = container.clientWidth - padding * 2;
			const availableHeight = container.clientHeight - padding * 2;

			const scaleX = availableWidth / logicalWidth;
			const scaleY = availableHeight / logicalHeight;
			setScaleFactor(Math.max(0.01, Math.min(scaleX, scaleY, 1)));
		};

		let ro: ResizeObserver | null = null;
		if (containerRef.current && "ResizeObserver" in window) {
			ro = new ResizeObserver(() => resize());
			ro.observe(containerRef.current);
		}

		requestAnimationFrame(resize);
		window.addEventListener("resize", resize);
		return () => {
			window.removeEventListener("resize", resize);
			ro?.disconnect();
		};
	}, [containerRef, logicalWidth, logicalHeight, padding]);

	return scaleFactor;
}
