// Re-export shared types used inside the Design module
export type {
  CanvasConfig,
  CanvasItem,
  SavedCanvas,
} from '../../shared/store/canvasStore';

/** ID of the currently selected Konva node (null = nothing selected) */
export type SelectedItemId = string | null;
