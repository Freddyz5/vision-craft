import { useEffect } from "react";
import { undo, redo } from "../../../shared/store/canvasHistory";

/** Global Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo) for the Design canvas. */
export function useUndoRedoShortcuts() {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
			if (!(e.ctrlKey || e.metaKey)) return;

			const key = e.key.toLowerCase();
			if (key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if ((key === "z" && e.shiftKey) || key === "y") {
				e.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
