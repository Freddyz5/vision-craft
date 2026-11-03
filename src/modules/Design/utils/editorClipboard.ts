import {
	activeCanvasItemsStore,
	DUPLICATE_OFFSET,
	insertItemCopies,
	type CanvasItem,
} from "../../../shared/store/canvasStore";

// Per tab, so a copy survives opening another board (a page load) but not
// closing the tab, and never leaks into other tabs' boards.
const STORAGE_KEY = "vc-editor-clipboard";

interface ClipboardContents {
	items: CanvasItem[];
	/** Each paste lands one step further from the originals. */
	pastes: number;
}

function read(): ClipboardContents | null {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as ClipboardContents) : null;
	} catch {
		return null;
	}
}

function write(contents: ClipboardContents): void {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
	} catch {
		// Storage full or blocked: copying just doesn't stick.
	}
}

/** Copy the items with these ids. Returns how many were copied. */
export function copyItems(ids: string[]): number {
	const wanted = new Set(ids);
	const items = activeCanvasItemsStore.get().filter((i) => wanted.has(i.id));
	if (items.length > 0) write({ items, pastes: 0 });
	return items.length;
}

export function hasCopiedItems(): boolean {
	return (read()?.items.length ?? 0) > 0;
}

/** Paste the copied items onto the active board, cascading on every paste. Returns the new ids. */
export function pasteCopiedItems(): string[] {
	const contents = read();
	if (!contents?.items.length) return [];
	const pastes = contents.pastes + 1;
	write({ ...contents, pastes });
	return insertItemCopies(contents.items, DUPLICATE_OFFSET * pastes);
}
