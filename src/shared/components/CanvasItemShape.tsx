import type React from "react";
import type Konva from "konva";
import {
	Group,
	Image as KonvaImage,
	Rect,
	Text as KonvaText,
	type KonvaNodeEvents,
} from "react-konva";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem } from "../store/canvasStore";
import { useCanvasImage } from "../hooks/useCanvasImage";
import { EDITOR_ONLY } from "../utils/stageCapture";

/** Konva props an interactive stage (the Design editor) layers on top of the plain render. */
export type CanvasItemInteraction = KonvaNodeEvents & { draggable?: boolean };

interface CanvasItemShapeProps {
	item: CanvasItem;
	/** Stage px per logical px (container fit × zoom). */
	scaleFactor: number;
	interaction?: CanvasItemInteraction;
	/** The outermost node, which a Transformer can attach to. */
	ref?: React.Ref<Konva.Node>;
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

function CanvasImageShape(props: CanvasItemShapeProps) {
	const { item, scaleFactor, interaction, ref } = props;
	const { image, status } = useCanvasImage(item.imageSrc);
	if (status === "error") return <MissingImagePlaceholder {...props} />;
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

/**
 * Stands in for an image that failed to load (e.g. a link whose server sends
 * no CORS headers), so it stays visible, selectable and removable instead of
 * leaving an invisible gap. Editor-only: exports leave it out.
 */
function MissingImagePlaceholder({ item, scaleFactor, interaction, ref }: CanvasItemShapeProps) {
	const width = item.width * scaleFactor;
	const height = item.height * scaleFactor;
	return (
		<Group
			ref={ref as React.Ref<Konva.Group>}
			{...itemGeometry(item, scaleFactor)}
			name={`canvas-item ${EDITOR_ONLY}`}
			{...interaction}
		>
			<Rect
				width={width}
				height={height}
				fill="#FFFBEB"
				stroke="#F59E0B"
				strokeWidth={1.5}
				dash={[6, 4]}
			/>
			<KonvaText
				text="No se pudo cargar la imagen"
				width={width}
				height={height}
				padding={8}
				align="center"
				verticalAlign="middle"
				fontFamily={TEXT_DEFAULTS.fontFamily}
				fontSize={12}
				fill="#92400E"
			/>
		</Group>
	);
}
