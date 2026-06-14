import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { activeCanvasConfigStore, saveCurrentCanvas, savedCanvasesStore, loadCanvas, deleteCanvas } from '../../../shared/store/canvasStore';

export function SaveSection() {
    const config = useStore(activeCanvasConfigStore);
    const saved = useStore(savedCanvasesStore);
    const [name, setName] = useState(config.name || 'Sin título');

    // We update name in store only when saving to avoid losing unsaved changes

    const handleSave = () => {
        activeCanvasConfigStore.set({ ...config, name });
        saveCurrentCanvas(); // We don't have thumbnail here, it's fine
        setName(name); // just reassuring
        alert('Guardado correctamente en Mis Lienzos');
    };

    return (
        <div className="card bg-base-100 shadow-md border border-base-300 dark:border-gray-700">
            <div className="card-body p-5">
                <h2 className="card-title text-lg mb-2">Guardar</h2>

                <div className="form-control w-full mb-4">
                    <label className="label">
                        <span className="label-text">Nombre del lienzo</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input input-sm input-bordered w-full"
                    />
                </div>

                <button onClick={handleSave} className="btn btn-primary btn-sm w-full mb-4">
                    💾 Guardar en navegador
                </button>

                <div className="divider my-2">Mis Lienzos</div>

                <div className="max-h-[148px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {saved.length === 0 && <p className="text-xs text-center text-base-content/50 mt-4">No hay lienzos guardados</p>}
                    {saved.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-base-200 p-2 rounded text-sm group transition-colors hover:bg-base-300">
                            <span className="truncate w-32 font-medium" title={c.name}>{c.name}</span>
                            <div className="flex gap-1 h-0 overflow-hidden group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    className="btn btn-xs btn-outline"
                                    onClick={() => loadCanvas(c.id)}
                                >
                                    Cargar
                                </button>
                                <button
                                    className="btn btn-xs btn-outline btn-error"
                                    onClick={() => deleteCanvas(c.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
