// Re-export shared types used inside the Export module
export type {
  CanvasConfig,
  CanvasItem,
  SavedCanvas,
} from '../../shared/store/canvasStore';

/**
 * The 4 mutually-exclusive export tracks shown in the Export sidebar.
 * - "poster": split the canvas across multiple sheets to print large
 * - "fit-page": auto-scale the canvas to fit a single sheet
 * - "image": download as PNG/JPG
 * - "data": save locally / export-import JSON
 */
export type ExportMode = 'poster' | 'fit-page' | 'image' | 'data';

export const EXPORT_MODE_OPTIONS: { mode: ExportMode; title: string; description: string }[] = [
  {
    mode: 'fit-page',
    title: 'Imprimir en A4',
    description: 'Escala el lienzo para caber en una sola hoja',
  },
  {
    mode: 'poster',
    title: 'Imprimir en grande',
    description: 'Divide el lienzo en varias hojas para armar un póster',
  },
  {
    mode: 'image',
    title: 'Descargar imagen',
    description: 'PNG o JPG en alta resolución',
  },
  {
    mode: 'data',
    title: 'Guardar / JSON',
    description: 'Guarda localmente o exporta/importa como JSON',
  },
];

/** A single tile in the tiled-print grid */
export interface PrintTile {
  col: number;
  row: number;
  /** Offset in the original canvas coordinate system (mm) */
  offsetXMm: number;
  offsetYMm: number;
}

export interface PrintConfig {
  /** Paper size to print on */
  paperPresetId: 'a4' | 'a3' | 'us-letter';
  paperWidthMm: number;
  paperHeightMm: number;
  /** Poster size in physical mm (always an exact multiple of the chosen paper). */
  posterWidthMm: number;
  posterHeightMm: number;
  /** Scale applied to the original canvas so the poster area is fully covered. */
  canvasScale: number;
  /** Visible area of a single sheet in original-canvas coordinates. */
  pageViewportWidthMm: number;
  pageViewportHeightMm: number;
  /** Start offsets in original-canvas coordinates, centered to avoid sliver pages. */
  startXMm: number;
  startYMm: number;
  /** Calculated grid */
  cols: number;
  rows: number;
  tiles: PrintTile[];
}

export const PRINT_PAPERS = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
  { id: 'us-letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4 },
] as const;

/** Build a PrintConfig from canvas and paper dimensions */
export function buildPrintConfig(
  canvasWidthMm: number,
  canvasHeightMm: number,
  paperId: 'a4' | 'a3' | 'us-letter',
  options?: {
    cols?: number;
    rows?: number;
    /** Paper orientation. 'landscape' swaps the preset's width/height. Default: 'portrait' */
    orientation?: 'portrait' | 'landscape';
  },
): PrintConfig {
  const preset = PRINT_PAPERS.find((p) => p.id === paperId)!;
  const orientation = options?.orientation ?? 'portrait';
  const paper = orientation === 'landscape'
    ? { ...preset, widthMm: preset.heightMm, heightMm: preset.widthMm }
    : preset;
  const cols = Math.max(1, Math.round(options?.cols ?? Math.ceil(canvasWidthMm / paper.widthMm)));
  const rows = Math.max(1, Math.round(options?.rows ?? Math.ceil(canvasHeightMm / paper.heightMm)));
  const posterWidthMm = cols * paper.widthMm;
  const posterHeightMm = rows * paper.heightMm;

  // Scale the canvas to fully cover the poster area so every selected sheet
  // contains meaningful content instead of leaving a thin "remainder" page.
  const canvasScale = Math.max(
    posterWidthMm / canvasWidthMm,
    posterHeightMm / canvasHeightMm,
    0.01,
  );
  const pageViewportWidthMm = paper.widthMm / canvasScale;
  const pageViewportHeightMm = paper.heightMm / canvasScale;
  const totalViewportWidthMm = cols * pageViewportWidthMm;
  const totalViewportHeightMm = rows * pageViewportHeightMm;
  const startXMm = Math.max(0, (canvasWidthMm - totalViewportWidthMm) / 2);
  const startYMm = Math.max(0, (canvasHeightMm - totalViewportHeightMm) / 2);

  const tiles: PrintTile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        col: c,
        row: r,
        offsetXMm: startXMm + c * pageViewportWidthMm,
        offsetYMm: startYMm + r * pageViewportHeightMm,
      });
    }
  }

  return {
    paperPresetId: paperId,
    paperWidthMm: paper.widthMm,
    paperHeightMm: paper.heightMm,
    posterWidthMm,
    posterHeightMm,
    canvasScale,
    pageViewportWidthMm,
    pageViewportHeightMm,
    startXMm,
    startYMm,
    cols,
    rows,
    tiles,
  };
}
