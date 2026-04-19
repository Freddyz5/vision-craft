'use client';
import { type CanvasConfig } from '../../../shared/store/canvasStore';
import { mmToPx, mmToInch, inchToMm, pxToMm } from '../constants/presets';
import type { DimensionUnit } from '../types';

interface Props {
  config: CanvasConfig;
  unit: DimensionUnit;
  onUnitChange: (unit: DimensionUnit) => void;
  onDimChange: (widthMm: number, heightMm: number) => void;
  onOrientationToggle: () => void;
}

export default function CustomDimensions({
  config,
  unit,
  onUnitChange,
  onDimChange,
  onOrientationToggle,
}: Props) {
  const isCustom = config.presetId === 'custom';
  const isPortrait = config.orientation === 'portrait';

  const UNITS: { id: DimensionUnit; label: string }[] = [
    { id: 'mm', label: 'mm' },
    { id: 'px', label: 'px' },
    { id: 'in', label: 'in' },
  ];

  const toDisplay = (mm: number, unit: DimensionUnit): string => {
    if (unit === 'px') return String(mmToPx(mm));
    if (unit === 'in') return String(mmToInch(mm));
    return String(Math.round(mm * 10) / 10);
  }

  const toMm = (value: number, unit: DimensionUnit): number => {
    if (unit === 'px') return pxToMm(value);
    if (unit === 'in') return inchToMm(value);
    return value;
  }

  const handleInput = (axis: 'w' | 'h', raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) return;
    const mm = toMm(val, unit);
    if (axis === 'w') onDimChange(mm, config.heightMm);
    else onDimChange(config.widthMm, mm);
  }

  return (
    <section aria-labelledby="dimensions-heading">
      <article className="flex items-center justify-between mb-4">
        <h2
          id="dimensions-heading"
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-df-muted dark:text-df-muted-dark"
        >
          Dimensiones
        </h2>

        {/* Unit selector */}
        <fieldset>
          <legend className="sr-only">Unidad de medida</legend>
          <div className="flex gap-1" role="group">
            {UNITS.map(({ id, label }) => (
              <button
                key={id}
                id={`unit-${id}`}
                type="button"
                aria-pressed={unit === id}
                onClick={() => onUnitChange(id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                  unit === id
                    ? 'border-df-primary dark:border-df-primary-dark text-df-primary dark:text-df-primary-dark bg-df-primary/5 dark:bg-df-primary-dark/10'
                    : 'border-gray-200 dark:border-gray-700 text-df-muted dark:text-df-muted-dark bg-df-surface dark:bg-df-surface-dark hover:border-gray-300 dark:hover:border-gray-600 hover:text-df-ink dark:hover:text-df-ink-dark',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </article>

      {/* Width / Height inputs */}
      <article className="grid grid-cols-2 gap-6 mb-5">
        {/* Width */}
        <div>
          <label htmlFor="canvas-width" className="block text-xs font-medium text-df-muted dark:text-df-muted-dark mb-2">
            Ancho
          </label>
          <div className="relative">
            <input
              id="canvas-width"
              type="number"
              min={1}
              step={unit === 'mm' ? 0.5 : 1}
              defaultValue={toDisplay(config.widthMm, unit)}
              key={`w-${config.presetId}-${unit}`}      /* re-mount on preset / unit change */
              disabled={!isCustom}
              onBlur={(e) => handleInput('w', e.target.value)}
              className={[
                'w-full bg-transparent text-2xl font-semibold text-df-ink dark:text-df-ink-dark border-b-2 outline-none py-1.5 transition-colors duration-150',
                isCustom
                  ? 'border-gray-200 dark:border-gray-700 focus:border-df-primary dark:focus:border-df-primary-dark'
                  : 'border-gray-100 dark:border-gray-800 text-df-muted dark:text-df-muted-dark cursor-not-allowed',
              ].join(' ')}
            />
            <span className="absolute right-0 bottom-2.5 text-xs text-df-muted dark:text-df-muted-dark pointer-events-none">
              {unit}
            </span>
          </div>
        </div>

        {/* Height */}
        <div>
          <label htmlFor="canvas-height" className="block text-xs font-medium text-df-muted dark:text-df-muted-dark mb-2">
            Alto
          </label>
          <div className="relative">
            <input
              id="canvas-height"
              type="number"
              min={1}
              step={unit === 'mm' ? 0.5 : 1}
              defaultValue={toDisplay(config.heightMm, unit)}
              key={`h-${config.presetId}-${unit}`}
              disabled={!isCustom}
              onBlur={(e) => handleInput('h', e.target.value)}
              className={[
                'w-full bg-transparent text-2xl font-semibold text-df-ink dark:text-df-ink-dark border-b-2 outline-none py-1.5 transition-colors duration-150',
                isCustom
                  ? 'border-gray-200 dark:border-gray-700 focus:border-df-primary dark:focus:border-df-primary-dark'
                  : 'border-gray-100 dark:border-gray-800 text-df-muted dark:text-df-muted-dark cursor-not-allowed',
              ].join(' ')}
            />
            <span className="absolute right-0 bottom-2.5 text-xs text-df-muted dark:text-df-muted-dark pointer-events-none">
              {unit}
            </span>
          </div>
        </div>
      </article>

      {/* Custom helper text */}
      {!isCustom && (
        <p className="text-[11px] text-df-muted dark:text-df-muted-dark mb-5">
          Selecciona <strong className="font-semibold text-df-ink dark:text-df-ink-dark">Personalizado</strong> en la grilla para editar las dimensiones.
        </p>
      )}

      {/* Orientation toggle */}
      <article>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-df-muted dark:text-df-muted-dark mb-3">
          Orientación
        </h3>
        <div className="flex gap-3">
          {/* Portrait */}
          <button
            id="orient-portrait"
            type="button"
            aria-pressed={isPortrait}
            onClick={() => !isPortrait && onOrientationToggle()}
            className={[
              'flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 border-2',
              isPortrait
                ? 'bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20'
                : 'border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm',
            ].join(' ')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="6" y="2" width="12" height="20" rx="2" />
            </svg>
            Portrait
          </button>

          {/* Landscape */}
          <button
            id="orient-landscape"
            type="button"
            aria-pressed={!isPortrait}
            onClick={() => isPortrait && onOrientationToggle()}
            className={[
              'flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 border-2',
              !isPortrait
                ? 'bg-df-primary dark:bg-df-primary-dark text-white border-transparent shadow-md shadow-df-primary/25 dark:shadow-df-primary-dark/20'
                : 'border-gray-200 dark:border-gray-700 text-df-ink dark:text-df-ink-dark bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:shadow-sm',
            ].join(' ')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
            </svg>
            Landscape
          </button>
        </div>
      </article>
    </section>
  );
}
