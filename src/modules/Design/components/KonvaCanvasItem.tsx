import { useCallback } from "react";
import type Konva from "konva";
import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { CanvasItemShape } from "../../../shared/components/CanvasItemShape";
import {
	useCanvasItemInteractions,
	type CanvasItemDragHandler,
	type CanvasItemSelectHandler,
} from "../hooks/useCanvasItemInteractions";

interface KonvaCanvasItemProps {
	item: CanvasItem;
	onSelect: CanvasItemSelectHandler;
	scaleFactor: number;
	/** Tells the stage which Konva node draws this item, for the selection's Transformer. */
	onNode: (id: string, node: Konva.Node | null) => void;
	onDragMove?: CanvasItemDragHandler;
	onDragEnd?: CanvasItemDragHandler;
	onDragStart?: CanvasItemDragHandler;
	/** Hidden while its text is edited in place over the sheet. */
	hidden?: boolean;
	onEditText?: (id: string) => void;
	onInteractionChange?: (active: boolean) => void;
}

/** A CanvasItem on the Design stage: the shared render plus selection, drag and transform. */
export function KonvaCanvasItem({
	item,
	onSelect,
	scaleFactor,
	onNode,
	onDragMove,
	onDragEnd,
	onDragStart,
	hidden = false,
	onEditText,
	onInteractionChange,
}: KonvaCanvasItemProps) {
	const { id } = item;
	// A callback ref, so the stage also hears when the node is swapped (e.g.
	// an image that fails to load becomes a placeholder group).
	const setNode = useCallback(
		(node: Konva.Node | null) => {
			onNode(id, node);
		},
		[id, onNode],
	);
	const editText = () => {
		if (isTextItem(item)) onEditText?.(item.id);
	};

	const { handleSelect, handleDragMove, handleDragEnd } = useCanvasItemInteractions({
		item,
		scaleFactor,
		onSelect,
		onDragMove,
		onDragEnd,
	});

	return (
		<CanvasItemShape
			ref={setNode}
			item={item}
			scaleFactor={scaleFactor}
			interaction={{
				draggable: true,
				visible: !hidden,
				onClick: handleSelect,
				onTap: handleSelect,
				onDblClick: editText,
				onDblTap: editText,
				onDragStart: (e) => {
					onInteractionChange?.(true);
					onDragStart?.(item.id, e);
				},
				onDragMove: handleDragMove,
				onDragEnd: handleDragEnd,
			}}
		/>
	);
}
