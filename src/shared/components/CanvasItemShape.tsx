import type React from "react";
import type Konva from "konva";
import { Image as KonvaImage, Text as KonvaText, type KonvaNodeEvents } from "react-konva";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem } from "../store/canvasStore";
import { useCanvasImage } from "../hooks/useCanvasImage";

/** Konva props an interactive stage (the Design editor) layers on top of the plain render. */
export type CanvasItemInteraction = KonvaNodeEvents & { draggable?: boolean };

interface CanvasItemShapeProps {
	item: CanvasItem;
	/** Stage px per logical px (container fit × zoom). */
	scaleFactor: number;
	interaction?: CanvasItemInteraction;
	ref?: React.Ref<Konva.Shape>;
}

/**
 * The one render of a CanvasItem, shared by the Design editor (interactive)
 * and the Export preview, whose stage the PNG/JPG downloads are captured
 * from. A new item property is drawn here once, so the export can't drift
 * from what the editor shows.
 */
export function CanvasItemShape(props: CanvasItemShapeProps) {
	return isTextItem(props.item) ? <CanvasTextShape {...props} /> : <CanvasImageShape {...props} />;
}

function itemGeometry(item: CanvasItem, scaleFactor: number) {
	return {
		id: item.id,
		name: "canvas-item",
		x: item.x * scaleFactor,
		y: item.y * scaleFactor,
		width: item.width * scaleFactor,
		height: item.height * scaleFactor,
		rotation: item.rotation,
	};
}

function CanvasImageShape({ item, scaleFactor, interaction, ref }: CanvasItemShapeProps) {
	const { image } = useCanvasImage(item.imageSrc);
	return (
		<KonvaImage
			ref={ref as React.Ref<Konva.Image>}
			image={image}
			{...itemGeometry(item, scaleFactor)}
			{...interaction}
		/>
	);
}

function CanvasTextShape({ item, scaleFactor, interaction, ref }: CanvasItemShapeProps) {
	return (
		<KonvaText
			ref={ref as React.Ref<Konva.Text>}
			text={item.text || ""}
			{...itemGeometry(item, scaleFactor)}
			fontSize={(item.fontSize || TEXT_DEFAULTS.fontSize) * scaleFactor}
			fontFamily={item.fontFamily || TEXT_DEFAULTS.fontFamily}
			fill={item.fillColor || TEXT_DEFAULTS.fillColor}
			fontStyle={item.fontStyle || TEXT_DEFAULTS.fontStyle}
			lineHeight={TEXT_DEFAULTS.lineHeight}
			{...interaction}
		/>
	);
}
