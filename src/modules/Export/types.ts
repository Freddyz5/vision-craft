// Re-export shared types used inside the Export module
export type {
  CanvasConfig,
  CanvasItem,
  SavedCanvas,
} from '../../shared/store/canvasStore';

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
  /** Scale applied to the original canvas before tiling (1 = original size) */
  canvasScale: number;
  /** Start offsets (mm) for the first tile (can be negative to allow shifting cuts without cropping) */
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
    canvasScale?: number;
    /** 0..paperWidthMm (moves the first cut line inside the canvas) */
    shiftXMm?: number;
    /** 0..paperHeightMm (moves the first cut line inside the canvas) */
    shiftYMm?: number;
  },
): PrintConfig {
  const paper = PRINT_PAPERS.find((p) => p.id === paperId)!;
  const canvasScale = options?.canvasScale ?? 1;
  const effectiveCanvasWidthMm = canvasWidthMm * canvasScale;
  const effectiveCanvasHeightMm = canvasHeightMm * canvasScale;

  const shiftXMm = options?.shiftXMm ?? 0;
  const shiftYMm = options?.shiftYMm ?? 0;

  const startXMm = shiftXMm - paper.widthMm;
  const startYMm = shiftYMm - paper.heightMm;

  const cols = Math.max(
    1,
    Math.ceil((effectiveCanvasWidthMm - startXMm) / paper.widthMm),
  );
  const rows = Math.max(
    1,
    Math.ceil((effectiveCanvasHeightMm - startYMm) / paper.heightMm),
  );

  const tiles: PrintTile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        col: c,
        row: r,
        offsetXMm: startXMm + c * paper.widthMm,
        offsetYMm: startYMm + r * paper.heightMm,
      });
    }
  }

  return {
    paperPresetId: paperId,
    paperWidthMm: paper.widthMm,
    paperHeightMm: paper.heightMm,
    canvasScale,
    startXMm,
    startYMm,
    cols,
    rows,
    tiles,
  };
}
