import { atom } from "nanostores";
import type { CanvasItem } from "./canvasStore";
import { activeCanvasItemsStore } from "./canvasStore";

const MAX_HISTORY = 50;
const COALESCE_MS = 500;

export const historyPastStore = atom<CanvasItem[][]>([]);
export const historyFutureStore = atom<CanvasItem[][]>([]);

let isApplyingHistory = false;
let pendingSnapshot: CanvasItem[] | null = null;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

function commitPendingSnapshot(): void {
	if (coalesceTimer) {
		clearTimeout(coalesceTimer);
		coalesceTimer = null;
	}
	if (pendingSnapshot === null) return;

	const past = [...historyPastStore.get(), pendingSnapshot].slice(-MAX_HISTORY);
	historyPastStore.set(past);
	historyFutureStore.set([]);
	pendingSnapshot = null;
}

activeCanvasItemsStore.listen((_value, oldValue) => {
	if (isApplyingHistory) return;

	if (pendingSnapshot === null) {
		pendingSnapshot = oldValue;
	}
	if (coalesceTimer) clearTimeout(coalesceTimer);
	coalesceTimer = setTimeout(commitPendingSnapshot, COALESCE_MS);
});

/** Undo the last committed change (or the in-flight burst, if one is pending). */
export function undo(): void {
	commitPendingSnapshot();

	const past = historyPastStore.get();
	if (past.length === 0) return;

	const previous = past[past.length - 1];
	historyPastStore.set(past.slice(0, -1));
	historyFutureStore.set([...historyFutureStore.get(), activeCanvasItemsStore.get()]);

	isApplyingHistory = true;
	activeCanvasItemsStore.set(previous);
	isApplyingHistory = false;
}

/** Redo the last undone change. */
export function redo(): void {
	const future = historyFutureStore.get();
	if (future.length === 0) return;

	const next = future[future.length - 1];
	historyFutureStore.set(future.slice(0, -1));
	historyPastStore.set([...historyPastStore.get(), activeCanvasItemsStore.get()]);

	isApplyingHistory = true;
	activeCanvasItemsStore.set(next);
	isApplyingHistory = false;
}

/** Clear all undo/redo history — call when switching to a different loaded canvas. */
export function resetHistory(): void {
	if (coalesceTimer) {
		clearTimeout(coalesceTimer);
		coalesceTimer = null;
	}
	pendingSnapshot = null;
	historyPastStore.set([]);
	historyFutureStore.set([]);
}
