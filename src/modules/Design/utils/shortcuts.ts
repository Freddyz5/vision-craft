const isApple = () =>
	typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * A shortcut as the person's keyboard spells it: "⌘D" / "⌘⇧L" on Apple
 * keyboards, "Ctrl+D" / "Ctrl+Mayús+L" elsewhere. One spelling everywhere
 * (tooltips, menus) instead of each place writing its own.
 */
export function shortcut(key: string, { shift = false }: { shift?: boolean } = {}): string {
	return isApple() ? `⌘${shift ? "⇧" : ""}${key}` : `Ctrl+${shift ? "Mayús+" : ""}${key}`;
}
