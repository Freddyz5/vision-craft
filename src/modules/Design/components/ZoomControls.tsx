import { Minus, Plus } from "lucide-react";

interface ZoomControlsProps {
	zoom: number;
	onZoomOut: () => void;
	onZoomIn: () => void;
	onReset: () => void;
}

export function ZoomControls({ zoom, onZoomOut, onZoomIn, onReset }: ZoomControlsProps) {
	return (
		<nav
			aria-label="Zoom del lienzo"
			className="bg-base-100/90 dark:bg-df-surface-dark/95 border-base-200 absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-xl border p-1.5 shadow-md backdrop-blur-xs dark:border-gray-800"
		>
			<button
				type="button"
				onClick={onZoomOut}
				className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
				title="Alejar"
			>
				<Minus className="h-3.5 w-3.5" aria-hidden="true" />
			</button>
			<span className="text-df-ink dark:text-df-ink-dark min-w-[40px] px-1 text-center text-xs font-semibold select-none">
				{Math.round(zoom * 100)}%
			</span>
			<button
				type="button"
				onClick={onZoomIn}
				className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
				title="Acercar"
			>
				<Plus className="h-3.5 w-3.5" aria-hidden="true" />
			</button>
			<button
				type="button"
				onClick={onReset}
				className="btn btn-xs btn-ghost text-df-primary dark:text-df-primary-dark text-[10px] font-bold uppercase"
				title="100%"
			>
				100%
			</button>
		</nav>
	);
}
