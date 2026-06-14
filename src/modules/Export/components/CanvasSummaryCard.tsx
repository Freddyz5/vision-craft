import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import { activeCanvasConfigStore, activeCanvasItemsStore } from '../../../shared/store/canvasStore';
import { MM_TO_PX } from '../../Canvas/constants/presets';

function StaticImage({ src, x, y, width, height, rotation, scaleFactor }: any) {
    const [image, setImage] = useState<HTMLImageElement | undefined>();
    useEffect(() => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = () => setImage(img);
    }, [src]);
    return <KonvaImage image={image} x={x * scaleFactor} y={y * scaleFactor} width={width * scaleFactor} height={height * scaleFactor} rotation={rotation} />;
}

export function CanvasSummaryCard() {
    const config = useStore(activeCanvasConfigStore);
    const items = useStore(activeCanvasItemsStore);

    const logicalWidth = config.widthMm * MM_TO_PX;
    const logicalHeight = config.heightMm * MM_TO_PX;

    const containerRef = useRef<HTMLDivElement>(null);
    const [scaleFactor, setScaleFactor] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        // fit within width but limit height max 220
        const scaleX = width / logicalWidth;
        const scaleY = 220 / logicalHeight;
        setScaleFactor(Math.min(scaleX, scaleY, 1));
    }, [logicalWidth, logicalHeight]);

    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="card bg-base-100 shadow-md border border-base-300 dark:border-gray-700">
            <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4 text-base-content">Lienzo Actual</h2>

                <div
                    ref={containerRef}
                    className="w-full bg-base-200 dark:bg-gray-800 rounded flex items-center justify-center border border-base-300 min-h-[220px] shadow-inner"
                >
                    {mounted && (
                        <Stage width={logicalWidth * scaleFactor} height={logicalHeight * scaleFactor}>
                            <Layer>
                                <Rect width={logicalWidth * scaleFactor} height={logicalHeight * scaleFactor} fill="white" />
                                {sortedItems.map(item => (
                                    <StaticImage
                                        key={item.id}
                                        src={item.imageSrc}
                                        x={item.x} y={item.y}
                                        width={item.width} height={item.height}
                                        rotation={item.rotation}
                                        scaleFactor={scaleFactor}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    )}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between border-b border-base-200 pb-1">
                        <span className="text-base-content/70">Nombre:</span>
                        <span className="font-semibold text-base-content">{config.name || 'Sin título'}</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-1">
                        <span className="text-base-content/70">Dimensiones:</span>
                        <span className="font-semibold text-base-content">{config.widthMm} × {config.heightMm} mm</span>
                    </div>
                    <div className="flex justify-between border-b border-base-200 pb-1">
                        <span className="text-base-content/70">Orientación:</span>
                        <span className="font-semibold text-base-content capitalize">{config.orientation}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                        <span className="text-base-content/70">Imágenes:</span>
                        <span className="font-semibold text-base-content">{items.length}</span>
                    </div>
                </div>

                <div className="card-actions mt-4 pt-4">
                    <a href="/design" className="btn btn-outline btn-sm w-full">
                        ← Editar Lienzo
                    </a>
                </div>
            </div>
        </div>
    );
}
