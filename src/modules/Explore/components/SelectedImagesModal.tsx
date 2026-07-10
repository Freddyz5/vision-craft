import { useState } from "react";
import ImageCard from "./ImageCard";
import { useStore } from "@nanostores/react";
import {
	selectedImagesStore,
	recentImagesStore,
	uploadedImagesStore,
	toggleImageSelection,
} from "../../../shared/store/boardStore";
import { X, ChevronsRight } from "lucide-react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

type Tab = "selected" | "history" | "uploads";

const TABS: { id: Tab; label: string }[] = [
	{ id: "selected", label: "Seleccionadas" },
	{ id: "history", label: "Historial" },
	{ id: "uploads", label: "Mis subidas" },
];

const TAB_DESCRIPTIONS: Record<Tab, string> = {
	selected: "Haz clic en una imagen para eliminarla de tu selección.",
	history: "Tus últimas imágenes seleccionadas — haz clic para agregarlas de nuevo.",
	uploads: "Imágenes que subiste desde tu computadora — haz clic para agregarlas de nuevo.",
};

const EMPTY_MESSAGES: Record<Tab, string> = {
	selected: "Todavía no seleccionaste ninguna imagen.",
	history: "Todavía no hay historial de selección.",
	uploads: "Todavía no subiste ninguna imagen.",
};

export default function SelectedImagesModal({ isOpen, onClose }: Props) {
	const [activeTab, setActiveTab] = useState<Tab>("selected");
	const selectedImages = useStore(selectedImagesStore);
	const recentImages = useStore(recentImagesStore);
	const uploadedImages = useStore(uploadedImagesStore);

	if (!isOpen) return null;

	const imagesByTab = {
		selected: selectedImages,
		history: recentImages,
		uploads: uploadedImages,
	};

	const activeImages = imagesByTab[activeTab];

	return (
		<div className="bg-df-bg/80 dark:bg-df-bg-dark/80 animate-fade-in fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
			<div className="bg-df-surface dark:bg-df-surface-dark border-df-border dark:border-df-border-dark flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
				<div className="border-df-border dark:border-df-border-dark flex shrink-0 items-center justify-between border-b p-6">
					<div>
						<h2 className="text-df-ink dark:text-df-ink-dark text-2xl font-bold">
							Imágenes Seleccionadas
						</h2>
						<p className="text-df-muted dark:text-df-muted-dark mt-1 text-sm">
							{TAB_DESCRIPTIONS[activeTab]}
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

				<div
					role="tablist"
					aria-label="Vistas de imágenes"
					className="border-df-border dark:border-df-border-dark flex shrink-0 gap-2 border-b px-6 pt-4"
				>
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							role="tab"
							id={`tab-${tab.id}`}
							aria-selected={activeTab === tab.id}
							aria-controls={`tabpanel-${tab.id}`}
							onClick={() => setActiveTab(tab.id)}
							className={[
								"rounded-t-xl border border-b-0 px-4 py-2 text-sm font-semibold transition-colors",
								activeTab === tab.id
									? "bg-df-bg dark:bg-df-bg-dark text-df-primary dark:text-df-primary-dark border-df-border dark:border-df-border-dark"
									: "text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark border-transparent",
							].join(" ")}
						>
							{tab.label}
							{tab.id !== "selected" && imagesByTab[tab.id].length > 0 && (
								<span className="text-df-muted dark:text-df-muted-dark ml-1.5 text-xs font-normal">
									({imagesByTab[tab.id].length})
								</span>
							)}
						</button>
					))}
				</div>

				<div
					id={`tabpanel-${activeTab}`}
					role="tabpanel"
					aria-labelledby={`tab-${activeTab}`}
					className="bg-df-bg/50 dark:bg-df-bg-dark/50 flex-1 overflow-y-auto p-6"
				>
					{activeImages.length === 0 ? (
						<p className="text-df-muted dark:text-df-muted-dark py-12 text-center text-sm">
							{EMPTY_MESSAGES[activeTab]}
						</p>
					) : (
						<ul className="grid grid-flow-row-dense auto-rows-35 grid-cols-2 gap-4 md:auto-rows-32.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{activeImages.map((img, index) => {
								const isSelected = selectedImages.some(
									(selected) => selected.imageSrc === img.imageSrc,
								);
								return (
									<ImageCard
										key={`${activeTab}-${img.imageSrc}-${index}`}
										width={img.width.toString()}
										height={img.height.toString()}
										imageSrc={img.imageSrc}
										alt={img.alt}
										selected={isSelected}
										onClick={() => toggleImageSelection(img)}
									/>
								);
							})}
						</ul>
					)}
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
