import type Konva from "konva";
import { isTextItem, updateItem, type CanvasItem } from "../../../shared/store/canvasStore";

export type CanvasItemDragHandler = (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;

/** `additive`: Shift, Cmd or Ctrl was held, so the item joins/leaves the selection. */
export type CanvasItemSelectHandler = (id: string, additive: boolean) => void;

interface UseCanvasItemInteractionsOptions {
	item: CanvasItem;
	scaleFactor: number;
	/** Ref to the underlying Konva node (Image, Text, ...) the Transformer attaches to. */
	nodeRef: React.RefObject<Konva.Node | null>;
	onSelect: CanvasItemSelectHandler;
	onDragMove?: CanvasItemDragHandler;
	onDragEnd?: CanvasItemDragHandler;
}

/**
 * Shared drag/select/resize behavior for items placed on the Konva design
 * stage (see KonvaCanvasItem). The selection's single Transformer lives in
 * KonvaCanvas; keyboard shortcuts in useEditorShortcuts.
 */
export function useCanvasItemInteractions({
	item,
	scaleFactor,
	nodeRef,
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

	const handleTransformEnd = () => {
		const node = nodeRef.current;
		if (!node) return;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();

		// Reset internal scaling and update width/height directly
		node.scaleX(1);
		node.scaleY(1);

		const patch: Partial<CanvasItem> = {
			x: node.x() / scaleFactor,
			y: node.y() / scaleFactor,
			rotation: node.rotation(),
			width: item.width * scaleX,
			height: item.height * scaleY,
		};

		// Grow/shrink the font size along with its box so resizing a text item
		// scales the text instead of just re-wrapping it inside a bigger box.
		if (isTextItem(item)) {
			const growth = (scaleX + scaleY) / 2;
			patch.fontSize = Math.max(8, Math.round((item.fontSize || 24) * growth));
		}

		updateItem(item.id, patch);
	};

	return { handleSelect, handleDragMove, handleDragEnd, handleTransformEnd };
}
