import type { CanvasPreset } from '../constants/presets';

export const PresetCard = ({
  preset,
  isSelected,
  onSelect,
}: {
  preset: CanvasPreset;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  // Derive aspect ratio for the visual preview rectangle
  const maxSide = 36; // px inside the card icon area
  const ratio = preset.widthMm / preset.heightMm;
  const isWider = ratio >= 1;
  const rectW = isWider ? maxSide : Math.round(maxSide * ratio);
  const rectH = isWider ? Math.round(maxSide / ratio) : maxSide;

  return (
    <button
      type="button"
      id={`preset-${preset.id}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(preset.id)}
      className={[
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer outline-none',
        isSelected
          ? 'border-df-primary dark:border-df-primary-dark bg-df-primary/5 dark:bg-df-primary-dark/10 shadow-lg shadow-df-primary/10 dark:shadow-df-primary-dark/15 -translate-y-0.5'
          : 'border-gray-200 dark:border-gray-700 bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      {/* Default badge */}
      {preset.isDefault && (
        <span
          aria-label="Formato por defecto"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-df-primary dark:bg-df-primary-dark text-white text-[9px] font-bold tracking-[0.1em] uppercase whitespace-nowrap shadow-sm"
        >
          Defecto
        </span>
      )}

      {/* Proportional shape preview */}
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        {preset.id === 'custom' ? (
          // Custom icon: dashed square with +
          <svg
            width={maxSide}
            height={maxSide}
            viewBox={`0 0 ${maxSide} ${maxSide}`}
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="1" y="1"
              width={maxSide - 2} height={maxSide - 2}
              rx="3"
              strokeDasharray="4 3"
              className={isSelected ? 'stroke-df-primary dark:stroke-df-primary-dark' : 'stroke-gray-400 dark:stroke-gray-500'}
              strokeWidth="1.5"
            />
            <line
              x1={maxSide / 2} y1={maxSide / 2 - 7}
              x2={maxSide / 2} y2={maxSide / 2 + 7}
              className={isSelected ? 'stroke-df-primary dark:stroke-df-primary-dark' : 'stroke-gray-400 dark:stroke-gray-500'}
              strokeWidth="1.5" strokeLinecap="round"
            />
            <line
              x1={maxSide / 2 - 7} y1={maxSide / 2}
              x2={maxSide / 2 + 7} y2={maxSide / 2}
              className={isSelected ? 'stroke-df-primary dark:stroke-df-primary-dark' : 'stroke-gray-400 dark:stroke-gray-500'}
              strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        ) : (
          // Proportional rectangle
          <div
            style={{ width: rectW, height: rectH }}
            className={[
              'rounded-sm border-2 transition-colors duration-200',
              isSelected
                ? 'border-df-primary dark:border-df-primary-dark bg-df-primary/10 dark:bg-df-primary-dark/20'
                : 'border-gray-400 dark:border-gray-500 bg-gray-200 dark:bg-gray-700',
            ].join(' ')}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p
          className={[
            'text-xs font-semibold leading-tight',
            isSelected
              ? 'text-df-primary dark:text-df-primary-dark'
              : 'text-df-ink dark:text-df-ink-dark',
          ].join(' ')}
        >
          {preset.label}
        </p>
        {preset.id !== 'custom' && (
          <p className="text-[10px] text-df-muted dark:text-df-muted-dark mt-0.5">
            {preset.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default PresetCard;
