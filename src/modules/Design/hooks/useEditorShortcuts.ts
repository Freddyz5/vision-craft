import { useEffect, useRef } from "react";
import {
	activeCanvasItemsStore,
	duplicateItems,
	removeItems,
	updateItems,
	type CanvasItem,
} from "../../../shared/store/canvasStore";
import { undo, redo } from "../../../shared/store/canvasHistory";
import { MM_TO_PX } from "../../Canvas/constants/presets";

const ARROW_DIRECTIONS: Record<string, [number, number]> = {
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
	ArrowDown: [0, 1],
};

/** Arrow keys nudge by 1 mm, or 10 mm with Shift. */
const NUDGE_MM = 1;
const NUDGE_SHIFT_MM = 10;

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

interface UseEditorShortcutsOptions {
	/** Items the keys act on: the current selection. */
	selectedIds: string[];
	onClearSelection: () => void;
	/** After Supr/Retroceso removed `count` items (e.g. to offer "Deshacer"). */
	onRemoved?: (count: number) => void;
	/** Replace the selection, e.g. with the copies Ctrl/Cmd+D just made. */
	onSelect: (ids: string[]) => void;
}

/**
 * The Design editor's single keyboard listener. Every shortcut acts on the
 * whole selection through the store's batch mutations, so a nudge or a
 * delete is one undo step however many items are selected. Keys typed into
 * a field (text inputs, sliders, selects) are left alone.
 */
export function useEditorShortcuts({
	selectedIds,
	onClearSelection,
	onRemoved,
	onSelect,
}: UseEditorShortcutsOptions) {
	// The listener is registered once and reads the latest options from here.
	const latest = useRef({ selectedIds, onClearSelection, onRemoved, onSelect });
	useEffect(() => {
		latest.current = { selectedIds, onClearSelection, onRemoved, onSelect };
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target)) return;
			const { selectedIds, onClearSelection, onRemoved, onSelect } = latest.current;
			const key = e.key.toLowerCase();

			if (e.ctrlKey || e.metaKey) {
				if (key === "z") {
					e.preventDefault();
					if (e.shiftKey) redo();
					else undo();
				} else if (key === "y") {
					e.preventDefault();
					redo();
				} else if (key === "d" && selectedIds.length > 0) {
					// Also keeps the browser from bookmarking the page.
					e.preventDefault();
					onSelect(duplicateItems(selectedIds));
				}
				return;
			}

			if (e.key === "Escape") {
				onClearSelection();
				return;
			}

			if (selectedIds.length === 0) return;

			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				removeItems(selectedIds);
				onClearSelection();
				onRemoved?.(selectedIds.length);
				return;
			}

			const direction = ARROW_DIRECTIONS[e.key];
			if (!direction) return;
			// Keep the page from scrolling while nudging.
			e.preventDefault();
			const step = (e.shiftKey ? NUDGE_SHIFT_MM : NUDGE_MM) * MM_TO_PX;
			const selected = new Set(selectedIds);
			const patches: Record<string, Partial<CanvasItem>> = {};
			for (const item of activeCanvasItemsStore.get()) {
				if (!selected.has(item.id)) continue;
				patches[item.id] = { x: item.x + direction[0] * step, y: item.y + direction[1] * step };
			}
			updateItems(patches);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
