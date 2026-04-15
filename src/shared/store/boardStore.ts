import { persistentAtom } from '@nanostores/persistent';
import type { NormalizedImage } from '../modules/Explore/types';

// We need to serialize/deserialize the JSON array
export const selectedImagesStore = persistentAtom<NormalizedImage[]>('selectedImages', [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

export function toggleImageSelection(image: NormalizedImage) {
    const currentImages = selectedImagesStore.get();
    const isSelected = currentImages.some(img => img.imageSrc === image.imageSrc);
    
    if (isSelected) {
        selectedImagesStore.set(currentImages.filter(img => img.imageSrc !== image.imageSrc));
    } else {
        selectedImagesStore.set([...currentImages, image]);
    }
}

export function clearImageSelection() {
    selectedImagesStore.set([]);
}
