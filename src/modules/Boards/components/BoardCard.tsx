import { Copy, FileDown, ImageOff, Pencil, Trash2 } from "lucide-react";
import {
	deleteCanvas,
	duplicateCanvas,
	exportJson,
	loadCanvas,
} from "../../../shared/store/canvasStore";
import type { SavedCanvas } from "../types";

interface Props {
	board: SavedCanvas;
	/** Notify the parent so it can surface a toast. */
	onNotify?: (message: string) => void;
}

/**
 * A single saved board in the Boards library. Mirrors the Design module's
 * CanvasCard but adds "Descargar JSON" and opens the board in the editor when
 * loaded (this card lives outside the Design canvas view).
 */
const BoardCard = ({ board, onNotify }: Props) => {
	const handleOpen = () => {
		loadCanvas(board.id);
		onNotify?.("Tablero cargado. Abriendo el editor…");
		window.location.href = "/design";
	};

	const handleExport = () => {
		exportJson(board);
		onNotify?.("Descarga de JSON iniciada.");
	};

	const handleDuplicate = () => {
		duplicateCanvas(board.id);
		onNotify?.("Tablero duplicado.");
	};

	const handleDelete = () => {
		if (confirm(`¿Eliminar el tablero "${board.name}"?`)) {
			deleteCanvas(board.id);
			onNotify?.("Tablero eliminado.");
		}
	};

	return (
		<li className="border-df-primary/40 dark:border-df-primary-dark/40 bg-df-surface dark:bg-df-surface-dark flex flex-col overflow-hidden rounded-2xl border-2 shadow-sm">
			{board.thumbnail ? (
				<img
					src={board.thumbnail}
					alt={`Vista previa de ${board.name}`}
					className="h-40 w-full bg-gray-100 object-contain dark:bg-gray-800"
				/>
			) : (
				<div className="text-df-muted dark:text-df-muted-dark flex h-40 w-full items-center justify-center gap-2 bg-gray-100 text-xs dark:bg-gray-800">
					<ImageOff className="h-4 w-4" aria-hidden="true" />
					Sin vista previa
				</div>
			)}

			<div className="flex flex-1 flex-col gap-1 p-4">
				<h3 className="text-df-ink dark:text-df-ink-dark truncate text-base font-bold">
					{board.name}
				</h3>
				<p className="text-df-muted dark:text-df-muted-dark text-xs">
					{new Date(board.createdAt).toLocaleDateString("es-MX")} • {board.items.length} elementos
				</p>
				<p className="text-df-muted dark:text-df-muted-dark text-xs">
					{board.config.widthMm} × {board.config.heightMm} mm
				</p>

				<div className="mt-3 flex items-center gap-2">
					<button
						onClick={handleOpen}
						className="bg-df-primary flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
					>
						<Pencil className="h-4 w-4" aria-hidden="true" />
						Abrir
					</button>

					<button
						onClick={handleExport}
						className="text-df-ink dark:text-df-ink-dark cursor-pointer rounded-full border p-2.5 shadow-sm transition-opacity hover:opacity-70"
						title="Descargar como JSON"
						aria-label={`Descargar ${board.name} como JSON`}
					>
						<FileDown className="h-4 w-4" aria-hidden="true" />
					</button>

					<button
						onClick={handleDuplicate}
						className="text-df-ink dark:text-df-ink-dark cursor-pointer rounded-full border p-2.5 shadow-sm transition-opacity hover:opacity-70"
						title="Duplicar"
						aria-label={`Duplicar ${board.name}`}
					>
						<Copy className="h-4 w-4" aria-hidden="true" />
					</button>

					<button
						onClick={handleDelete}
						className="cursor-pointer rounded-full border border-red-500 p-2.5 text-red-500 shadow-sm transition-opacity hover:opacity-70"
						title="Eliminar"
						aria-label={`Eliminar ${board.name}`}
					>
						<Trash2 className="h-4 w-4" aria-hidden="true" />
					</button>
				</div>
			</div>
		</li>
	);
};

export default BoardCard;
