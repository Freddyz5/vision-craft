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
                  // <li key={canvas.id} className="card bg-base-100 border border-base-300 dark:border-gray-700 shadow-sm">
                  //   <div className="card-body p-4">
                  //     <h4 className="card-title text-base font-bold truncate">{canvas.name}</h4>
                  //     <p className="text-xs text-base-content/60">
                  //       {new Date(canvas.createdAt).toLocaleDateString('es-MX')} • {canvas.items.length} imágenes
                  //     </p>
                  //     <p className="text-xs text-base-content/60">
                  //       {canvas.config.widthMm} × {canvas.config.heightMm} mm
                  //     </p>

                  //     {canvas.thumbnail && (
                  //       <img src={canvas.thumbnail} alt="Thumbnail" className="w-full h-32 object-contain border border-base-200 bg-base-200 rounded my-2" />
                  //     )}

                  //     <div className="card-actions justify-end mt-2">
                  //       <button
                  //         onClick={() => loadCanvas(canvas.id)}
                  //         className="btn btn-primary btn-sm flex-1"
                  //       >
                  //         Cargar
                  //       </button>
                  //       <div className="flex gap-1">
                  //         <button
                  //           onClick={() => duplicateCanvas(canvas.id)}
                  //           className="btn btn-outline btn-sm px-2"
                  //           title="Duplicar"
                  //         >
                  //           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  //           </svg>
                  //         </button>
                  //         <button
                  //           onClick={() => {
                  //             if (confirm('¿Eliminar este lienzo?')) {
                  //               deleteCanvas(canvas.id);
                  //             }
                  //           }}
                  //           className="btn btn-outline btn-error btn-sm px-2"
                  //           title="Eliminar"
                  //         >
                  //           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  //           </svg>
                  //         </button>
                  //       </div>
                  //     </div>
                  //   </div>
                  // </li>
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

