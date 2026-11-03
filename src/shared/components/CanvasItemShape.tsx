import type React from "react";
import { useEffect, useRef } from "react";
import Konva from "konva";
import type { Filter } from "konva/lib/Node";
import {
	Group,
	Image as KonvaImage,
	Rect,
	Text as KonvaText,
	type KonvaNodeEvents,
} from "react-konva";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem, type ImageAdjust } from "../store/canvasStore";
import { useCanvasImage } from "../hooks/useCanvasImage";
import { EDITOR_ONLY } from "../utils/stageCapture";
import { traceShape } from "../utils/shapePath";

/** Konva props an interactive stage (the Design editor) layers on top of the plain render. */
export type CanvasItemInteraction = KonvaNodeEvents & {
	draggable?: boolean;
	visible?: boolean;
	listening?: boolean;
};

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

/** Biggest bitmap a filtered photo is cached at (px), to bound memory. */
const MAX_FILTER_CACHE_PIXELS = 12_000_000;

/** Konva filters for an item's adjustments, in a stable order. */
function photoFilters(adjust: ImageAdjust | undefined): Filter[] {
	if (!adjust) return [];
	const filters: Filter[] = [];
	if (adjust.filter === "bw") filters.push(Konva.Filters.Grayscale);
	if (adjust.filter === "sepia") filters.push(Konva.Filters.Sepia);
	if (adjust.brightness) filters.push(Konva.Filters.Brighten);
	if (adjust.contrast) filters.push(Konva.Filters.Contrast);
	if (adjust.blur) filters.push(Konva.Filters.Blur);
	return filters;
}

/**
 * A photo is an outer Group (geometry, events, opacity, shape clip: what the
 * Transformer grabs) around the Image (crop, flip, filters), so flipping
 * never fights the Transformer's own scaling.
 */
function CanvasImageShape(props: CanvasItemShapeProps) {
	const { item, scaleFactor, interaction, ref } = props;
	const { image, status } = useCanvasImage(item.imageSrc);
	const photoRef = useRef<Konva.Image>(null);
	const width = item.width * scaleFactor;
	const height = item.height * scaleFactor;
	const adjust = item.adjust;
	const filters = photoFilters(adjust);
	// The photo's own pixels across the box (only the cropped part of it).
	const sourceWidth = image ? image.naturalWidth * (item.crop?.width ?? 1) : 0;

	// Konva only applies filters to a cached node. Cache at the photo's own
	// resolution (bounded), not the screen's, so a 300 ppp export of a
	// filtered photo is as sharp as an unfiltered one.
	const cacheKey = filters.length
		? [width, height, sourceWidth, JSON.stringify(item.crop), JSON.stringify(adjust)].join("|")
		: "";
	useEffect(() => {
		const node = photoRef.current;
		if (!node || !image) return;
		if (!cacheKey) {
			node.clearCache();
			return;
		}
		const fullRatio = Math.max(1, sourceWidth / Math.max(width, 1));
		const capRatio = Math.sqrt(MAX_FILTER_CACHE_PIXELS / Math.max(width * height, 1));
		node.cache({ pixelRatio: Math.min(fullRatio, capRatio) });
		node.getLayer()?.batchDraw();
	}, [image, cacheKey, sourceWidth, width, height]);

	if (status === "error") return <MissingImagePlaceholder {...props} />;
	const c = item.crop;
	const shape = item.shape;

	return (
		<Group
			ref={ref as React.Ref<Konva.Group>}
			{...itemGeometry(item, scaleFactor)}
			opacity={adjust?.opacity ?? 1}
			{...interaction}
			clipFunc={shape ? (ctx) => traceShape(ctx, shape, 0, 0, width, height) : undefined}
		>
			<KonvaImage
				ref={photoRef}
				image={image}
				// Konva crops in source pixels; the store keeps fractions.
				crop={
					c && image
						? {
								x: c.x * image.naturalWidth,
								y: c.y * image.naturalHeight,
								width: c.width * image.naturalWidth,
								height: c.height * image.naturalHeight,
							}
						: undefined
				}
				width={width}
				height={height}
				x={adjust?.flipX ? width : 0}
				y={adjust?.flipY ? height : 0}
				scaleX={adjust?.flipX ? -1 : 1}
				scaleY={adjust?.flipY ? -1 : 1}
				filters={filters}
				brightness={adjust?.brightness ?? 0}
				contrast={adjust?.contrast ?? 0}
				// Blur is stored relative to the photo, so it looks the same at any size.
				blurRadius={(adjust?.blur ?? 0) * sourceWidth}
			/>
		</Group>
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
