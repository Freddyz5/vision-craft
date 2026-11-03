import React, { useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { CanvasItemShape } from "../../../shared/components/CanvasItemShape";
import {
	useCanvasItemInteractions,
	type CanvasItemDragHandler,
} from "../hooks/useCanvasItemInteractions";

const HANDLE_COLOR = "#7C3AED";

// Text boxes resize by the corners or sideways; the font size follows the box.
const TEXT_ANCHORS = [
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right",
	"middle-left",
	"middle-right",
];

interface KonvaCanvasItemProps {
	item: CanvasItem;
	isSelected: boolean;
	onSelect: (id: string) => void;
	scaleFactor: number;
	onDragMove?: CanvasItemDragHandler;
	onDragEnd?: CanvasItemDragHandler;
	/** Hidden while its text is edited in place over the sheet. */
	hidden?: boolean;
	onEditText?: (id: string) => void;
	onInteractionChange?: (active: boolean) => void;
}

/** A CanvasItem on the Design stage: the shared render plus selection and its Transformer. */
export function KonvaCanvasItem({
	item,
	isSelected,
	onSelect,
	scaleFactor,
	onDragMove,
	onDragEnd,
	hidden = false,
	onEditText,
	onInteractionChange,
}: KonvaCanvasItemProps) {
	const nodeRef = useRef<Konva.Node>(null);
	const isText = isTextItem(item);
	const minWidth = isText ? 30 : 10;
	const editText = () => {
		if (isText) onEditText?.(item.id);
	};

	const { trRef, handleSelect, handleDragMove, handleDragEnd, handleTransformEnd } =
		useCanvasItemInteractions({
			item,
			isSelected,
			scaleFactor,
			nodeRef,
			onSelect,
			onDragMove,
			onDragEnd,
		});

	return (
		<React.Fragment>
			<CanvasItemShape
				ref={nodeRef}
				item={item}
				scaleFactor={scaleFactor}
				interaction={{
					draggable: true,
					visible: !hidden,
					onClick: handleSelect,
					onTap: handleSelect,
					onDblClick: editText,
					onDblTap: editText,
					onDragStart: () => onInteractionChange?.(true),
					onDragMove: handleDragMove,
					onDragEnd: handleDragEnd,
					onTransformStart: () => onInteractionChange?.(true),
					onTransformEnd: () => {
						handleTransformEnd();
						onInteractionChange?.(false);
					},
				}}
			/>
			{isSelected && (
				<Transformer
					ref={trRef}
					borderStroke={HANDLE_COLOR}
					anchorStroke={HANDLE_COLOR}
					anchorFill="#FFFFFF"
					anchorSize={9}
					anchorCornerRadius={2}
					rotateAnchorOffset={24}
					enabledAnchors={isText ? TEXT_ANCHORS : undefined}
					boundBoxFunc={(oldBox, newBox) => {
						if (newBox.width < minWidth || newBox.height < 10) return oldBox;
						return newBox;
					}}
				/>
			)}
		</React.Fragment>
	);
}
