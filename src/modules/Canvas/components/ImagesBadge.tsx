import { useStore } from "@nanostores/react";
import { selectedImagesStore } from "../../../shared/store/boardStore";

const ImagesBadge = () => {
	const selectedImages = useStore(selectedImagesStore);

	return (
		<>
			{selectedImages.length > 0 && (
				<div className="bg-df-surface dark:bg-df-primary-dark/10 border-df-primary/20 dark:border-df-primary-dark/20 inline-flex w-full items-center gap-2 rounded-full border px-3 py-1.5">
					<div className="flex -space-x-1.5">
						{selectedImages.slice(0, 10).map((img, i) => (
							<img
								key={i}
								src={img.imageSrc}
								alt=""
								className="dark:border-df-surface-dark h-6 w-6 rounded-full border-2 border-white object-cover"
							/>
						))}
					</div>
					<span className="text-df-primary dark:text-df-primary-dark text-xs font-semibold">
						{selectedImages.length}{" "}
						{selectedImages.length === 1 ? "imagen lista" : "imágenes listas"}
					</span>
				</div>
			)}
		</>
	);
};

export default ImagesBadge;
