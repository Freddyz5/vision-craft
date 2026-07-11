// Re-export shared domain types used inside the Boards module. The source of
// truth for the data model lives in the store, not here.
export type { CanvasConfig, CanvasItem, SavedCanvas } from "../../shared/store/canvasStore";
