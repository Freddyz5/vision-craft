import React, { useEffect, useRef, useState } from 'react';
import { ImagesTray } from './ImagesTray';
import { KonvaCanvas } from './KonvaCanvas';
import { useStore } from '@nanostores/react';
import { activeCanvasConfigStore, activeCanvasItemsStore, addItem, saveCurrentCanvas } from '../../../shared/store/canvasStore';
import { designViewModeStore, toggleDesignViewMode } from '../../../shared/store/designViewStore';
import type { SelectedItemId } from '../types';
import type Konva from 'konva';


const MM_TO_PX = 96 / 25.4;

export default function DesignEditor() {
  const config = useStore(activeCanvasConfigStore);
  const items = useStore(activeCanvasItemsStore);
  const viewMode = useStore(designViewModeStore);

  const [selectedCanvas, setSelectedCanvas] = useState(false);

  // Convert canvas config to logical pixels
  const logicalWidth = config.widthMm * MM_TO_PX;
  const logicalHeight = config.heightMm * MM_TO_PX;

  const [selectedId, setSelectedId] = useState<SelectedItemId>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

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
      const scale = Math.min(scaleX, scaleY, 1); // Max scale 1 (100%) or larger if you want zooming
      setScaleFactor(scale);
    };

    // Use a small delay for first render if styles are not yet applied
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

    if (stageRef.current) {
      stageRef.current.setPointersPositions(e);
      // Get position relative to the stage
      let pos = stageRef.current.getPointerPosition();

      if (pos) {
        // Adjust position for scaleFactor so it's in logical coordinates
        const x = pos.x / scaleFactor;
        const y = pos.y / scaleFactor;

        // Set default display size
        const targetW = 200;
        const targetH = (imgHeight / imgWidth) * targetW;

        // Center the image around the drop point
        addItem({
          id: crypto.randomUUID(),
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
    alert('Lienzo guardado exitosamente.');
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleCanvas = () => {
    toggleDesignViewMode();
    setSelectedCanvas(!selectedCanvas);
  }

  return (
    <section className="flex-1 flex gap-8 px-8 pb-10 items-start">
      {/* ════ LEFT: Canvas ════ */}
      <div className="flex-1 min-w-0 space-y-8">
        <article
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <KonvaCanvas
            stageRef={stageRef}
            logicalWidth={logicalWidth}
            logicalHeight={logicalHeight}
            items={items}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            scaleFactor={scaleFactor}
          />
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
      <ImagesTray viewMode={viewMode} />
    </section>
  );
};
