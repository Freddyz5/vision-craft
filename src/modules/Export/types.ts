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
): PrintConfig {
  const paper = PRINT_PAPERS.find((p) => p.id === paperId)!;
  const cols = Math.ceil(canvasWidthMm / paper.widthMm);
  const rows = Math.ceil(canvasHeightMm / paper.heightMm);

  const tiles: PrintTile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        col: c,
        row: r,
        offsetXMm: c * paper.widthMm,
        offsetYMm: r * paper.heightMm,
      });
    }
  }

  return {
    paperPresetId: paperId,
    paperWidthMm: paper.widthMm,
    paperHeightMm: paper.heightMm,
    cols,
    rows,
    tiles,
  };
}
