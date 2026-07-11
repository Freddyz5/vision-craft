import React, { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import type { CanvasItem } from "../../../shared/store/canvasStore";
import type Konva from "konva";
import { useCanvasItemInteractions } from "../hooks/useCanvasItemInteractions";

function useImage(url?: string) {
	const [image, setImage] = useState<HTMLImageElement | undefined>();
	useEffect(() => {
		if (!url) return;
		const img = new window.Image();
		img.crossOrigin = "Anonymous";
		img.src = url;
		img.onload = () => setImage(img);
	}, [url]);
	return [image];
}

interface KonvaImageItemProps {
	item: CanvasItem;
	isSelected: boolean;
	onSelect: (id: string) => void;
	scaleFactor: number;
	onDragMove?: (id: string, e: any) => void;
	onDragEnd?: (id: string, e: any) => void;
}

export function KonvaImageItem({
	item,
	isSelected,
	onSelect,
	scaleFactor,
	onDragMove,
	onDragEnd,
}: KonvaImageItemProps) {
	const [image] = useImage(item.imageSrc);
	const imageRef = useRef<Konva.Image>(null);

	const { trRef, handleSelect, handleDragMove, handleDragEnd, handleTransformEnd } =
		useCanvasItemInteractions({
			item,
			isSelected,
			scaleFactor,
			nodeRef: imageRef,
			onSelect,
			onDragMove,
			onDragEnd,
		});

	return (
		<React.Fragment>
			<KonvaImage
				ref={imageRef}
				image={image}
				x={item.x * scaleFactor}
				y={item.y * scaleFactor}
				width={item.width * scaleFactor}
				height={item.height * scaleFactor}
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
					boundBoxFunc={(oldBox, newBox) => {
						if (newBox.width < 10 || newBox.height < 10) return oldBox;
						return newBox;
					}}
				/>
			)}
		</React.Fragment>
	);
}
