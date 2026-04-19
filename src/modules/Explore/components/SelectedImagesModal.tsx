import ImageCard from './ImageCard';
import { useStore } from '@nanostores/react';
import { selectedImagesStore, toggleImageSelection } from '../../../shared/store/boardStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectedImagesModal({ isOpen, onClose }: Props) {
  const selectedImages = useStore(selectedImagesStore);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-df-bg/80 dark:bg-df-bg-dark/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-df-surface dark:bg-df-surface-dark w-full max-w-5xl h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-df-ink dark:text-df-ink-dark">Imágenes Seleccionadas</h2>
            <p className="text-sm text-df-muted dark:text-df-muted-dark mt-1">Haz clic en una imagen para eliminarla de tu selección.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors text-df-ink dark:text-df-ink-dark"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
          <ul className="grid grid-flow-row-dense grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[140px] md:auto-rows-[130px] gap-4">
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
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end gap-4 shrink-0 bg-df-surface dark:bg-df-surface-dark">
          <a
            href="/canvas"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-df-primary/30 dark:shadow-df-primary-dark/20"
          >
            Crear Board con {selectedImages.length} {selectedImages.length === 1 ? 'imagen' : 'imágenes'}
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
