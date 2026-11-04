import type React from "react";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface PrintPreviewModalProps {
	open: boolean;
	title: string;
	html: string | null;
	loaded: boolean;
	iframeRef: React.RefObject<HTMLIFrameElement | null>;
	onIframeLoad: () => void;
	onPrint: () => void;
	onClose: () => void;
}

/**
 * A native modal <dialog>: the browser keeps focus inside, makes the page
 * behind inert, closes on Esc and returns focus to the print button.
 */
export function PrintPreviewModal({
	open,
	title,
	html,
	loaded,
	iframeRef,
	onIframeLoad,
	onPrint,
	onClose,
}: PrintPreviewModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	}, [open]);

	// Keys pressed inside the preview stay in the iframe's own window.
	useEffect(() => {
		const win = iframeRef.current?.contentWindow;
		if (!loaded || !win) return;
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		win.addEventListener("keydown", closeOnEscape);
		return () => win.removeEventListener("keydown", closeOnEscape);
	}, [loaded, iframeRef, onClose]);

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby={titleId}
			onClose={onClose}
			className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark backdrop:bg-df-bg/80 dark:backdrop:bg-df-bg-dark/80 m-auto h-[85vh] w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-3xl border shadow-2xl backdrop:backdrop-blur-sm"
		>
			{open && (
				<div className="flex h-full flex-col">
					<div className="border-df-hairline dark:border-df-hairline-dark flex shrink-0 items-center justify-between gap-3 border-b p-4 sm:p-6">
						<div className="min-w-0">
							<h2
								id={titleId}
								className="text-df-ink dark:text-df-ink-dark truncate text-lg font-bold sm:text-xl"
							>
								{title}
							</h2>
							<p className="text-df-muted dark:text-df-muted-dark mt-1 hidden text-sm sm:block">
								Revisa la vista previa y luego imprime o guarda como PDF.
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<button
								type="button"
								onClick={onPrint}
								disabled={!loaded}
								className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark dark:text-df-on-primary-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-full bg-gradient-to-r px-4 py-2 text-sm font-bold text-white transition-all duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
							>
								<span className="sm:hidden">Imprimir</span>
								<span className="hidden sm:inline">Imprimir / Guardar PDF</span>
							</button>
							<button
								type="button"
								onClick={onClose}
								className="bg-df-well dark:bg-df-well-dark hover:bg-df-hairline dark:hover:bg-df-hairline-dark text-df-ink dark:text-df-ink-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-full p-2.5 transition-colors focus-visible:outline-2"
								aria-label="Cerrar vista previa"
							>
								<X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
							</button>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900">
						<div className="relative min-h-0 flex-1">
							{html && (
								<iframe
									ref={iframeRef}
									title="Vista previa de impresión"
									className="h-full w-full"
									srcDoc={html}
									onLoad={onIframeLoad}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</dialog>
	);
}
