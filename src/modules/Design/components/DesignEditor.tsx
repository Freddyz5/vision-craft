import React, { useEffect, useRef, useState } from 'react';
import { ImagesTray } from './ImagesTray';
import { KonvaCanvas } from './KonvaCanvas';
import { useStore } from '@nanostores/react';
import { activeCanvasConfigStore, activeCanvasItemsStore, addItem, bringToFront, saveCurrentCanvas, sendToBack, updateItem, removeItem } from '../../../shared/store/canvasStore';
import { designViewModeStore, toggleDesignViewMode } from '../../../shared/store/designViewStore';
import type { SelectedItemId } from '../types';
import type Konva from 'konva';

const MM_TO_PX = 96 / 25.4;

export default function DesignEditor() {
  const config = useStore(activeCanvasConfigStore);
  const items = useStore(activeCanvasItemsStore);
  const viewMode = useStore(designViewModeStore);

  const [selectedCanvas, setSelectedCanvas] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Convert canvas config to logical pixels
  const logicalWidth = config.widthMm * MM_TO_PX;
  const logicalHeight = config.heightMm * MM_TO_PX;

  const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Get currently selected item
  const selectedItem = items.find(i => i.id === selectedId);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle responsive scaling of the canvas
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const padding = 64; // 32px padding on all sides

      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;

      const scaleX = availableWidth / logicalWidth;
      const scaleY = availableHeight / logicalHeight;

      // Fit within container
      const scale = Math.min(scaleX, scaleY, 1);
      setScaleFactor(scale);
    };

    setTimeout(updateScale, 10);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [logicalWidth, logicalHeight]);

  // Handle Drag & Drop from ImagesTray
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const imageSrc = e.dataTransfer.getData('imageSrc');
    const imgWidthRaw = e.dataTransfer.getData('imgWidth');
    const imgHeightRaw = e.dataTransfer.getData('imgHeight');

    if (!imageSrc) return;

    const imgWidth = parseInt(imgWidthRaw) || 800;
    const imgHeight = parseInt(imgHeightRaw) || 600;

    const totalScale = scaleFactor * zoom;

    if (stageRef.current) {
      stageRef.current.setPointersPositions(e);
      let pos = stageRef.current.getPointerPosition();

      if (pos) {
        // Adjust position for totalScale (scaleFactor * zoom)
        const x = pos.x / totalScale;
        const y = pos.y / totalScale;

        const targetW = 200;
        const targetH = (imgHeight / imgWidth) * targetW;

        // Center the image around the drop point
        addItem({
          id: crypto.randomUUID(),
          type: 'image',
          imageSrc,
          alt: 'Dropped Image',
          x: x - targetW / 2,
          y: y - targetH / 2,
          width: targetW,
          height: targetH,
          rotation: 0,
          zIndex: items.length,
        });
      }
    }
  };

  const handleSave = () => {
    let thumbnail = undefined;
    if (stageRef?.current) {
      thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.5 });
    }
    saveCurrentCanvas(thumbnail);
    showToast('Lienzo guardado exitosamente.');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCanvas = () => {
    toggleDesignViewMode();
    setSelectedCanvas(!selectedCanvas);
  };

  return (
    <section className="flex-1 flex gap-8 px-8 pb-10 items-start">
      {/* ════ LEFT: Canvas ════ */}
      <div className="flex-1 min-w-0 space-y-8 relative">
        <article
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-base-200/50 dark:bg-base-300/20 border-2 border-df-primary/10 rounded-3xl overflow-auto relative min-h-[480px] p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Zoom controls */}
          <nav aria-label="Zoom del lienzo" className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-base-100/90 dark:bg-df-surface-dark/95 backdrop-blur-xs p-1.5 rounded-xl shadow-md border border-base-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))))}
              className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
              title="Alejar"
            >
              ➖
            </button>
            <span className="text-xs font-semibold px-1 min-w-[40px] text-center select-none text-df-ink dark:text-df-ink-dark">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3, parseFloat((prev + 0.1).toFixed(1))))}
              className="btn btn-xs btn-circle btn-ghost text-df-ink dark:text-df-ink-dark"
              title="Acercar"
            >
              ➕
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="btn btn-xs btn-ghost text-[10px] uppercase font-bold text-df-primary dark:text-df-primary-dark"
              title="100%"
            >
              100%
            </button>
          </nav>

          {/* Floating Contextual Inspector Panel */}
          {selectedId && selectedItem && (
            <aside aria-label="Inspector del elemento" className="absolute top-4 right-4 z-20 w-64 bg-base-100/95 dark:bg-df-surface-dark/95 backdrop-blur-xs p-4 rounded-2xl shadow-xl border border-base-200 dark:border-gray-800 space-y-4 animate-fade-in text-df-ink dark:text-df-ink-dark">
              <header className="flex items-center justify-between border-b border-base-200 dark:border-gray-800 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-df-muted dark:text-df-muted-dark">
                  {selectedItem.type === 'text' ? 'Inspector de Texto' : 'Inspector de Imagen'}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="btn btn-xs btn-circle btn-ghost"
                  aria-label="Cerrar inspector"
                >
                  ✕
                </button>
              </header>

              {/* Layer actions */}
              <section className="flex flex-col gap-2" aria-label="Capa y orden">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-df-muted dark:text-df-muted-dark">
                  Capa / Orden
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      bringToFront(selectedItem.id);
                      showToast('Elemento traído al frente');
                    }}
                    type="button"
                    className="btn btn-xs btn-outline flex-1"
                    title="Traer al frente"
                  >
                    ▲ Al Frente
                  </button>
                  <button
                    onClick={() => {
                      sendToBack(selectedItem.id);
                      showToast('Elemento enviado al fondo');
                    }}
                    type="button"
                    className="btn btn-xs btn-outline flex-1"
                    title="Enviar al fondo"
                  >
                    ▼ Al Fondo
                  </button>
                </div>
              </section>

              {/* Text specific settings */}
              {selectedItem.type === 'text' && (
                <section className="space-y-3 pt-2 border-t border-base-200 dark:border-gray-800" aria-label="Propiedades de texto">
                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold">Editar Texto</span>
                    </label>
                    <textarea
                      value={selectedItem.text || ''}
                      onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
                      className="textarea textarea-bordered textarea-xs w-full min-h-[60px] bg-base-100 dark:bg-df-bg-dark"
                      rows={2}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold">Tipografía</span>
                    </label>
                    <select
                      value={selectedItem.fontFamily || 'Inter'}
                      onChange={(e) => updateItem(selectedItem.id, { fontFamily: e.target.value })}
                      className="select select-bordered select-xs w-full bg-base-100 dark:bg-df-bg-dark"
                    >
                      <option value="Inter">Sans-Serif (Inter)</option>
                      <option value="Georgia">Serif (Georgia)</option>
                      <option value="Courier New">Monospace (Courier)</option>
                      <option value="Comic Sans MS">Handwriting (Comic)</option>
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <div className="flex justify-between items-center py-1">
                      <span className="label-text text-xs font-semibold">Tamaño</span>
                      <span className="text-xs font-mono font-semibold">{selectedItem.fontSize || 24}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={selectedItem.fontSize || 24}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        updateItem(selectedItem.id, {
                          fontSize: newSize,
                          // Adjust bounding box size roughly
                          height: newSize * 1.5,
                        });
                      }}
                      className="range range-xs range-primary"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold">Color</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={selectedItem.fillColor || '#7C3AED'}
                        onChange={(e) => updateItem(selectedItem.id, { fillColor: e.target.value })}
                        className="w-8 h-8 rounded border border-base-300 dark:border-gray-700 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-semibold">{selectedItem.fillColor || '#7C3AED'}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Delete action */}
              <section className="pt-2 border-t border-base-200 dark:border-gray-800" aria-label="Borrado">
                <button
                  type="button"
                  onClick={() => {
                    removeItem(selectedItem.id);
                    setSelectedId(null);
                    showToast('Elemento eliminado.');
                  }}
                  className="btn btn-xs btn-error btn-outline w-full"
                >
                  🗑️ Borrar Elemento
                </button>
              </section>
            </aside>
          )}

          <div className="shadow-2xl rounded-sm overflow-hidden bg-white border border-base-300 dark:border-gray-800">
            <KonvaCanvas
              stageRef={stageRef}
              logicalWidth={logicalWidth}
              logicalHeight={logicalHeight}
              items={items}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              scaleFactor={scaleFactor * zoom}
            />
          </div>
        </article>

        <article className="flex w-full justify-center gap-3">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold bg-df-primary text-white hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
            Guardar
          </button>

          <a href="/export" className="inline-flex items-center justify-center gap-3 px-8 py-2.5 rounded-full font-bold text-base text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-df-primary/30 dark:shadow-df-primary-dark/20">
            Exportar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>

          <button onClick={handleCanvas} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer text-white ${selectedCanvas ? "bg-df-accent" : "bg-df-primary"}`}>
            {selectedCanvas ? "Mis imagenes" : "Mis Lienzos"}
          </button>
        </article>
      </div>

      {/* ════ RIGHT: Images Tray ════ */}
      <ImagesTray viewMode={viewMode} selectedId={selectedId} setSelectedId={setSelectedId} />

      {/* Lightweight Toast Notifications */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success shadow-lg text-white font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </section>
  );
}
