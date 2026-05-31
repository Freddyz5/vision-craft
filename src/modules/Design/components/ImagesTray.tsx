import React from 'react';
import { useStore } from '@nanostores/react';
import { selectedImagesStore } from '../../../shared/store/boardStore';
import { activeCanvasItemsStore, addItem, savedCanvasesStore, loadCanvas, duplicateCanvas, deleteCanvas } from '../../../shared/store/canvasStore';
import ImageCard from '../../Explore/components/ImageCard';
import CanvasCard from './CanvasCard';

interface ImagesTrayProps {
  viewMode?: 'images' | 'canvases';
}

export function ImagesTray({ viewMode = 'images' }: ImagesTrayProps) {
  const selectedImages = useStore(selectedImagesStore);
  const canvasItems = useStore(activeCanvasItemsStore);
  const savedCanvases = useStore(savedCanvasesStore);

  // For drag start on images
  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, imageSrc: string, width: number, height: number) => {
    e.dataTransfer.setData('imageSrc', imageSrc);
    e.dataTransfer.setData('imgWidth', width.toString());
    e.dataTransfer.setData('imgHeight', height.toString());
  };

  const handleAddClick = (imageSrc: string, width: number, height: number) => {
    // Add at center roughly
    const targetW = 200;
    const targetH = (height / width) * targetW;

    addItem({
      id: crypto.randomUUID(),
      imageSrc,
      alt: 'Added Image',
      x: 50, // naive positioning
      y: 50,
      width: targetW,
      height: targetH,
      rotation: 0,
      zIndex: canvasItems.length,
    });
  };

  return (
    <aside
      className="w-96 h-[calc(100vh-8rem)] overflow-y-scroll shrink-0 sticky top-24 -mt-55 bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-5 space-y-4 border-2 border-df-primary/30"
      aria-label="Bandeja de imagenes"
    >
      {viewMode === 'canvases' ?
        <>
          {/* Canvases */}
          {/* Label */}
          <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">Mis Lienzos ({savedCanvases.length})</p>

          {/* Canvases Tray */}
          <article className="flex-1 overflow-y-auto p-4 space-y-4">
            {savedCanvases.length === 0 ? (
              <div className="text-center text-base-content/50 mt-10">
                <p>No tienes lienzos guardados.</p>
                <p className="text-xs mt-2">Guarda uno en el editor</p>
              </div>
            ) : (
              <ul role="list" className="space-y-3">
                {savedCanvases.map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} />
                ))}
              </ul>
            )}
          </article>
        </> :
        <>
          {/* Images */}
          {/* Label */}
          <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">Tus Imágenes ({selectedImages.length})</p>

          {/* Images Tray */}
          <article className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedImages.length === 0 ? (
              <div className="text-center text-base-content/50 mt-10">
                <p>No hay imágenes seleccionadas.</p>
                <a href="/explore" className="btn btn-outline btn-sm mt-4">Explorar</a>
              </div>
            ) : (
              <ul role="list" className="grid grid-flow-row-dense grid-cols-2 auto-rows-[100px] gap-3">
                {selectedImages.map((img, index) => {
                  const inCanvas = canvasItems.some(i => i.imageSrc === img.imageSrc);
                  return (
                    <ImageCard
                      key={`${img.imageSrc}-${index}`}
                      width={img.width.toString()}
                      height={img.height.toString()}
                      imageSrc={img.imageSrc}
                      alt={img.alt}
                      selected={inCanvas}
                      onClick={() => handleAddClick(img.imageSrc, img.width || 800, img.height || 600)}
                      onDragStart={(e) => handleDragStart(e, img.imageSrc, img.width || 800, img.height || 600)}
                    />
                  );
                })}
              </ul>
            )}
          </article>
        </>
      }
    </aside>
  );
}

