import { useState } from "react";

const DEFAULT_TITLE = "Imprimir / Guardar PDF";

/** UI state for the print-preview modal (open/closed, iframe srcDoc, load status). */
export function usePrintModal() {
	const [isOpen, setIsOpen] = useState(false);
	const [html, setHtml] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [title, setTitle] = useState(DEFAULT_TITLE);

	const open = (nextHtml: string, nextTitle: string = DEFAULT_TITLE) => {
		setTitle(nextTitle);
		setHtml(nextHtml);
		setLoaded(false);
		setIsOpen(true);
	};

	const close = () => {
		setIsOpen(false);
		setHtml(null);
		setLoaded(false);
	};

	return { isOpen, html, loaded, title, open, close, setLoaded };
}
