import { persistentAtom } from "@nanostores/persistent";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CanvasPresetId =
	| "a4-portrait"
	| "a4-landscape"
	| "a3-portrait"
	| "a3-landscape"
	| "us-letter"
	| "poster-small"
	| "poster-large"
	| "square-mini"
	| "custom";

export interface CanvasConfig {
	presetId: CanvasPresetId;
	/** Width in millimetres (always stored in mm internally) */
	widthMm: number;
	/** Height in millimetres */
	heightMm: number;
	orientation: "portrait" | "landscape";
	name: string;
}

export interface CanvasItem {
	/** Unique identifier – crypto.randomUUID() */
	id: string;
	type?: "image" | "text";
	imageSrc?: string;
	alt?: string;
	text?: string;
	fontSize?: number;
	fillColor?: string;
	fontFamily?: string;
	fontStyle?: string;
	/** Position & size in logical Stage pixels (96 dpi basis) */
	x: number;
	y: number;
	width: number;
	height: number;
	/** Rotation in degrees */
	rotation: number;
	/** Higher = on top */
	zIndex: number;
}

export interface SavedCanvas {
	id: string;
	name: string;
	/** ISO 8601 timestamp */
	createdAt: string;
	/** Thumbnail as a data-URL (optional, generated when saving from the Stage) */
	thumbnail?: string;
	config: CanvasConfig;
	items: CanvasItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: CanvasConfig = {
	presetId: "a4-portrait",
	widthMm: 210,
	heightMm: 297,
	orientation: "portrait",
	name: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistent atoms
// ─────────────────────────────────────────────────────────────────────────────

const encode = JSON.stringify;
const decode = JSON.parse;

/** Configuration of the currently active canvas (Módulo Canvas → /canvas) */
export const activeCanvasConfigStore = persistentAtom<CanvasConfig>(
	"vc-canvas-config",
	DEFAULT_CONFIG,
	{ encode, decode },
);

/** Items placed on the active canvas (Módulo Design → /design) */
export const activeCanvasItemsStore = persistentAtom<CanvasItem[]>("vc-canvas-items", [], {
	encode,
	decode,
});

/** List of saved canvases (max 20) */
export const savedCanvasesStore = persistentAtom<SavedCanvas[]>("vc-saved-canvases", [], {
	encode,
	decode,
});

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reset the active canvas to a blank state so the user can start a brand-new
 * board. Does not touch the saved list nor the Explore image selection.
 */
export function startNewCanvas(): void {
	activeCanvasConfigStore.set({ ...DEFAULT_CONFIG });
	activeCanvasItemsStore.set([]);
}

/** Save the current active canvas to the saved list */
export function saveCurrentCanvas(thumbnail?: string): SavedCanvas {
	const config = activeCanvasConfigStore.get();
	const items = activeCanvasItemsStore.get();
	const saved = savedCanvasesStore.get();

	// Check whether we are updating an existing save
	const existing = saved.find((c) => c.name === config.name);

	if (existing) {
		const updated: SavedCanvas = {
			...existing,
			config,
			items,
			thumbnail,
		};
		savedCanvasesStore.set(saved.map((c) => (c.id === existing.id ? updated : c)));
		return updated;
	}

	const newCanvas: SavedCanvas = {
		id: crypto.randomUUID(),
		name: config.name || `Lienzo ${new Date().toLocaleDateString("es-MX")}`,
		createdAt: new Date().toISOString(),
		thumbnail,
		config,
		items,
	};

	const capped = [newCanvas, ...saved].slice(0, 20);
	savedCanvasesStore.set(capped);
	return newCanvas;
}

/**
 * Persist the active canvas automatically (used when advancing to the Export
 * step without pressing "Guardar"). Skips empty boards, and gives an unnamed
 * board a stable name up-front so repeated auto-saves update the same entry
 * instead of creating duplicates. Returns the saved board, or null if there
 * was nothing to save.
 */
export function autoSaveActiveCanvas(thumbnail?: string): SavedCanvas | null {
	const items = activeCanvasItemsStore.get();
	if (items.length === 0) return null;

	const config = activeCanvasConfigStore.get();
	if (!config.name.trim()) {
		activeCanvasConfigStore.set({
			...config,
			name: `Lienzo ${new Date().toLocaleDateString("es-MX")}`,
		});
	}

	return saveCurrentCanvas(thumbnail);
}

/** Load a saved canvas into the active stores */
export function loadCanvas(id: string): void {
	const canvas = savedCanvasesStore.get().find((c) => c.id === id);
	if (!canvas) return;
	activeCanvasConfigStore.set(canvas.config);
	activeCanvasItemsStore.set(canvas.items);
}

/** Duplicate a saved canvas */
export function duplicateCanvas(id: string): void {
	const canvas = savedCanvasesStore.get().find((c) => c.id === id);
	if (!canvas) return;
	const copy: SavedCanvas = {
		...canvas,
		id: crypto.randomUUID(),
		name: `${canvas.name} (copia)`,
		createdAt: new Date().toISOString(),
	};
	const saved = savedCanvasesStore.get();
	savedCanvasesStore.set([copy, ...saved].slice(0, 20));
}

/** Delete a canvas from the saved list */
export function deleteCanvas(id: string): void {
	savedCanvasesStore.set(savedCanvasesStore.get().filter((c) => c.id !== id));
}

// ── Canvas Items ─────────────────────────────────────────────────────────────

/** Add an image item to the active canvas */
export function addItem(item: CanvasItem): void {
	activeCanvasItemsStore.set([...activeCanvasItemsStore.get(), item]);
}

/** Remove an image item from the active canvas */
export function removeItem(id: string): void {
	activeCanvasItemsStore.set(activeCanvasItemsStore.get().filter((i) => i.id !== id));
}

/** Update properties of an existing canvas item */
export function updateItem(id: string, patch: Partial<CanvasItem>): void {
	activeCanvasItemsStore.set(
		activeCanvasItemsStore.get().map((i) => (i.id === id ? { ...i, ...patch } : i)),
	);
}

/** Bring an item to the front (max zIndex + 1) */
export function bringToFront(id: string): void {
	const items = activeCanvasItemsStore.get();
	const maxZ = Math.max(0, ...items.map((i) => i.zIndex));
	updateItem(id, { zIndex: maxZ + 1 });
}

/** Send an item to the back (min zIndex - 1) */
export function sendToBack(id: string): void {
	const items = activeCanvasItemsStore.get();
	const minZ = Math.min(0, ...items.map((i) => i.zIndex));
	updateItem(id, { zIndex: minZ - 1 });
}

/** Clear all items from the active canvas */
export function clearActiveCanvas(): void {
	activeCanvasItemsStore.set([]);
}

// ── JSON Import / Export ─────────────────────────────────────────────────────

/** Trigger browser download of the canvas as a JSON file */
export function exportJson(canvas: SavedCanvas): void {
	const json = JSON.stringify(canvas, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `canvas-${canvas.name.replace(/\s+/g, "-").toLowerCase()}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/** Parse a JSON file and load it as the active canvas */
export async function importJson(file: File): Promise<void> {
	const text = await file.text();
	const canvas = JSON.parse(text) as SavedCanvas;

	// Basic validation
	if (!canvas.config || !Array.isArray(canvas.items)) {
		throw new Error("Archivo JSON inválido: falta config o items.");
	}

	activeCanvasConfigStore.set(canvas.config);
	activeCanvasItemsStore.set(canvas.items);
}

/**
 * Parse a JSON file exported with {@link exportJson} and add it to the saved
 * boards library (a fresh id is always assigned so importing never overwrites
 * an existing board). Returns the stored board.
 */
export async function importCanvasToLibrary(file: File): Promise<SavedCanvas> {
	const text = await file.text();
	const parsed = JSON.parse(text) as Partial<SavedCanvas>;

	// Basic validation
	if (!parsed.config || !Array.isArray(parsed.items)) {
		throw new Error("Archivo JSON inválido: falta config o items.");
	}

	const saved = savedCanvasesStore.get();
	const imported: SavedCanvas = {
		id: crypto.randomUUID(),
		name: parsed.name?.trim() || `Tablero importado ${new Date().toLocaleDateString("es-MX")}`,
		createdAt: new Date().toISOString(),
		thumbnail: parsed.thumbnail,
		config: parsed.config,
		items: parsed.items,
	};

	savedCanvasesStore.set([imported, ...saved].slice(0, 20));
	return imported;
}
