import React, { useRef } from "react";
import { Text as KonvaText, Transformer } from "react-konva";
import type { CanvasItem } from "../../../shared/store/canvasStore";
import type Konva from "konva";
import { useCanvasItemInteractions } from "../hooks/useCanvasItemInteractions";

interface KonvaTextItemProps {
	item: CanvasItem;
	isSelected: boolean;
	onSelect: (id: string) => void;
	scaleFactor: number;
	onDragMove?: (id: string, e: any) => void;
	onDragEnd?: (id: string, e: any) => void;
}

export function KonvaTextItem({
	item,
	isSelected,
	onSelect,
	scaleFactor,
	onDragMove,
	onDragEnd,
}: KonvaTextItemProps) {
	const textRef = useRef<Konva.Text>(null);

	const { trRef, handleSelect, handleDragMove, handleDragEnd, handleTransformEnd } =
		useCanvasItemInteractions({
			item,
			isSelected,
			scaleFactor,
			nodeRef: textRef,
			onSelect,
			onDragMove,
			onDragEnd,
		});

	return (
		<React.Fragment>
			<KonvaText
				ref={textRef}
				text={item.text || ""}
				x={item.x * scaleFactor}
				y={item.y * scaleFactor}
				width={item.width * scaleFactor}
				height={item.height * scaleFactor}
				fontSize={(item.fontSize || 24) * scaleFactor}
				fontFamily={item.fontFamily || "Inter"}
				fill={item.fillColor || "#7C3AED"}
				fontStyle={item.fontStyle || "normal"}
				rotation={item.rotation}
				draggable
				onClick={handleSelect}
				onTap={handleSelect}
				onDragMove={handleDragMove}
				onDragEnd={handleDragEnd}
				onTransformEnd={handleTransformEnd}
			/>
			{isSelected && (
				<Transformer
					ref={trRef}
					enabledAnchors={[
						"top-left",
						"top-right",
						"bottom-left",
						"bottom-right",
						"middle-left",
						"middle-right",
					]}
					boundBoxFunc={(oldBox, newBox) => {
						if (newBox.width < 30 || newBox.height < 10) return oldBox;
						return newBox;
					}}
				/>
			)}
		</React.Fragment>
	);
}
