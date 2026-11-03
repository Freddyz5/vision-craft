import { useEffect, useRef } from "react";
import { copyItems, hasCopiedItems, pasteCopiedItems } from "../utils/editorClipboard";
import { isTypingTarget } from "./useEditorShortcuts";

interface UseEditorClipboardOptions {
	selectedIds: string[];
	onSelect: (ids: string[]) => void;
	/** An image pasted from the system clipboard (a screenshot, a copied photo). */
	onPasteImage?: (file: File) => void;
}

/**
 * Ctrl/Cmd+C and Ctrl/Cmd+V for the editor, through the copy/paste events
 * so they never fight a text field. Copying also puts a short note on the
 * system clipboard: if the person later copies an image elsewhere, the
 * next paste brings that image instead of the older copied items.
 */
export function useEditorClipboard({
	selectedIds,
	onSelect,
	onPasteImage,
}: UseEditorClipboardOptions) {
	const latest = useRef({ selectedIds, onSelect, onPasteImage });
	useEffect(() => {
		latest.current = { selectedIds, onSelect, onPasteImage };
	});

	useEffect(() => {
		const handleCopy = (e: ClipboardEvent) => {
			const { selectedIds } = latest.current;
			// Leave text fields and any selected page text to the browser.
			if (isTypingTarget(e.target) || window.getSelection()?.toString()) return;
			const count = copyItems(selectedIds);
			if (count === 0) return;
			e.preventDefault();
			e.clipboardData?.setData(
				"text/plain",
				count === 1 ? "1 elemento de Vision Craft" : `${count} elementos de Vision Craft`,
			);
		};

		const handlePaste = (e: ClipboardEvent) => {
			if (isTypingTarget(e.target)) return;
			const { onSelect, onPasteImage } = latest.current;
			const image = Array.from(e.clipboardData?.files ?? []).find((f) =>
				f.type.startsWith("image/"),
			);
			if (image && onPasteImage) {
				e.preventDefault();
				onPasteImage(image);
				return;
			}
			if (hasCopiedItems()) {
				e.preventDefault();
				onSelect(pasteCopiedItems());
			}
		};

		document.addEventListener("copy", handleCopy);
		document.addEventListener("paste", handlePaste);
		return () => {
			document.removeEventListener("copy", handleCopy);
			document.removeEventListener("paste", handlePaste);
		};
	}, []);
}
