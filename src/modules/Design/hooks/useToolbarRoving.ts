import { useEffect, useRef } from "react";
import { isTypingTarget } from "./useEditorShortcuts";

/**
 * The toolbar's own controls, in order: enabled, shown, and not inside an
 * open popover panel (`data-toolbar-panel`, see ToolPopover).
 */
function toolbarItems(toolbar: HTMLElement): HTMLElement[] {
	return Array.from(toolbar.querySelectorAll<HTMLElement>("button, select, input")).filter(
		(el) =>
			!(el as HTMLButtonElement).disabled &&
			!el.closest("[data-toolbar-panel]") &&
			el.getClientRects().length > 0,
	);
}

/**
 * Roving focus for a `role="toolbar"`, as the ARIA pattern promises: the
 * toolbar is one Tab stop (the control used last), and ←/→, Inicio and Fin
 * move between its controls. ↑/↓ stay with the control (a number field
 * steps, a select opens) and never reach the canvas, so a focused button
 * doesn't nudge the selection.
 */
export function useToolbarRoving<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const activeRef = useRef<HTMLElement | null>(null);

	// After every render: the controls change with the selection, and the
	// toolbar element itself is swapped (locked ↔ unlocked).
	useEffect(() => {
		const toolbar = ref.current;
		if (!toolbar) return;
		const sync = () => {
			const items = toolbarItems(toolbar);
			const last = activeRef.current;
			const active = last && items.includes(last) ? last : items[0];
			for (const el of items) el.tabIndex = el === active ? 0 : -1;
		};
		sync();

		const onFocusIn = (e: FocusEvent) => {
			const target = e.target as HTMLElement;
			if (!toolbarItems(toolbar).includes(target)) return;
			activeRef.current = target;
			sync();
		};
		const onKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const items = toolbarItems(toolbar);
			const index = items.indexOf(target);
			if (index === -1) return;
			let next: number | undefined;
			if (e.key === "ArrowRight") next = (index + 1) % items.length;
			else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
			else if (e.key === "Home") next = 0;
			else if (e.key === "End") next = items.length - 1;
			else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !isTypingTarget(target)) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			if (next === undefined) return;
			e.preventDefault();
			e.stopPropagation();
			items[next].focus();
		};
		toolbar.addEventListener("focusin", onFocusIn);
		toolbar.addEventListener("keydown", onKeyDown);
		return () => {
			toolbar.removeEventListener("focusin", onFocusIn);
			toolbar.removeEventListener("keydown", onKeyDown);
		};
	});

	return ref;
}
