import { recordUploadedImage, toggleImageSelection } from "../../../shared/store/boardStore";
import { useToast } from "../../../shared/hooks/useToast";
import { Toast } from "../../../shared/components/Toast";
import UploadDropzone from "./UploadDropzone";
import type { NormalizedImage } from "../types";

/** Card de subida fija junto al título de Explore, arriba del grid de búsqueda. */
export default function HeaderUploadButton() {
	const { toastMessage, showToast } = useToast();

	const handleUploaded = (image: NormalizedImage) => {
		toggleImageSelection(image);
		recordUploadedImage(image);
		showToast("Imagen subida y agregada a tu selección.");
	};

	return (
		<>
			<UploadDropzone
				onUploaded={handleUploaded}
				onError={showToast}
				className="h-36 w-72 shrink-0"
			/>

			<Toast message={toastMessage} />
		</>
	);
}
