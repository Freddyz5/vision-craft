import React from "react";
import { loadCanvas, duplicateCanvas, deleteCanvas } from "../../../shared/store/canvasStore";
import { resetHistory } from "../../../shared/store/canvasHistory";
import { Copy, Trash2 } from "lucide-react";
import type { SavedCanvas } from "../../../shared/store/canvasStore";

interface Props {
	canvas: SavedCanvas;
}

const CanvasCard = ({ canvas }: Props) => {
	return (
		<li key={canvas.id} className="border-df-primary/60 rounded-2xl border-2 shadow-sm">
			<div className="card-body p-4">
				<h4 className="card-title truncate text-base font-bold">{canvas.name}</h4>
				<p className="text-df-muted dark:text-df-muted-dark text-xs">
					{new Date(canvas.createdAt).toLocaleDateString("es-MX")} • {canvas.items.length} imágenes
				</p>
				<p className="text-df-muted dark:text-df-muted-dark text-xs">
					{canvas.config.widthMm} × {canvas.config.heightMm} mm
				</p>

				{canvas.thumbnail && (
					<img
						src={canvas.thumbnail}
						alt="Thumbnail"
						className="border-df-primary/30 my-2 h-32 w-full rounded border bg-gray-200 object-contain dark:bg-gray-800"
					/>
				)}

				<div className="flex items-center justify-center gap-2">
					<button
						onClick={() => {
							loadCanvas(canvas.id);
							resetHistory();
						}}
						className="bg-df-primary flex w-full cursor-pointer items-center justify-center rounded-full px-6 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
					>
						Cargar
					</button>

					<button
						onClick={() => duplicateCanvas(canvas.id)}
						className="cursor-pointer rounded-full border p-2.5 shadow-sm transition-opacity hover:opacity-70"
						title="Duplicar"
					>
						<Copy className="h-4 w-4" aria-hidden="true" />
					</button>

					<button
						onClick={() => {
							if (confirm("¿Eliminar este lienzo?")) {
								deleteCanvas(canvas.id);
							}
						}}
						className="cursor-pointer rounded-full border border-red-500 p-2.5 text-red-500 shadow-sm transition-opacity hover:opacity-70"
						title="Eliminar"
					>
						<Trash2 className="h-4 w-4" aria-hidden="true" />
					</button>
				</div>
			</div>
		</li>
	);
};

export default CanvasCard;
