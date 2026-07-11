import { BringToFront, SendToBack, Trash2, X } from "lucide-react";
import type { CanvasItem } from "../../../shared/store/canvasStore";

interface ItemInspectorProps {
	item: CanvasItem;
	onClose: () => void;
	onUpdate: (patch: Partial<CanvasItem>) => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	onDelete: () => void;
}

export function ItemInspector({
	item,
	onClose,
	onUpdate,
	onBringToFront,
	onSendToBack,
	onDelete,
}: ItemInspectorProps) {
	return (
		<aside
			aria-label="Inspector del elemento"
			className="bg-base-100 dark:bg-df-surface-dark border-df-primary/20 animate-fade-in text-df-ink dark:text-df-ink-dark sticky top-24 -mt-55 h-[calc(100vh-8rem)] w-96 shrink-0 space-y-4 overflow-y-auto rounded-3xl border-2 p-5 shadow-md"
		>
			<header className="border-base-200 flex items-center justify-between border-b pb-2 dark:border-gray-800">
				<h2 className="text-df-muted dark:text-df-muted-dark text-xs font-bold tracking-wider uppercase">
					{item.type === "text" ? "Inspector de Texto" : "Inspector de Imagen"}
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="btn btn-xs btn-circle btn-ghost"
					aria-label="Cerrar inspector"
				>
					<X className="h-3.5 w-3.5" aria-hidden="true" />
				</button>
			</header>

			{/* Layer actions */}
			<section className="flex flex-col gap-2" aria-label="Capa y orden">
				<h3 className="text-df-muted dark:text-df-muted-dark text-[10px] font-bold tracking-wider uppercase">
					Capa / Orden
				</h3>
				<div className="flex gap-2">
					<button
						onClick={onBringToFront}
						type="button"
						className="btn btn-xs btn-outline flex-1"
						title="Traer al frente"
					>
						<BringToFront className="h-3.5 w-3.5" aria-hidden="true" />
						Al Frente
					</button>
					<button
						onClick={onSendToBack}
						type="button"
						className="btn btn-xs btn-outline flex-1"
						title="Enviar al fondo"
					>
						<SendToBack className="h-3.5 w-3.5" aria-hidden="true" />
						Al Fondo
					</button>
				</div>
			</section>

			{/* Text specific settings */}
			{item.type === "text" && (
				<section
					className="border-base-200 space-y-3 border-t pt-2 dark:border-gray-800"
					aria-label="Propiedades de texto"
				>
					<div className="form-control w-full">
						<label htmlFor="item-text-content" className="label py-1">
							<span className="label-text text-xs font-semibold">Editar Texto</span>
						</label>
						<textarea
							id="item-text-content"
							value={item.text || ""}
							onChange={(e) => onUpdate({ text: e.target.value })}
							className="textarea textarea-bordered textarea-xs bg-base-100 dark:bg-df-bg-dark min-h-15 w-full"
							rows={2}
						/>
					</div>

					<div className="form-control w-full">
						<label htmlFor="item-font-family" className="label py-1">
							<span className="label-text text-xs font-semibold">Tipografía</span>
						</label>
						<select
							id="item-font-family"
							value={item.fontFamily || "Inter"}
							onChange={(e) => onUpdate({ fontFamily: e.target.value })}
							className="select select-bordered select-xs bg-base-100 dark:bg-df-bg-dark w-full"
						>
							<option value="Inter">Sans-Serif (Inter)</option>
							<option value="Georgia">Serif (Georgia)</option>
							<option value="Courier New">Monospace (Courier)</option>
							<option value="Comic Sans MS">Handwriting (Comic)</option>
						</select>
					</div>

					<div className="form-control w-full">
						<div className="flex items-center justify-between py-1">
							<span className="label-text text-xs font-semibold">Tamaño</span>
							<span className="font-mono text-xs font-semibold">{item.fontSize || 24}px</span>
						</div>
						<input
							type="range"
							min="12"
							max="500"
							value={item.fontSize || 24}
							onChange={(e) => {
								const newSize = parseInt(e.target.value);
								onUpdate({
									fontSize: newSize,
									// Adjust bounding box size roughly
									height: newSize * 1.5,
								});
							}}
							className="range range-xs range-primary"
						/>
					</div>

					<div className="form-control w-full">
						<label htmlFor="item-fill-color" className="label py-1">
							<span className="label-text text-xs font-semibold">Color</span>
						</label>
						<div className="flex items-center gap-3">
							<input
								id="item-fill-color"
								type="color"
								value={item.fillColor || "#7C3AED"}
								onChange={(e) => onUpdate({ fillColor: e.target.value })}
								className="border-base-300 h-8 w-8 cursor-pointer rounded border dark:border-gray-700"
							/>
							<span className="font-mono text-xs font-semibold">{item.fillColor || "#7C3AED"}</span>
						</div>
					</div>
				</section>
			)}

			{/* Delete action */}
			<section className="border-base-200 border-t pt-2 dark:border-gray-800" aria-label="Borrado">
				<button
					type="button"
					onClick={onDelete}
					className="btn btn-xs btn-error btn-outline w-full"
				>
					<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
					Borrar Elemento
				</button>
			</section>
		</aside>
	);
}
