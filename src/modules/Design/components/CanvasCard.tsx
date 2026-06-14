import React from 'react';
import { loadCanvas, duplicateCanvas, deleteCanvas } from '../../../shared/store/canvasStore';


interface Props {
  canvas: any;
}

const CanvasCard = ({
  canvas
}: Props) => {
  return (
    <li key={canvas.id} className="rounded-2xl border-2 border-df-primary/60 shadow-sm">
      <div className="card-body p-4">
        <h4 className="card-title text-base font-bold truncate">{canvas.name}</h4>
        <p className="text-xs text-df-muted dark:text-df-muted-dark">
          {new Date(canvas.createdAt).toLocaleDateString('es-MX')} • {canvas.items.length} imágenes
        </p>
        <p className="text-xs text-df-muted dark:text-df-muted-dark">
          {canvas.config.widthMm} × {canvas.config.heightMm} mm
        </p>

        {canvas.thumbnail && (
          <img src={canvas.thumbnail} alt="Thumbnail" className="w-full h-32 object-contain border border-df-primary/30 bg-gray-200 dark:bg-gray-800 rounded my-2" />
        )}

        <div className="flex gap-2 items-center justify-center">
          <button
            onClick={() => loadCanvas(canvas.id)}
            className="flex w-full items-center justify-center px-6 py-2.5 rounded-full font-semibold bg-df-primary text-white hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            Cargar
          </button>

          <button
            onClick={() => duplicateCanvas(canvas.id)}
            className="border p-2.5 rounded-full hover:opacity-70 transition-opacity shadow-sm cursor-pointer"
            title="Duplicar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (confirm('¿Eliminar este lienzo?')) {
                deleteCanvas(canvas.id);
              }
            }}
            className="border border-red-500 text-red-500 p-2.5 rounded-full hover:opacity-70 transition-opacity shadow-sm cursor-pointer"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
};

export default CanvasCard;