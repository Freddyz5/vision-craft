import { ArrowRight, CircleCheck, ListChecks } from "lucide-react";
import { useStore } from "@nanostores/react";
import { activeCanvasConfigStore } from "../../../shared/store/canvasStore";
import { paperLabel } from "../utils/paperLabel";

interface EditorHeaderProps {
	warningCount: number;
	/** Tablet only: opens the print list drawer. */
	onOpenList: () => void;
	/** Below lg, where the print list (and its Exportar) isn't on screen. */
	onExport: () => void;
	/** False on an empty sheet: there's nothing to export yet. */
	canExport: boolean;
}

/**
 * The editor's one-line header (an exception to the two-line step heading in
 * DESIGN.md): the step, the board's editable name, its paper and where it's
 * kept, leaving the rest of the screen to the sheet.
 */
export function EditorHeader({ warningCount, onOpenList, onExport, canExport }: EditorHeaderProps) {
	const config = useStore(activeCanvasConfigStore);

	return (
		<header className="border-df-hairline dark:border-df-hairline-dark bg-df-surface dark:bg-df-surface-dark flex h-12 min-w-0 items-center gap-3 border-b px-4">
			<h1 className="text-df-muted dark:text-df-muted-dark shrink-0 text-xs font-semibold">
				<span className="hidden sm:inline">Paso 03 · </span>Diseña
			</h1>
			<span
				className="bg-df-hairline dark:bg-df-hairline-dark h-5 w-px shrink-0"
				aria-hidden="true"
			/>
			<input
				type="text"
				value={config.name}
				onChange={(e) => activeCanvasConfigStore.set({ ...config, name: e.target.value })}
				placeholder="Mi visión"
				aria-label="Nombre del tablero"
				className="text-df-ink dark:text-df-ink-dark placeholder:text-df-muted dark:placeholder:text-df-muted-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark field-sizing-content max-w-[40vw] min-w-24 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-bold focus-visible:outline-2"
			/>
			<span className="text-df-muted dark:text-df-muted-dark hidden truncate text-xs sm:inline">
				{paperLabel(config)}
			</span>
			<span className="text-df-muted dark:text-df-muted-dark ml-auto hidden shrink-0 items-center gap-1.5 text-xs xl:flex">
				<CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
				Borrador guardado en este navegador
			</span>
			<button
				type="button"
				onClick={onOpenList}
				className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark ml-auto hidden shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 md:flex lg:hidden pointer-coarse:h-11"
			>
				<ListChecks className="h-4 w-4" aria-hidden="true" />
				Lista
				{warningCount > 0 && (
					<span className="bg-df-secondary dark:bg-df-secondary-dark text-df-ink rounded-full px-1.5 text-xs font-bold">
						{warningCount}
					</span>
				)}
			</button>
			{/* The step's way forward, in view below lg whatever is selected or open. */}
			<button
				type="button"
				onClick={onExport}
				disabled={!canExport}
				className="from-df-primary to-df-accent-strong dark:from-df-primary-dark dark:to-df-accent-dark dark:text-df-on-primary-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r px-4 text-sm font-bold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:ml-0 lg:hidden pointer-coarse:h-11"
			>
				Exportar
				<ArrowRight className="h-4 w-4" aria-hidden="true" />
			</button>
		</header>
	);
}
