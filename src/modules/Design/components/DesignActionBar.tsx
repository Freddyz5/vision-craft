import { ArrowRight, Undo2, Redo2 } from "lucide-react";

interface DesignActionBarProps {
	onSave: () => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	isCanvasView: boolean;
	onToggleView: () => void;
}

export function DesignActionBar({
	onSave,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	isCanvasView,
	onToggleView,
}: DesignActionBarProps) {
	return (
		<article className="flex w-full justify-center gap-3">
			<button
				onClick={onUndo}
				disabled={!canUndo}
				className="btn btn-outline btn-circle"
				title="Deshacer (Ctrl+Z)"
				aria-label="Deshacer"
			>
				<Undo2 className="h-4 w-4" aria-hidden="true" />
			</button>

			<button
				onClick={onRedo}
				disabled={!canRedo}
				className="btn btn-outline btn-circle"
				title="Rehacer (Ctrl+Shift+Z)"
				aria-label="Rehacer"
			>
				<Redo2 className="h-4 w-4" aria-hidden="true" />
			</button>

			<button
				onClick={onSave}
				className="bg-df-primary flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
			>
				Guardar
			</button>

			<a
				href="/export"
				className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 inline-flex items-center justify-center gap-3 rounded-full bg-linear-to-r px-8 py-2.5 text-base font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
			>
				Exportar
				<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
			</a>

			<button
				onClick={onToggleView}
				className={`flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${isCanvasView ? "bg-df-accent" : "bg-df-primary"}`}
			>
				{isCanvasView ? "Mis imagenes" : "Mis Lienzos"}
			</button>
		</article>
	);
}
