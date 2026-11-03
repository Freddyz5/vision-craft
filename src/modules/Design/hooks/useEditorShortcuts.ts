import { useEffect, useRef } from "react";
import {
	activeCanvasItemsStore,
	bringItemsToFront,
	duplicateItems,
	moveItemsOneLayer,
	removeItems,
	sendItemsToBack,
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

/** Keys and clipboard events aimed at a field belong to the field, not the canvas. */
export function isTypingTarget(target: EventTarget | null): boolean {
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
	onSelectAll: () => void;
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
	onSelectAll,
}: UseEditorShortcutsOptions) {
	// The listener is registered once and reads the latest options from here.
	const latest = useRef({ selectedIds, onClearSelection, onRemoved, onSelect, onSelectAll });
	useEffect(() => {
		latest.current = { selectedIds, onClearSelection, onRemoved, onSelect, onSelectAll };
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target)) return;
			const { selectedIds, onClearSelection, onRemoved, onSelect, onSelectAll } = latest.current;
			const key = e.key.toLowerCase();
			// Locked items can't be moved or removed from the keyboard either.
			const lockedIds = new Set(
				activeCanvasItemsStore
					.get()
					.filter((i) => i.locked)
					.map((i) => i.id),
			);
			const movable = selectedIds.filter((id) => !lockedIds.has(id));

			if (e.ctrlKey || e.metaKey) {
				// Layers by key position (Shift turns ] into } on most layouts).
				if ((e.code === "BracketRight" || e.code === "BracketLeft") && selectedIds.length > 0) {
					e.preventDefault();
					const up = e.code === "BracketRight";
					if (e.shiftKey) (up ? bringItemsToFront : sendItemsToBack)(selectedIds);
					else moveItemsOneLayer(selectedIds, up ? "up" : "down");
					return;
				}
				if (key === "l" && e.shiftKey && selectedIds.length > 0) {
					e.preventDefault();
					const lock = selectedIds.some((id) => !lockedIds.has(id));
					updateItems(
						Object.fromEntries(selectedIds.map((id) => [id, { locked: lock || undefined }])),
					);
					return;
				}
				if (key === "z") {
					e.preventDefault();
					if (e.shiftKey) redo();
					else undo();
				} else if (key === "y") {
					e.preventDefault();
					redo();
				} else if (key === "a") {
					e.preventDefault();
					onSelectAll();
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

			if (movable.length === 0) return;

			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				removeItems(movable);
				onClearSelection();
				onRemoved?.(movable.length);
				return;
			}

			const direction = ARROW_DIRECTIONS[e.key];
			if (!direction) return;
			// Keep the page from scrolling while nudging.
			e.preventDefault();
			const step = (e.shiftKey ? NUDGE_SHIFT_MM : NUDGE_MM) * MM_TO_PX;
			const selected = new Set(movable);
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
