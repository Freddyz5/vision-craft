import type React from "react";
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
	if (!open) return null;

	return (
		<div className="bg-df-bg/80 dark:bg-df-bg-dark/80 fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
			<div className="bg-df-surface dark:bg-df-surface-dark border-df-border dark:border-df-border-dark flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
				<div className="border-df-border dark:border-df-border-dark flex shrink-0 items-center justify-between gap-3 border-b p-4 sm:p-6">
					<div className="min-w-0">
						<h2 className="text-df-ink dark:text-df-ink-dark truncate text-lg font-bold sm:text-xl">
							{title}
						</h2>
						<p className="text-df-muted dark:text-df-muted-dark mt-1 hidden text-sm sm:block">
							Revisa la vista previa y luego imprime o guarda como PDF.
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<button
							onClick={onPrint}
							disabled={!loaded}
							className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark rounded-full bg-gradient-to-r px-4 py-2 text-sm font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
						>
							<span className="sm:hidden">Imprimir</span>
							<span className="hidden sm:inline">Imprimir / Guardar PDF</span>
						</button>
						<button
							onClick={onClose}
							className="bg-df-surface-alt dark:bg-df-surface-alt-dark hover:bg-df-border dark:hover:bg-df-border-dark text-df-ink dark:text-df-ink-dark rounded-full p-2.5 transition-colors"
							aria-label="Cerrar modal"
						>
							<X className="h-5 w-5" strokeWidth={2.5} />
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
		</div>
	);
}
