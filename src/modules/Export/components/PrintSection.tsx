import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { activeCanvasConfigStore, activeCanvasItemsStore } from '../../../shared/store/canvasStore';
import { PRINT_PAPERS, buildPrintConfig } from '../types';
import { TiledPrintPreview } from './TiledPrintPreview';
import { createTiledPrintIframe, createDirectPrintIframe } from '../utils/printHelpers';

export function PrintSection() {
    const config = useStore(activeCanvasConfigStore);
    const items = useStore(activeCanvasItemsStore);

    const [printMode, setPrintMode] = useState<'direct' | 'tiled'>('tiled');
    const [paperId, setPaperId] = useState<'a4' | 'a3' | 'us-letter'>('a4');

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(300);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.clientWidth - 48); // Padding offset
        }

        const resize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth - 48);
            }
        };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const handlePrintDirect = () => {
        createDirectPrintIframe(config, items);
    };

    const handlePrintTiled = () => {
        const printConfig = buildPrintConfig(config.widthMm, config.heightMm, paperId);
        createTiledPrintIframe(config, items, printConfig);
    };

    return (
        <div className="card bg-base-100 shadow-md border border-base-300 dark:border-gray-700">
            <div className="card-body p-6" ref={containerRef}>
                <h2 className="card-title text-xl mb-4">Impresión</h2>

                <div className="tabs tabs-boxed mb-6 bg-base-200">
                    <button
                        className={`tab font-bold ${printMode === 'direct' ? 'tab-active bg-primary text-primary-content' : ''}`}
                        onClick={() => setPrintMode('direct')}
                    >
                        Directo
                    </button>
                    <button
                        className={`tab flex-1 font-bold ${printMode === 'tiled' ? 'tab-active  bg-primary text-primary-content' : ''}`}
                        onClick={() => setPrintMode('tiled')}
                    >
                        Tiled Print (Separado) ⭐
                    </button>
                </div>

                {printMode === 'direct' ? (
                    <div className="py-4">
                        <p className="text-sm mb-4">
                            Impresión directa estándar. Ajustará todo el lienzo a la página o páginas del sistema operativo automáticamente. Es la manera rápida de tener una vista miniatura.
                        </p>
                        <button onClick={handlePrintDirect} className="btn btn-primary w-full shadow-md shadow-primary/20">
                            🖨 Imprimir en 1 sola hoja
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm mb-4 text-base-content/80">
                            Divide tu lienzo gigante ({config.widthMm} × {config.heightMm} mm) en varias hojas de papel que puedes imprimir en tu impresora de casa y unir posteriormente formando un mural perfecto.
                        </p>

                        <div className="form-control w-full max-w-xs mb-2">
                            <label className="label">
                                <span className="label-text font-semibold">Selecciona tu papel de impresora</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={paperId}
                                onChange={(e) => setPaperId(e.target.value as any)}
                            >
                                {PRINT_PAPERS.map(p => (
                                    <option key={p.id} value={p.id}>{p.label} ({p.widthMm} × {p.heightMm} mm)</option>
                                ))}
                            </select>
                        </div>

                        <TiledPrintPreview
                            canvasW={config.widthMm}
                            canvasH={config.heightMm}
                            paperId={paperId}
                            containerWidth={containerWidth}
                        />

                        <button onClick={handlePrintTiled} className="btn btn-primary w-full mt-6 shadow-md shadow-primary/20 text-md h-12">
                            🖨 Generar PDF Separado e Imprimir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
