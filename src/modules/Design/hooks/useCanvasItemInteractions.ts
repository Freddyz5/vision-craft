import type Konva from "konva";
import { updateItem, type CanvasItem } from "../../../shared/store/canvasStore";

export type CanvasItemDragHandler = (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;

/** `additive`: Shift, Cmd or Ctrl was held, so the item joins/leaves the selection. */
export type CanvasItemSelectHandler = (id: string, additive: boolean) => void;

interface UseCanvasItemInteractionsOptions {
	item: CanvasItem;
	scaleFactor: number;
	onSelect: CanvasItemSelectHandler;
	onDragMove?: CanvasItemDragHandler;
	onDragEnd?: CanvasItemDragHandler;
}

/**
 * Shared drag/select behavior for items placed on the Konva design stage
 * (see KonvaCanvasItem). Resizing/rotating is handled once for the whole
 * selection by the Transformer in KonvaCanvas; keyboard shortcuts live in
 * useEditorShortcuts.
 */
export function useCanvasItemInteractions({
	item,
	scaleFactor,
	onSelect,
	onDragMove,
	onDragEnd,
}: UseCanvasItemInteractionsOptions) {
	const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
		const evt = e.evt as MouseEvent;
		onSelect(item.id, !!(evt.shiftKey || evt.metaKey || evt.ctrlKey));
	};

	const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => onDragMove?.(item.id, e);

	const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
		if (onDragEnd) {
			onDragEnd(item.id, e);
			return;
		}
		updateItem(item.id, {
			x: e.target.x() / scaleFactor,
			y: e.target.y() / scaleFactor,
		});
	};

	return { handleSelect, handleDragMove, handleDragEnd };
}
