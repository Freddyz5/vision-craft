import { useStore } from '@nanostores/react';
import { selectedImagesStore } from '../../../shared/store/boardStore';

const ImagesBadge = () => {
  const selectedImages = useStore(selectedImagesStore);

  return (
    <>
      {selectedImages.length > 0 && (
        <div className="w-full inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-df-primary/10 dark:bg-df-primary-dark/15 border border-df-primary/20 dark:border-df-primary-dark/20">
          <div className="flex -space-x-1.5">
            {selectedImages.slice(0, 10).map((img, i) => (
              <img
                key={i}
                src={img.imageSrc}
                alt=""
                className="w-6 h-6 rounded-full border-2 border-white dark:border-df-surface-dark object-cover"
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-df-primary dark:text-df-primary-dark">
            {selectedImages.length} {selectedImages.length === 1 ? 'imagen lista' : 'imágenes listas'}
          </span>
        </div>
      )}
    </>
  );
};

export default ImagesBadge;