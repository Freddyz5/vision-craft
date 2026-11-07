import { useLayoutEffect, type RefObject } from "react";

/**
 * Shift an absolutely placed element (a floating toolbar) sideways so it
 * stays inside its nearest scrolling ancestor, the sheet's viewport:
 * whatever sticks out on the left there can't be scrolled to. Runs after
 * every render, since the element moves with the selection and the zoom.
 */
export function useKeepInView(ref: RefObject<HTMLElement | null>, enabled: boolean) {
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.marginLeft = "";
		if (!enabled) return;
		let clipper = el.parentElement;
		while (clipper && getComputedStyle(clipper).overflowX === "visible") {
			clipper = clipper.parentElement;
		}
		if (!clipper) return;
		const clip = clipper.getBoundingClientRect();
		const rect = el.getBoundingClientRect();
		const gap = 8;
		const shift =
			rect.left < clip.left + gap
				? clip.left + gap - rect.left
				: rect.right > clip.right - gap
					? clip.right - gap - rect.right
					: 0;
		if (shift) el.style.marginLeft = `${shift}px`;
	});
}
