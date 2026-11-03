import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type Konva from "konva";
import { isTypingTarget } from "./useEditorShortcuts";

interface UseViewportNavigationOptions {
	/** The scrolling area around the sheet. */
	viewportRef: React.RefObject<HTMLDivElement | null>;
	stageRef: React.RefObject<Konva.Stage | null>;
	/** Current stage px per logical px. */
	scale: number;
	/** Ask for a new scale (the editor clamps it). */
	setScale: (scale: number) => void;
}

/** Zoom limits, in stage px per logical px (1 = real size at 96 dpi). */
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3;

const CONTROLS = 'button, a[href], [role="tab"], [role="menuitem"], [role="checkbox"], summary';

/** A point of the sheet (logical px) that must stay under the same screen point after zooming. */
interface Anchor {
	clientX: number;
	clientY: number;
	logicalX: number;
	logicalY: number;
}

/**
 * Zoom and pan the sheet like a design tool:
 * - Ctrl/⌘ + wheel, or a trackpad pinch, zooms toward the pointer
 *   (a plain wheel keeps scrolling the view)
 * - holding Space turns a drag into panning (desktop)
 * - two fingers pinch to zoom and drag to pan (touch)
 * Returns whether Space-panning is armed, for the cursor.
 */
export function useViewportNavigation({
	viewportRef,
	stageRef,
	scale,
	setScale,
}: UseViewportNavigationOptions) {
	const anchorRef = useRef<Anchor | null>(null);
	const latest = useRef({ scale, setScale });
	useEffect(() => {
		latest.current = { scale, setScale };
	});
	const [spaceHeld, setSpaceHeld] = useState(false);
	const spaceRef = useRef(false);

	/** Zoom to `next`, keeping the sheet point under (clientX, clientY) in place. */
	const zoomAt = (clientX: number, clientY: number, target: number) => {
		const container = stageRef.current?.container();
		const { scale, setScale } = latest.current;
		const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, target));
		// Already at a limit: nothing moves, so no anchor to keep.
		if (!container || Math.abs(next - scale) < 1e-4) return;
		const rect = container.getBoundingClientRect();
		anchorRef.current = {
			clientX,
			clientY,
			logicalX: (clientX - rect.left) / scale,
			logicalY: (clientY - rect.top) / scale,
		};
		setScale(next);
	};
	const zoomAtRef = useRef(zoomAt);
	useEffect(() => {
		zoomAtRef.current = zoomAt;
	});

	// After the sheet is laid out at the new scale, scroll so the anchor point
	// sits under the pointer again.
	useLayoutEffect(() => {
		const anchor = anchorRef.current;
		const viewport = viewportRef.current;
		const container = stageRef.current?.container();
		if (!anchor || !viewport || !container) return;
		anchorRef.current = null;
		const rect = container.getBoundingClientRect();
		viewport.scrollLeft += rect.left + anchor.logicalX * scale - anchor.clientX;
		viewport.scrollTop += rect.top + anchor.logicalY * scale - anchor.clientY;
	}, [scale, viewportRef, stageRef]);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		// Ctrl/⌘ + wheel (and trackpad pinch, which arrives as ctrl + wheel) zooms.
		const onWheel = (e: WheelEvent) => {
			if (!(e.ctrlKey || e.metaKey)) return;
			e.preventDefault();
			const delta = Math.max(-50, Math.min(50, e.deltaY));
			zoomAtRef.current(e.clientX, e.clientY, latest.current.scale * Math.exp(-delta * 0.01));
		};

		// Space + drag pans. Caught before the stage, so Konva never starts a drag.
		let pan: { x: number; y: number; left: number; top: number } | null = null;
		const onPointerDown = (e: PointerEvent) => {
			if (!spaceRef.current || e.pointerType === "touch") return;
			e.preventDefault();
			e.stopPropagation();
			pan = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
			viewport.setPointerCapture(e.pointerId);
		};
		const onPointerMove = (e: PointerEvent) => {
			if (!pan) return;
			viewport.scrollLeft = pan.left - (e.clientX - pan.x);
			viewport.scrollTop = pan.top - (e.clientY - pan.y);
		};
		const onPointerUp = () => {
			pan = null;
		};
		const swallowMouseDown = (e: MouseEvent) => {
			if (spaceRef.current) e.stopPropagation();
		};

		// Two fingers: pinch zooms around their midpoint, moving them pans.
		let pinch: { distance: number; scale: number; midX: number; midY: number } | null = null;
		const touchInfo = (t: TouchList) => ({
			distance: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
			midX: (t[0].clientX + t[1].clientX) / 2,
			midY: (t[0].clientY + t[1].clientY) / 2,
		});
		const onTouchStart = (e: TouchEvent) => {
			if (e.touches.length !== 2) return;
			e.stopPropagation();
			pinch = { ...touchInfo(e.touches), scale: latest.current.scale };
		};
		const onTouchMove = (e: TouchEvent) => {
			if (!pinch || e.touches.length !== 2) return;
			e.preventDefault();
			e.stopPropagation();
			const now = touchInfo(e.touches);
			viewport.scrollLeft -= now.midX - pinch.midX;
			viewport.scrollTop -= now.midY - pinch.midY;
			zoomAtRef.current(now.midX, now.midY, pinch.scale * (now.distance / pinch.distance));
			pinch = { ...pinch, midX: now.midX, midY: now.midY };
		};
		const onTouchEnd = (e: TouchEvent) => {
			if (e.touches.length < 2) pinch = null;
		};

		viewport.addEventListener("wheel", onWheel, { passive: false });
		viewport.addEventListener("pointerdown", onPointerDown, true);
		viewport.addEventListener("pointermove", onPointerMove);
		viewport.addEventListener("pointerup", onPointerUp);
		viewport.addEventListener("pointercancel", onPointerUp);
		viewport.addEventListener("mousedown", swallowMouseDown, true);
		viewport.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
		viewport.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
		viewport.addEventListener("touchend", onTouchEnd, true);
		return () => {
			viewport.removeEventListener("wheel", onWheel);
			viewport.removeEventListener("pointerdown", onPointerDown, true);
			viewport.removeEventListener("pointermove", onPointerMove);
			viewport.removeEventListener("pointerup", onPointerUp);
			viewport.removeEventListener("pointercancel", onPointerUp);
			viewport.removeEventListener("mousedown", swallowMouseDown, true);
			viewport.removeEventListener("touchstart", onTouchStart, true);
			viewport.removeEventListener("touchmove", onTouchMove, true);
			viewport.removeEventListener("touchend", onTouchEnd, true);
		};
	}, [viewportRef]);

	// Holding Space arms panning; not while typing, and not on a focused
	// control, where Space must keep pressing it.
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.code !== "Space" || isTypingTarget(e.target)) return;
			if ((e.target as HTMLElement).closest?.(CONTROLS)) return;
			// Space would otherwise scroll the page or press a focused button.
			e.preventDefault();
			if (!spaceRef.current) {
				spaceRef.current = true;
				setSpaceHeld(true);
			}
		};
		const up = (e: KeyboardEvent) => {
			if (e.code !== "Space") return;
			spaceRef.current = false;
			setSpaceHeld(false);
		};
		const reset = () => {
			spaceRef.current = false;
			setSpaceHeld(false);
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("blur", reset);
		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			window.removeEventListener("blur", reset);
		};
	}, []);

	return { spaceHeld };
}
