import type React from "react";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";

interface SheetToolbarProps {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
	/** Screen px per real px of the printed sheet (1 = real size at 96 dpi). */
	realScale: number;
	onZoomOut: () => void;
	onZoomIn: () => void;
	onFit: () => void;
	onRealSize: () => void;
}

/** The thin bar over the sheet: history on the left, zoom on the right. */
export function SheetToolbar({
	canUndo,
	canRedo,
	onUndo,
	onRedo,
	realScale,
	onZoomOut,
	onZoomIn,
	onFit,
	onRealSize,
}: SheetToolbarProps) {
	return (
		<div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
			<div className="flex items-center gap-0.5">
				<BarButton label="Deshacer (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
					<Undo2 className="h-4 w-4" aria-hidden="true" />
				</BarButton>
				<BarButton label="Rehacer (Ctrl+Mayús+Z)" onClick={onRedo} disabled={!canRedo}>
					<Redo2 className="h-4 w-4" aria-hidden="true" />
				</BarButton>
			</div>

			<div className="flex items-center gap-0.5" role="group" aria-label="Zoom de la hoja">
				<BarButton label="Alejar" onClick={onZoomOut}>
					<Minus className="h-4 w-4" aria-hidden="true" />
				</BarButton>
				<button
					type="button"
					onClick={onFit}
					title="Ajustar la hoja a la pantalla"
					className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-8 rounded-full px-2.5 text-xs font-semibold tabular-nums focus-visible:outline-2"
				>
					<span className="sr-only">Ajustar · </span>
					{Math.round(realScale * 100)} %
				</button>
				<BarButton label="Acercar" onClick={onZoomIn}>
					<Plus className="h-4 w-4" aria-hidden="true" />
				</BarButton>
				<button
					type="button"
					onClick={onRealSize}
					className="text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark ml-1 hidden h-8 rounded-full px-2.5 text-xs font-semibold focus-visible:outline-2 sm:block"
				>
					Tamaño real
				</button>
			</div>
		</div>
	);
}

function BarButton({
	label,
	onClick,
	disabled,
	children,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			title={label}
			className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
		>
			{children}
		</button>
	);
}
