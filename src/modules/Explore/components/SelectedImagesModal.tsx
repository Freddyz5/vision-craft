import ImageCard from "./ImageCard";
import { useStore } from "@nanostores/react";
import { selectedImagesStore, toggleImageSelection } from "../../../shared/store/boardStore";
import { X, ChevronsRight } from "lucide-react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

export default function SelectedImagesModal({ isOpen, onClose }: Props) {
	const selectedImages = useStore(selectedImagesStore);

	if (!isOpen) return null;

	return (
		<div className="bg-df-bg/80 dark:bg-df-bg-dark/80 animate-fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
			<div className="bg-df-surface dark:bg-df-surface-dark border-df-border dark:border-df-border-dark flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
				<div className="border-df-border dark:border-df-border-dark flex shrink-0 items-center justify-between border-b p-6">
					<div>
						<h2 className="text-df-ink dark:text-df-ink-dark text-2xl font-bold">
							Imágenes Seleccionadas
						</h2>
						<p className="text-df-muted dark:text-df-muted-dark mt-1 text-sm">
							Haz clic en una imagen para eliminarla de tu selección.
						</p>
					</div>
					<button
						onClick={onClose}
						className="bg-df-surface-alt dark:bg-df-surface-alt-dark hover:bg-df-border dark:hover:bg-df-border-dark text-df-ink dark:text-df-ink-dark rounded-full p-2.5 transition-colors"
						aria-label="Cerrar modal"
					>
						<X className="h-5 w-5" strokeWidth={2.5} />
					</button>
				</div>
				<div className="bg-df-bg/50 dark:bg-df-bg-dark/50 flex-1 overflow-y-auto p-6">
					<ul className="grid grid-flow-row-dense auto-rows-[140px] grid-cols-2 gap-4 md:auto-rows-[130px] md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{selectedImages.map((img, index) => (
							<ImageCard
								key={`modal-${img.imageSrc}-${index}`}
								width={img.width.toString()}
								height={img.height.toString()}
								imageSrc={img.imageSrc}
								alt={img.alt}
								selected={true}
								onClick={() => toggleImageSelection(img)}
							/>
						))}
					</ul>
				</div>
				<div className="border-df-border dark:border-df-border-dark bg-df-surface dark:bg-df-surface-dark flex shrink-0 justify-end gap-4 border-t p-4">
					<a
						href="/canvas"
						className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 flex items-center gap-2 rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
					>
						Crear Board con {selectedImages.length}{" "}
						{selectedImages.length === 1 ? "imagen" : "imágenes"}
						<ChevronsRight className="ml-1 h-4 w-4" strokeWidth={2.5} />
					</a>
				</div>
			</div>
		</div>
	);
}
