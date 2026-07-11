import {
	recordUploadedImage,
	selectedImagesStore,
	toggleImageSelection,
} from "../../../shared/store/boardStore";
import { useToast } from "../../../shared/hooks/useToast";
import { Toast } from "../../../shared/components/Toast";
import UploadDropzone from "./UploadDropzone";
import PasteImageLinkForm from "./PasteImageLinkForm";
import type { NormalizedImage } from "../types";

/** Formas de agregar imágenes propias en Explore: subir un archivo o pegar un enlace. */
export default function HeaderAddImages() {
	const { toastMessage, showToast } = useToast();

	const handleUploaded = (image: NormalizedImage) => {
		toggleImageSelection(image);
		recordUploadedImage(image);
		showToast("Imagen subida y agregada a tu selección.");
	};

	const handleLinkResolved = (image: NormalizedImage) => {
		const alreadySelected = selectedImagesStore
			.get()
			.some((img) => img.imageSrc === image.imageSrc);
		if (alreadySelected) {
			showToast("Esa imagen ya estaba en tu selección.");
			return;
		}
		// toggleImageSelection agrega y la guarda en las imágenes recientes para recuperarla luego.
		toggleImageSelection(image);
		showToast("Imagen agregada desde el enlace.");
	};

	return (
		<div className="flex w-full shrink-0 flex-col gap-3 sm:w-72">
			<UploadDropzone onUploaded={handleUploaded} onError={showToast} className="h-36 w-full" />

			<PasteImageLinkForm onResolved={handleLinkResolved} onError={showToast} />

			<Toast message={toastMessage} />
		</div>
	);
}
