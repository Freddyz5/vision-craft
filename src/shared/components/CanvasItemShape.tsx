import type React from "react";
import { useEffect, useRef } from "react";
import Konva from "konva";
import type { Filter } from "konva/lib/Node";
import {
	Group,
	Image as KonvaImage,
	Rect,
	Shape,
	Text as KonvaText,
	type KonvaNodeEvents,
} from "react-konva";
import { useStore } from "@nanostores/react";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem, type ImageAdjust } from "../store/canvasStore";
import { useCanvasImage } from "../hooks/useCanvasImage";
import { EDITOR_ONLY, FILTER_SCREEN_RATIO, FILTER_SOURCE_RATIO } from "../utils/stageCapture";
import { traceShape } from "../utils/shapePath";
import { coverRegion, polaroidPhotoBox, type Box } from "../utils/frame";
import { fontStack, fontsLoadedStore } from "../utils/fonts";

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

/** Logical px per mm (96 dpi), for frame thicknesses stored in mm. */
const PX_PER_MM = 96 / 25.4;
const SHADOW_COLOR = "rgba(17, 24, 39, 0.35)";

/**
 * A photo is an outer Group (geometry, events, opacity: what the Transformer
 * grabs) holding, back to front: a base that casts the soft shadow (and is
 * the white card of a polaroid), the Image clipped to the photo's shape
 * (crop, flip, filters), and the border. Flipping lives on the inner Image
 * so it never fights the Transformer's own scaling.
 */
function CanvasImageShape(props: CanvasItemShapeProps) {
	const { item, scaleFactor, interaction, ref } = props;
	const { image, status } = useCanvasImage(item.imageSrc);
	const photoRef = useRef<Konva.Image>(null);
	const width = item.width * scaleFactor;
	const height = item.height * scaleFactor;
	const { adjust, frame, shape } = item;
	// A polaroid card keeps the photo in its window; otherwise it fills the box.
	const photoBox = frame?.polaroid
		? polaroidPhotoBox(width, height)
		: { x: 0, y: 0, width, height };
	const filters = photoFilters(adjust);

	// The part of the source photo that's drawn, in its own pixels: the crop,
	// trimmed (centred) to the window's shape when a polaroid changes it.
	let region: Box | undefined;
	if (image) {
		const c = item.crop ?? { x: 0, y: 0, width: 1, height: 1 };
		region = {
			x: c.x * image.naturalWidth,
			y: c.y * image.naturalHeight,
			width: c.width * image.naturalWidth,
			height: c.height * image.naturalHeight,
		};
		if (frame?.polaroid) region = coverRegion(region, photoBox.width / photoBox.height);
	}
	const sourceWidth = region?.width ?? 0;

	// Konva only applies filters to a cached node. While editing it's cached
	// at screen sharpness, which keeps memory low (several full-resolution
	// caches can crash mobile Safari); captureStage re-caches filtered photos
	// at the export's resolution, up to the photo's own, just for the capture.
	const cacheKey = filters.length
		? [
				photoBox.width,
				photoBox.height,
				sourceWidth,
				JSON.stringify(region),
				JSON.stringify(adjust),
			].join("|")
		: "";
	useEffect(() => {
		const node = photoRef.current;
		if (!node || !image) return;
		if (!cacheKey) {
			node.clearCache();
			return;
		}
		const fullRatio = Math.max(1, sourceWidth / Math.max(photoBox.width, 1));
		const capRatio = Math.sqrt(
			MAX_FILTER_CACHE_PIXELS / Math.max(photoBox.width * photoBox.height, 1),
		);
		const sourceRatio = Math.min(fullRatio, capRatio);
		const screenRatio = Math.min(sourceRatio, window.devicePixelRatio || 1);
		node.setAttr(FILTER_SOURCE_RATIO, sourceRatio);
		node.setAttr(FILTER_SCREEN_RATIO, screenRatio);
		node.cache({ pixelRatio: screenRatio });
		node.getLayer()?.batchDraw();
	}, [image, cacheKey, sourceWidth, photoBox.width, photoBox.height]);

	if (status === "error") return <MissingImagePlaceholder {...props} />;

	// A polaroid is a rectangular card; otherwise the outline is the photo's shape.
	const outlineShape = frame?.polaroid ? undefined : shape;
	const minSide = Math.min(width, height);
	const borderWidth = (frame?.borderMm ?? 0) * PX_PER_MM * scaleFactor;
	const needsBase = frame?.polaroid || frame?.shadow;

	return (
		<Group
			ref={ref as React.Ref<Konva.Group>}
			{...itemGeometry(item, scaleFactor)}
			opacity={adjust?.opacity ?? 1}
			{...interaction}
		>
			{needsBase && (
				<Shape
					sceneFunc={(ctx, node) => {
						ctx.beginPath();
						traceShape(ctx, outlineShape, 0, 0, width, height);
						ctx.fillStrokeShape(node);
					}}
					fill="#FFFFFF"
					// Shadow sized to the photo, so it looks the same at any zoom or DPI.
					shadowEnabled={!!frame?.shadow}
					shadowColor={SHADOW_COLOR}
					shadowBlur={minSide * 0.05}
					shadowOffsetY={minSide * 0.02}
				/>
			)}
			<Group
				clipFunc={(ctx) =>
					traceShape(ctx, shape, photoBox.x, photoBox.y, photoBox.width, photoBox.height)
				}
			>
				<KonvaImage
					ref={photoRef}
					image={image}
					crop={region}
					width={photoBox.width}
					height={photoBox.height}
					x={photoBox.x + (adjust?.flipX ? photoBox.width : 0)}
					y={photoBox.y + (adjust?.flipY ? photoBox.height : 0)}
					scaleX={adjust?.flipX ? -1 : 1}
					scaleY={adjust?.flipY ? -1 : 1}
					filters={filters}
					brightness={adjust?.brightness ?? 0}
					contrast={adjust?.contrast ?? 0}
					// Blur is stored relative to the photo, so it looks the same at any size.
					blurRadius={(adjust?.blur ?? 0) * sourceWidth}
				/>
			</Group>
			{borderWidth > 0 && (
				<Shape
					listening={false}
					// Drawn inside the outline, so the border never grows the item.
					sceneFunc={(ctx, node) => {
						ctx.beginPath();
						traceShape(
							ctx,
							outlineShape,
							borderWidth / 2,
							borderWidth / 2,
							width - borderWidth,
							height - borderWidth,
						);
						ctx.fillStrokeShape(node);
					}}
					stroke={frame?.borderColor ?? "#FFFFFF"}
					strokeWidth={borderWidth}
				/>
			)}
		</Group>
	);
}

function CanvasTextShape({ item, scaleFactor, interaction, ref }: CanvasItemShapeProps) {
	// No fixed height: Konva drops lines that don't fit one, so the box grows
	// with its lines instead (the stored height follows, see textMetrics).
	const { height: _height, ...geometry } = itemGeometry(item, scaleFactor);
	// Konva measures and paints text once; a fresh node after fonts load
	// replaces lines drawn and wrapped with the fallback font.
	const fontsVersion = useStore(fontsLoadedStore);
	return (
		<KonvaText
			key={fontsVersion}
			ref={ref as React.Ref<Konva.Text>}
			text={item.text || ""}
			{...geometry}
			fontSize={(item.fontSize || TEXT_DEFAULTS.fontSize) * scaleFactor}
			fontFamily={fontStack(item.fontFamily)}
			align={item.align || TEXT_DEFAULTS.align}
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
