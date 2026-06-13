// Re-export shared types used inside the Canvas module
export type {
  CanvasConfig,
  CanvasPresetId,
  CanvasItem,
  SavedCanvas,
} from '../../shared/store/canvasStore';

export type { CanvasPreset } from './constants/presets';

/** Unit the user is currently viewing dimensions in */
export type DimensionUnit = 'mm' | 'px' | 'in';
