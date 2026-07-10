import { persistentAtom } from "@nanostores/persistent";
import type { NormalizedImage } from "../../modules/Explore/types";

const MAX_RECENT_IMAGES = 10;
const MAX_UPLOADED_IMAGES = 20;

// We need to serialize/deserialize the JSON array
export const selectedImagesStore = persistentAtom<NormalizedImage[]>("selectedImages", [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

/** Últimas imágenes que se seleccionaron alguna vez, aunque luego se hayan deseleccionado — para poder recuperarlas. */
export const recentImagesStore = persistentAtom<NormalizedImage[]>("recentImages", [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

/** Imágenes subidas por este usuario a Cloudinary, sin importar el tablero. */
export const uploadedImagesStore = persistentAtom<NormalizedImage[]>("uploadedImages", [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

function pushToFront(
	store: { get: () => NormalizedImage[]; set: (value: NormalizedImage[]) => void },
	image: NormalizedImage,
	max: number,
) {
	const deduped = store.get().filter((img) => img.imageSrc !== image.imageSrc);
	store.set([image, ...deduped].slice(0, max));
}

export function toggleImageSelection(image: NormalizedImage) {
	const currentImages = selectedImagesStore.get();
	const isSelected = currentImages.some((img) => img.imageSrc === image.imageSrc);

	if (isSelected) {
		selectedImagesStore.set(currentImages.filter((img) => img.imageSrc !== image.imageSrc));
	} else {
		selectedImagesStore.set([...currentImages, image]);
		pushToFront(recentImagesStore, image, MAX_RECENT_IMAGES);
	}
}

export function recordUploadedImage(image: NormalizedImage) {
	pushToFront(uploadedImagesStore, image, MAX_UPLOADED_IMAGES);
}

export function clearImageSelection() {
	selectedImagesStore.set([]);
}
