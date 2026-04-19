import type { CanvasPresetId } from '../../../shared/store/canvasStore';

export interface CanvasPreset {
  id: CanvasPresetId;
  label: string;
  description: string;
  widthMm: number;
  heightMm: number;
  isDefault?: boolean;
}

/**
 * Conversion helper: mm → logical pixels at 96 dpi
 * 1 inch = 25.4 mm, 1 inch = 96 px  →  1 mm = 96/25.4 ≈ 3.7795 px
 */
export const MM_TO_PX = 96 / 25.4;

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

export function pxToMm(px: number): number {
  return Math.round((px / MM_TO_PX) * 10) / 10;
}

export function mmToInch(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}

export function inchToMm(inch: number): number {
  return Math.round(inch * 25.4 * 10) / 10;
}

export const PRESETS: CanvasPreset[] = [
  {
    id: 'a4-portrait',
    label: 'A4 Portrait',
    description: '210 × 297 mm',
    widthMm: 210,
    heightMm: 297,
    isDefault: true,
  },
  {
    id: 'a4-landscape',
    label: 'A4 Landscape',
    description: '297 × 210 mm',
    widthMm: 297,
    heightMm: 210,
  },
  {
    id: 'a3-portrait',
    label: 'A3 Portrait',
    description: '297 × 420 mm',
    widthMm: 297,
    heightMm: 420,
  },
  {
    id: 'a3-landscape',
    label: 'A3 Landscape',
    description: '420 × 297 mm',
    widthMm: 420,
    heightMm: 297,
  },
  {
    id: 'us-letter',
    label: 'US Letter',
    description: '216 × 279 mm',
    widthMm: 215.9,
    heightMm: 279.4,
  },
  {
    id: 'poster-small',
    label: 'Poster S',
    description: '457 × 610 mm',
    widthMm: 457,
    heightMm: 610,
  },
  {
    id: 'poster-large',
    label: 'Poster L',
    description: '610 × 914 mm',
    widthMm: 610,
    heightMm: 914,
  },
  {
    id: 'square-mini',
    label: 'Cuadrado',
    description: '200 × 200 mm',
    widthMm: 200,
    heightMm: 200,
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Define tus propias medidas',
    widthMm: 210,
    heightMm: 297,
  },
];

export function getPreset(id: CanvasPresetId): CanvasPreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
