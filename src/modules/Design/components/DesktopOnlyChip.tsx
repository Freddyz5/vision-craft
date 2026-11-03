import { useEffect, useId, useRef, useState } from "react";
import { Monitor, X } from "lucide-react";

/**
 * What the editor does on a computer but not on a phone. Each feature that
 * ships desktop-only adds its line here, so mobile always says what's missing.
 */
export const DESKTOP_ONLY_FEATURES = [
	"Seleccionar varios elementos a la vez",
	"Alinear y repartir",
	"Duplicar, y Alt + arrastrar para copiar",
	"Pegar imágenes copiadas (Ctrl/⌘ + V)",
	"Atajos de teclado",
];

/**
 * Mobile only: the last chip of the docked item toolbar. It opens a small,
 * non-blocking note above the bar listing what else the editor does on a
 * computer, instead of those tools silently not being there.
 */
export function DesktopOnlyChip() {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const close = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", close);
		return () => document.removeEventListener("pointerdown", close);
	}, [open]);

	return (
		<div ref={rootRef} className="flex shrink-0 items-center">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls={panelId}
				className="text-df-primary dark:text-df-primary-dark bg-df-primary/10 dark:bg-df-primary-dark/15 focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap focus-visible:outline-2"
			>
				<Monitor className="h-4 w-4" aria-hidden="true" />
				Más en computadora
			</button>

			{/* Fixed, so the toolbar's horizontal scroll can't clip it. */}
			{open && (
				<div
					id={panelId}
					role="note"
					className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark fixed inset-x-3 bottom-20 z-40 rounded-2xl border p-4 shadow-[0_12px_32px_-12px_rgb(17_24_39/0.35)]"
				>
					<div className="mb-2 flex items-start justify-between gap-3">
						<p className="text-df-ink dark:text-df-ink-dark text-sm font-bold">
							En una computadora también puedes:
						</p>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Cerrar"
							className="text-df-muted dark:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark -mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>
					<ul className="text-df-muted dark:text-df-muted-dark list-disc space-y-1 pl-5 text-sm">
						{DESKTOP_ONLY_FEATURES.map((feature) => (
							<li key={feature}>{feature}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
