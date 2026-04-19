'use client';
import { type CanvasConfig } from '../../../shared/store/canvasStore';
import { mmToInch, mmToPx } from '../constants/presets';
import type { DimensionUnit } from '../types';
import { PRESETS } from '../constants/presets';
import ImagesBadge from './ImagesBadge';
import { useState } from 'react';
import { buildDefaultName } from '../utils/buildDefaultName';

interface Props {
  config: CanvasConfig;
  unit: DimensionUnit;
  setConfig: React.Dispatch<React.SetStateAction<CanvasConfig>>;
  activeCanvasConfigStore: any;
}

const InfoTile = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="bg-df-surface dark:bg-df-surface-dark rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-df-muted dark:text-df-muted-dark">
        {label}
      </p>
      <p className="text-xs font-bold text-df-ink dark:text-df-ink-dark mt-1 leading-tight truncate">
        {value}
      </p>
    </article>
  )
}

export default function CanvasLivePreview({
  config,
  unit,
  setConfig,
  activeCanvasConfigStore
}: Props) {

  const [nameError, setNameError] = useState('');

  // ── Proportional preview box ──────────────────────────────────────────────
  // Fit inside a 200×260 px container
  const maxW = 200;
  const maxH = 260;
  const ratio = config.widthMm / config.heightMm;

  let previewW: number;
  let previewH: number;
  if (ratio >= maxW / maxH) {
    previewW = maxW;
    previewH = Math.round(maxW / ratio);
  } else {
    previewH = maxH;
    previewW = Math.round(maxH * ratio);
  }

  const presetLabel =
    PRESETS.find((p) => p.id === config.presetId)?.label ?? 'Personalizado';

  const fmt = (mm: number, unit: DimensionUnit): string => {
    if (unit === 'px') return `${mmToPx(mm)} px`;
    if (unit === 'in') return `${mmToInch(mm).toFixed(1)} in`;
    return `${Math.round(mm * 10) / 10} mm`;
  }

  const handleGoToEditor = () => {
    if (!config.name.trim()) {
      setNameError('Dale un nombre a tu lienzo');
      return;
    }
    setNameError('');
    activeCanvasConfigStore.set(config);
    window.location.href = '/design';
  }

  return (
    <aside
      className="w-96 shrink-0 sticky top-24 -mt-75 bg-gray-100 dark:bg-[#161f30] rounded-3xl p-5 space-y-4 border-2 border-df-primary/30"
      aria-label="Vista previa del lienzo"
    >
      {/* Label */}
      <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-center text-df-muted dark:text-df-muted-dark">
        Vista previa
      </p>

      {/* Canvas proportional mockup */}
      <section className="flex items-center justify-center" style={{ minHeight: maxH + 32 }}>
        <article
          className="relative rounded-xl border-2 border-df-primary/30 dark:border-df-primary-dark/30 bg-white dark:bg-gray-800 shadow-lg flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-hidden"
          style={{ width: previewW, height: previewH }}
          aria-label={`Vista previa: ${fmt(config.widthMm, unit)} × ${fmt(config.heightMm, unit)}`}
        >
          {/* Grid lines overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #6c63ff 0, #6c63ff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #6c63ff 0, #6c63ff 1px, transparent 1px, transparent 20px)',
            }}
          />
          {/* Center icon */}
          <svg className="w-6 h-6 text-df-primary/40 dark:text-df-primary-dark/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <p className="text-[9px] font-semibold text-df-primary/50 dark:text-df-primary-dark/50 uppercase tracking-widest text-center px-2">
            Tu lienzo
          </p>
        </article>
      </section>

      {/* Info tiles */}
      <article className="grid grid-cols-2 gap-2">
        <InfoTile label="Ancho" value={fmt(config.widthMm, unit)} />
        <InfoTile label="Alto" value={fmt(config.heightMm, unit)} />
        <InfoTile label="Formato" value={presetLabel} />
        <InfoTile
          label="Orientación"
          value={config.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
        />
      </article>

      {/* Images badge */}
      <ImagesBadge />

      <section aria-labelledby="name-heading">
        <h2
          id="name-heading"
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-df-muted dark:text-df-muted-dark mb-3"
        >
          Nombre del lienzo
        </h2>
        <input
          id="canvas-name"
          type="text"
          value={config.name}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder={buildDefaultName()}
          className="w-full bg-transparent text-xl font-semibold text-df-ink dark:text-df-ink-dark border-b-2 border-gray-200 dark:border-gray-700 focus:border-df-primary dark:focus:border-df-primary-dark outline-none py-1.5 transition-colors duration-150 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        {nameError && (
          <p className="mt-1.5 text-xs text-red-500 font-medium">{nameError}</p>
        )}
      </section>

      <button
        id="go-to-editor-btn"
        type="button"
        onClick={handleGoToEditor}
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-2.5 rounded-full font-bold text-base text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-df-primary/30 dark:shadow-df-primary-dark/20"
      >
        Ir al Editor
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </aside >
  );
}
