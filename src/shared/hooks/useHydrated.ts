import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false on the server and during the hydration render, true right after.
 * Gate anything derived from localStorage with it in a `client:load` island:
 * the server can't read the browser's storage, so the first client render
 * must match the server HTML before showing the stored state.
 */
export function useHydrated(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}
