import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Group, Image as KonvaImage, Rect, Transformer } from "react-konva";
import type { CanvasItem } from "../../../shared/store/canvasStore";
import { useCanvasImage } from "../../../shared/hooks/useCanvasImage";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import { EDITOR_ONLY } from "../../../shared/utils/stageCapture";
import { traceShape } from "../../../shared/utils/shapePath";
import { clampRect, fitAspect, fullImageRect, MIN_CROP, type LocalRect } from "../utils/crop";

const GUIDE_COLOR = "#7C3AED";
const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];

interface CropOverlayProps {
	item: CanvasItem;
	scaleFactor: number;
	/** Stage size in px, for the dimming veil. */
	stageWidth: number;
	stageHeight: number;
	/** The crop box, in logical px in the item's frame. */
	rect: LocalRect;
	/** Width/height ratio the box is locked to, or null for free. */
	aspect: number | null;
	onChange: (rect: LocalRect) => void;
	/** A press anywhere else on the sheet confirms the crop. */
	onCommit: () => void;
}

/**
 * Crop mode, drawn on the sheet: everything else is veiled, the whole photo
 * shows as a faint ghost, and the part inside the violet box is shown at
 * full strength. The box drags and resizes within the photo.
 */
export function CropOverlay({
	item,
	scaleFactor: s,
	stageWidth,
	stageHeight,
	rect,
	aspect,
	onChange,
	onCommit,
}: CropOverlayProps) {
	const { image } = useCanvasImage(item.imageSrc);
	const frameRef = useRef<Konva.Rect>(null);
	const trRef = useRef<Konva.Transformer>(null);
	const full = fullImageRect(item);
	const coarsePointer = useMediaQuery("(pointer: coarse)");

	useEffect(() => {
		if (frameRef.current) trRef.current?.nodes([frameRef.current]);
	}, []);

	/** The frame node's box back in logical px (Konva resizes it by scaling). */
	const readFrame = (node: Konva.Node): LocalRect => ({
		x: node.x() / s,
		y: node.y() / s,
		width: (node.width() * node.scaleX()) / s,
		height: (node.height() * node.scaleY()) / s,
	});

	const photo = {
		image,
		x: full.x * s,
		y: full.y * s,
		width: full.width * s,
		height: full.height * s,
		listening: false,
	};

	return (
		<Group name={EDITOR_ONLY}>
			<Rect
				width={stageWidth}
				height={stageHeight}
				fill="rgba(255, 255, 255, 0.7)"
				onMouseDown={onCommit}
				onTouchStart={onCommit}
			/>
			<Group x={item.x * s} y={item.y * s} rotation={item.rotation}>
				<KonvaImage {...photo} opacity={0.35} />
				{/* The photo's shape masks the crop box, as it will on the sheet. */}
				<Group
					clipFunc={(ctx) =>
						traceShape(ctx, item.shape, rect.x * s, rect.y * s, rect.width * s, rect.height * s)
					}
					listening={false}
				>
					<KonvaImage {...photo} />
				</Group>
				<Rect
					ref={frameRef}
					x={rect.x * s}
					y={rect.y * s}
					width={rect.width * s}
					height={rect.height * s}
					fill="transparent"
					stroke={GUIDE_COLOR}
					strokeWidth={1.5}
					draggable
					onDragMove={(e) => {
						// Keep the box on the photo while it's dragged.
						const box = clampRect(readFrame(e.target), full);
						e.target.position({ x: box.x * s, y: box.y * s });
						onChange(box);
					}}
					onTransformEnd={(e) => {
						const node = e.target;
						const box = readFrame(node);
						node.scale({ x: 1, y: 1 });
						onChange(aspect ? fitAspect(box, aspect, full) : clampRect(box, full));
					}}
				/>
				<Transformer
					ref={trRef}
					rotateEnabled={false}
					keepRatio={aspect !== null}
					enabledAnchors={aspect !== null ? CORNERS : undefined}
					borderEnabled={false}
					anchorStroke={GUIDE_COLOR}
					anchorFill="#FFFFFF"
					anchorSize={coarsePointer ? 20 : 10}
					anchorCornerRadius={2}
					boundBoxFunc={(oldBox, newBox) =>
						newBox.width < MIN_CROP * s || newBox.height < MIN_CROP * s ? oldBox : newBox
					}
				/>
			</Group>
		</Group>
	);
}
