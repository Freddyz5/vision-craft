import React, { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { activeCanvasConfigStore, activeCanvasItemsStore, exportJson, importJson } from '../../../shared/store/canvasStore';

export function JsonSection() {
    const config = useStore(activeCanvasConfigStore);
    const items = useStore(activeCanvasItemsStore);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        // Assemble current canvas to export
        const currentCanvas = {
            id: crypto.randomUUID(),
            name: config.name || 'Exported Canvas',
            createdAt: new Date().toISOString(),
            config,
            items
        };
        exportJson(currentCanvas as any);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await importJson(file);
            alert('Lienzo importado exitosamente.');
            window.location.href = '/design';
        } catch (err: any) {
            alert('Error importando: ' + err.message);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="card bg-base-100 shadow-md border border-base-300 dark:border-gray-700">
            <div className="card-body p-6">
                <h2 className="card-title text-lg mb-2">Exportar / Importar JSON</h2>
                <p className="text-sm text-base-content/70 mb-4 h-10">
                    Guarda el progreso en tu computadora o comparte el archivo de configuración.
                </p>

                <div className="flex flex-col gap-3">
                    <button onClick={handleExport} className="btn btn-outline btn-sm w-full">
                        ⬇ Exportar a .json
                    </button>

                    <button onClick={handleImportClick} className="btn btn-outline btn-sm w-full">
                        ⬆ Importar desde .json
                    </button>
                    <input
                        type="file"
                        accept="application/json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}
