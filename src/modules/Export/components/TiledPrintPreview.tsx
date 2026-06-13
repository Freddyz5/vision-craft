import React from 'react';
import { buildPrintConfig } from '../types';
import { MM_TO_PX } from '../../Canvas/constants/presets';

interface TiledPrintPreviewProps {
    canvasW: number;
    canvasH: number;
    paperId: 'a4' | 'a3' | 'us-letter';
    containerWidth: number;
}

export function TiledPrintPreview({ canvasW, canvasH, paperId, containerWidth }: TiledPrintPreviewProps) {
    const printConfig = buildPrintConfig(canvasW, canvasH, paperId);
    
    const logicalW = canvasW * MM_TO_PX;
    const logicalH = canvasH * MM_TO_PX;
    
    // Scale down the canvas so it fits in the containerWidth
    const scaleFactor = containerWidth / logicalW;
    const height = logicalH * scaleFactor;
    
    // Tile size in scaled pixels
    const tileW = printConfig.paperWidthMm * MM_TO_PX * scaleFactor;
    const tileH = printConfig.paperHeightMm * MM_TO_PX * scaleFactor;
    
    return (
        <div className="flex flex-col gap-4 mt-6">
            <div className="bg-info/10 text-info px-4 py-2 rounded-md font-medium text-sm flex justify-between items-center">
                <span>Se necesitan {printConfig.tiles.length} páginas para cubrir el lienzo.</span>
                <span className="badge badge-info text-white font-bold">{printConfig.cols} × {printConfig.rows}</span>
            </div>
            
            <div 
                className="relative bg-base-200 border border-base-300 dark:border-gray-700 shadow-inner rounded overflow-hidden mt-4 mx-auto" 
                style={{ width: containerWidth, height }}
            >
                {/* The whole canvas footprint */}
                <div className="absolute inset-0 bg-primary/5" />
                
                {/* The tiles grid */}
                {printConfig.tiles.map((tile, i) => (
                    <div 
                        key={i}
                        className="absolute border border-dashed border-primary/60 bg-white/40 flex items-center justify-center font-bold text-primary/70 pointer-events-none"
                        style={{
                            left: tile.offsetXMm * MM_TO_PX * scaleFactor,
                            top: tile.offsetYMm * MM_TO_PX * scaleFactor,
                            width: tileW,
                            height: tileH,
                        }}
                    >
                        Pág {i + 1}
                    </div>
                ))}
            </div>
            
            <p className="text-xs text-base-content/60 text-center mt-2 italic">
                La vista previa muestra las marcas de corte. Asegúrate de imprimir al 100% de escala sin márgenes adicionales, o ajustado inteligentemente.
            </p>
        </div>
    );
}
