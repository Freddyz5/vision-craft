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
	/**
	 * Images only: the visible part of the source photo, as fractions (0–1)
	 * of its natural size, so it survives the photo URL changing resolution.
	 * Absent = the whole photo. The item's width/height is the cropped box.
	 */
	crop?: ImageCrop;
	/** Images only: the mask the photo is cut to. Absent = rectangle. */
	shape?: ImageShape;
	/** Images only: look adjustments, applied when drawing; the photo itself is never changed. */
	adjust?: ImageAdjust;
	/** Images only: border, polaroid card and shadow. */
	frame?: ImageFrame;
}

export interface ImageFrame {
	/** Border thickness in mm (0 or absent = none), drawn inside the photo's outline. */
	borderMm?: number;
	borderColor?: string;
	/** A white card around the photo, wider at the bottom; the photo fills its window. */
	polaroid?: boolean;
	/** Soft drop shadow under the photo. */
	shadow?: boolean;
}

export interface ImageAdjust {
	/** 0–1 (default 1). */
	opacity?: number;
	flipX?: boolean;
	flipY?: boolean;
	filter?: "bw" | "sepia";
	/** -0.5…0.5, Konva Brighten. */
	brightness?: number;
	/** -50…50, Konva Contrast. */
	contrast?: number;
	/** Blur radius as a fraction of the photo's width (0–0.02). */
	blur?: number;
}

/** `radius`: corner radius as a fraction (0–0.5) of the box's shorter side. */
export type ImageShape =
	{ kind: "circle" } | { kind: "rounded"; radius: number } | { kind: "heart" };

export interface ImageCrop {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Text styling used when an item doesn't set its own (editor, export and print share it). */
export const TEXT_DEFAULTS = {
	fontSize: 24,
	fontFamily: "Inter",
	fillColor: "#7C3AED",
	fontStyle: "normal",
	lineHeight: 1,
} as const;

/** Older saves have no `type`; an item with text and no image is a text item. */
export function isTextItem(item: CanvasItem): boolean {
	return item.type === "text" || (!!item.text && !item.imageSrc);
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

/** List of saved canvases (max {@link MAX_SAVED_CANVASES}) */
export const savedCanvasesStore = persistentAtom<SavedCanvas[]>("vc-saved-canvases", [], {
	encode,
	decode,
});

/**
 * Which saved board the active canvas is: its id once saved or loaded, null
 * for a board that was never saved. Saving matches on this, not on the name,
 * so renaming a board updates it and two boards may share a name. undefined
 * (key absent) only for sessions from before this was tracked.
 */
export const activeCanvasIdStore = persistentAtom<string | null | undefined>(
	"vc-canvas-id",
	undefined,
	{ encode, decode },
);

/**
 * Whether the active canvas, as it is now, was downloaded or printed from
 * Export (drives the "Exporta" step's check mark). Any edit makes it stale.
 */
export const activeCanvasExportedStore = persistentAtom<boolean>("vc-canvas-exported", false, {
	encode,
	decode,
});

activeCanvasItemsStore.listen(() => activeCanvasExportedStore.set(false));
activeCanvasConfigStore.listen(() => activeCanvasExportedStore.set(false));

/** Call when the active canvas was downloaded or sent to print. */
export function markActiveCanvasExported(): void {
	activeCanvasExportedStore.set(true);
}

/** Saved boards live in localStorage; past this many, saving asks to delete one first. */
export const MAX_SAVED_CANVASES = 20;

/** "full": the library already holds MAX_SAVED_CANVASES boards, nothing was stored. */
export type SaveResult =
	{ status: "created" | "updated"; canvas: SavedCanvas } | { status: "full" };

function defaultCanvasName(): string {
	return `Lienzo ${new Date().toLocaleDateString("es-MX")}`;
}

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
	activeCanvasIdStore.set(null);
}

/**
 * Save the active canvas to the library: updates the board it was loaded
 * from or last saved as, otherwise adds a new one (an unnamed board gets a
 * dated name first). Never drops an existing board to make room.
 */
export function saveCurrentCanvas(thumbnail?: string): SaveResult {
	let config = activeCanvasConfigStore.get();
	if (!config.name.trim()) {
		config = { ...config, name: defaultCanvasName() };
		activeCanvasConfigStore.set(config);
	}
	const items = activeCanvasItemsStore.get();
	const saved = savedCanvasesStore.get();
	const activeId = activeCanvasIdStore.get();
	const existing =
		activeId === undefined
			? // Pre-tracking session: fall back to the old match by name, once.
				saved.find((c) => c.name === config.name)
			: saved.find((c) => c.id === activeId);

	if (existing) {
		const updated: SavedCanvas = {
			...existing,
			name: config.name,
			config,
			items,
			// Saving from outside the stage (e.g. the stepper) has no fresh thumbnail.
			thumbnail: thumbnail ?? existing.thumbnail,
		};
		savedCanvasesStore.set(saved.map((c) => (c.id === existing.id ? updated : c)));
		activeCanvasIdStore.set(existing.id);
		return { status: "updated", canvas: updated };
	}

	if (saved.length >= MAX_SAVED_CANVASES) return { status: "full" };

	const created: SavedCanvas = {
		id: crypto.randomUUID(),
		name: config.name,
		createdAt: new Date().toISOString(),
		thumbnail,
		config,
		items,
	};
	savedCanvasesStore.set([created, ...saved]);
	activeCanvasIdStore.set(created.id);
	return { status: "created", canvas: created };
}

/**
 * Persist the active canvas automatically (used when advancing to the Export
 * step without pressing "Guardar"). Skips empty boards; returns null when
 * there was nothing to save.
 */
export function autoSaveActiveCanvas(thumbnail?: string): SaveResult | null {
	if (activeCanvasItemsStore.get().length === 0) return null;
	return saveCurrentCanvas(thumbnail);
}

/** Load a saved canvas into the active stores */
export function loadCanvas(id: string): void {
	const canvas = savedCanvasesStore.get().find((c) => c.id === id);
	if (!canvas) return;
	activeCanvasConfigStore.set(canvas.config);
	activeCanvasItemsStore.set(canvas.items);
	activeCanvasIdStore.set(canvas.id);
}

/** Duplicate a saved canvas. Returns false when the library is full. */
export function duplicateCanvas(id: string): boolean {
	const saved = savedCanvasesStore.get();
	const canvas = saved.find((c) => c.id === id);
	if (!canvas || saved.length >= MAX_SAVED_CANVASES) return false;
	const copy: SavedCanvas = {
		...canvas,
		id: crypto.randomUUID(),
		name: `${canvas.name} (copia)`,
		createdAt: new Date().toISOString(),
	};
	savedCanvasesStore.set([copy, ...saved]);
	return true;
}

/** Delete a canvas from the saved list */
export function deleteCanvas(id: string): void {
	savedCanvasesStore.set(savedCanvasesStore.get().filter((c) => c.id !== id));
	// The active canvas keeps its content but is no longer a saved board.
	if (activeCanvasIdStore.get() === id) activeCanvasIdStore.set(null);
}

// ── Canvas Items ─────────────────────────────────────────────────────────────

/** Add an image item to the active canvas */
export function addItem(item: CanvasItem): void {
	activeCanvasItemsStore.set([...activeCanvasItemsStore.get(), item]);
}

// The batch mutations below write the store exactly once: canvasHistory
// records one undo step per burst of writes, and every write is also a
// localStorage write, so acting on a whole selection stays a single step.

/** Remove an image item from the active canvas */
export function removeItem(id: string): void {
	removeItems([id]);
}

/** Remove several items in one write. */
export function removeItems(ids: string[]): void {
	const doomed = new Set(ids);
	activeCanvasItemsStore.set(activeCanvasItemsStore.get().filter((i) => !doomed.has(i.id)));
}

/** Update properties of an existing canvas item */
export function updateItem(id: string, patch: Partial<CanvasItem>): void {
	updateItems({ [id]: patch });
}

/** Patch several items in one write, keyed by item id. */
export function updateItems(patches: Record<string, Partial<CanvasItem>>): void {
	activeCanvasItemsStore.set(
		activeCanvasItemsStore.get().map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i)),
	);
}

/** How far (logical px) a duplicate lands from its original. */
export const DUPLICATE_OFFSET = 20;

/**
 * Copy `ids` in one write: each copy gets a new id, is shifted by `offset`
 * and goes on top of everything, keeping the originals' stacking order.
 * Returns the new ids in that same order.
 */
export function duplicateItems(ids: string[], offset = DUPLICATE_OFFSET): string[] {
	const wanted = new Set(ids);
	return insertItemCopies(
		activeCanvasItemsStore.get().filter((i) => wanted.has(i.id)),
		offset,
	);
}

/**
 * Add copies of `originals` (from this board or another one, e.g. the
 * editor's clipboard) in one write, shifted by `offset` and stacked on top
 * in their original order. Returns the new ids.
 */
export function insertItemCopies(originals: CanvasItem[], offset: number): string[] {
	const items = activeCanvasItemsStore.get();
	const maxZ = Math.max(0, ...items.map((i) => i.zIndex));
	const copies = [...originals]
		.sort((a, b) => a.zIndex - b.zIndex)
		.map((item, rank) => ({
			...item,
			id: crypto.randomUUID(),
			x: item.x + offset,
			y: item.y + offset,
			zIndex: maxZ + 1 + rank,
		}));
	activeCanvasItemsStore.set([...items, ...copies]);
	return copies.map((c) => c.id);
}

/** Bring an item to the front (max zIndex + 1) */
export function bringToFront(id: string): void {
	bringItemsToFront([id]);
}

/** Send an item to the back (min zIndex - 1) */
export function sendToBack(id: string): void {
	sendItemsToBack([id]);
}

/** Put `ids` above everything else, keeping their order among themselves. One write. */
export function bringItemsToFront(ids: string[]): void {
	const items = activeCanvasItemsStore.get();
	const wanted = new Set(ids);
	const maxZ = Math.max(0, ...items.map((i) => i.zIndex));
	const moving = items.filter((i) => wanted.has(i.id)).sort((a, b) => a.zIndex - b.zIndex);
	updateItems(
		Object.fromEntries(moving.map((item, rank) => [item.id, { zIndex: maxZ + 1 + rank }])),
	);
}

/** Put `ids` below everything else, keeping their order among themselves. One write. */
export function sendItemsToBack(ids: string[]): void {
	const items = activeCanvasItemsStore.get();
	const wanted = new Set(ids);
	const minZ = Math.min(0, ...items.map((i) => i.zIndex));
	const moving = items.filter((i) => wanted.has(i.id)).sort((a, b) => a.zIndex - b.zIndex);
	updateItems(
		Object.fromEntries(
			moving.map((item, rank) => [item.id, { zIndex: minZ - moving.length + rank }]),
		),
	);
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
	activeCanvasIdStore.set(null);
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
	if (saved.length >= MAX_SAVED_CANVASES) {
		throw new Error(
			`Ya tienes ${MAX_SAVED_CANVASES} tableros guardados. Elimina uno para importar otro.`,
		);
	}
	const imported: SavedCanvas = {
		id: crypto.randomUUID(),
		name: parsed.name?.trim() || `Tablero importado ${new Date().toLocaleDateString("es-MX")}`,
		createdAt: new Date().toISOString(),
		thumbnail: parsed.thumbnail,
		config: parsed.config,
		items: parsed.items,
	};

	savedCanvasesStore.set([imported, ...saved]);
	return imported;
}
