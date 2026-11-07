import { atom } from "nanostores";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem } from "../store/canvasStore";

/**
 * The fonts a board's text can be set in (web fonts, so they look the same
 * on every device and on paper), named for what they feel like.
 */
export const TEXT_FONTS = [
	{ family: "Inter", label: "Moderna" },
	{ family: "Fraunces", label: "Clásica" },
	{ family: "Caveat", label: "A mano" },
] as const;

/** What each text font falls back to while it loads, or where it isn't installed. */
const FALLBACKS: Record<string, string> = {
	Inter: "system-ui, sans-serif",
	Fraunces: "Georgia, serif",
	Caveat: "cursive",
	// Offered before the web fonts; older boards may still use them.
	Georgia: "serif",
	"Courier New": "monospace",
	"Comic Sans MS": "cursive",
};

/**
 * The font list a canvas text is drawn and measured with: the chosen family,
 * then a close generic one, so a late or missing font never turns into the
 * browser's default serif.
 */
export function fontStack(family: string | undefined): string {
	const name = family || TEXT_DEFAULTS.fontFamily;
	return `${name}, ${FALLBACKS[name] ?? "sans-serif"}`;
}

/**
 * Bumps whenever the browser finishes loading fonts. A canvas measures and
 * paints its text once, so the shared render re-mounts text on a bump to
 * pick up a web font that arrived after the first paint.
 */
export const fontsLoadedStore = atom(0);

if (typeof document !== "undefined" && document.fonts) {
	document.fonts.addEventListener("loadingdone", () =>
		fontsLoadedStore.set(fontsLoadedStore.get() + 1),
	);
}

/** Load every font these items' texts use; resolves once they're ready (or failed). */
export async function loadItemFonts(items: CanvasItem[]): Promise<void> {
	if (typeof document === "undefined" || !document.fonts) return;
	const families = new Set(
		items.filter(isTextItem).map((item) => item.fontFamily || TEXT_DEFAULTS.fontFamily),
	);
	await Promise.all(
		[...families].map((family) => document.fonts.load(`16px "${family}"`).catch(() => [])),
	);
}
