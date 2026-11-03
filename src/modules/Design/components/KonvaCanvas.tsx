import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Group, Transformer } from "react-konva";
import type Konva from "konva";
import { KonvaCanvasItem } from "./KonvaCanvasItem";
import {
	insertItemCopies,
	isTextItem,
	updateItem,
	type CanvasItem,
} from "../../../shared/store/canvasStore";
import { CanvasItemShape } from "../../../shared/components/CanvasItemShape";
import { EDITOR_ONLY } from "../../../shared/utils/stageCapture";
import type {
	CanvasItemDragHandler,
	CanvasItemSelectHandler,
} from "../hooks/useCanvasItemInteractions";
import { SAFE_MARGIN_MM, itemBounds } from "../utils/printChecks";
import { MM_TO_PX } from "../../Canvas/constants/presets";

/** Editor accents on the sheet: violet for guides and handles, amber (Marigold) for print warnings. */
const GUIDE_COLOR = "#7C3AED";
const WARNING_COLOR = "#D97706";

// A lone text box resizes by the corners or sideways; the font size follows the box.
const TEXT_ANCHORS = [
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right",
	"middle-left",
	"middle-right",
];

interface KonvaCanvasProps {
	stageRef: React.RefObject<Konva.Stage | null>;
	logicalWidth: number;
	logicalHeight: number;
	items: CanvasItem[];
	selectedIds: string[];
	onSelectItem: CanvasItemSelectHandler;
	onClearSelection: () => void;
	/** A drag-select rectangle ended over these items; `additive` keeps the current selection. */
	onMarqueeSelect: (ids: string[], additive: boolean) => void;
	scaleFactor: number;
	/** Items with an open print warning, outlined in amber on the sheet. */
	warnedIds: Set<string>;
	/** Text item being edited in place (hidden on the stage meanwhile). */
	editingId: string | null;
	onEditText: (id: string) => void;
	/** True while an item is dragged or transformed. */
	onInteractionChange: (active: boolean) => void;
	/** Alt+drag made a copy: select it. */
	onCopied: (id: string) => void;
}

export function KonvaCanvas({
	stageRef,
	logicalWidth,
	logicalHeight,
	items,
	selectedIds,
	onSelectItem,
	onClearSelection,
	onMarqueeSelect,
	scaleFactor,
	warnedIds,
	editingId,
	onEditText,
	onInteractionChange,
	onCopied,
}: KonvaCanvasProps) {
	// Alt+drag (Option on Mac): the original stays put, drawn here as a ghost,
	// while the dragged node becomes the copy on drop.
	const [altDragId, setAltDragId] = useState<string | null>(null);

	const handleDragStart: CanvasItemDragHandler = (id, e) => {
		if (e.evt.altKey) setAltDragId(id);
	};
	const [snappingLines, setSnappingLines] = useState<{ x: number | null; y: number | null }>({
		x: null,
		y: null,
	});

	// Drag-select (desktop): pressing on empty sheet and dragging draws a
	// rectangle; on release every item it touches is selected.
	type Marquee = { x0: number; y0: number; x1: number; y1: number; additive: boolean };
	const [marquee, setMarquee] = useState<Marquee | null>(null);
	const marqueeRef = useRef<Marquee | null>(null);
	const marqueeActive = marquee !== null;

	const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
		const stage = e.target.getStage();
		if (!stage || (e.target !== stage && e.target.name() !== "background-rect")) return;
		const evt = e.evt as MouseEvent;
		const additive = !!(evt.shiftKey || evt.metaKey || evt.ctrlKey);
		if (!additive) onClearSelection();
		const pos = stage.getPointerPosition();
		if (e.type !== "mousedown" || evt.button !== 0 || !pos) return;
		const start = { x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y, additive };
		marqueeRef.current = start;
		setMarquee(start);
	};

	useEffect(() => {
		if (!marqueeActive) return;
		const stage = stageRef.current;
		const move = (e: MouseEvent) => {
			if (!stage || !marqueeRef.current) return;
			stage.setPointersPositions(e);
			const pos = stage.getPointerPosition();
			if (!pos) return;
			marqueeRef.current = { ...marqueeRef.current, x1: pos.x, y1: pos.y };
			setMarquee(marqueeRef.current);
		};
		const up = () => {
			const m = marqueeRef.current;
			marqueeRef.current = null;
			setMarquee(null);
			// A press without a drag is just a click on empty space.
			if (!m || (Math.abs(m.x1 - m.x0) < 3 && Math.abs(m.y1 - m.y0) < 3)) return;
			const left = Math.min(m.x0, m.x1) / scaleFactor;
			const right = Math.max(m.x0, m.x1) / scaleFactor;
			const top = Math.min(m.y0, m.y1) / scaleFactor;
			const bottom = Math.max(m.y0, m.y1) / scaleFactor;
			const touched = items.filter((item) => {
				const b = itemBounds(item);
				return b.maxX >= left && b.minX <= right && b.maxY >= top && b.minY <= bottom;
			});
			onMarqueeSelect(
				touched.map((i) => i.id),
				m.additive,
			);
		};
		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);
		return () => {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", up);
		};
	}, [marqueeActive, stageRef, scaleFactor, items, onMarqueeSelect]);

	// One Transformer for the whole selection. Items report their Konva node
	// here; after every render the Transformer is pointed at the selected
	// ones, but only re-attached when that set actually changed, so a
	// transform in progress isn't interrupted.
	const trRef = useRef<Konva.Transformer>(null);
	const nodesRef = useRef(new Map<string, Konva.Node>());
	const handleNode = useCallback((id: string, node: Konva.Node | null) => {
		if (node) nodesRef.current.set(id, node);
		else nodesRef.current.delete(id);
	}, []);
	useEffect(() => {
		const tr = trRef.current;
		if (!tr) return;
		const next = selectedIds
			.filter((id) => id !== editingId)
			.map((id) => nodesRef.current.get(id))
			.filter((node): node is Konva.Node => !!node);
		const current = tr.nodes();
		if (next.length !== current.length || next.some((node, i) => node !== current[i])) {
			tr.nodes(next);
			tr.getLayer()?.batchDraw();
		}
	});
	const loneText =
		selectedIds.length === 1 && items.some((i) => i.id === selectedIds[0] && isTextItem(i));

	const handleDragMove: CanvasItemDragHandler = (id, e) => {
		const node = e.target;
		// Current node coordinates in stage pixels (scaled by scaleFactor)
		const currentX = node.x();
		const currentY = node.y();
		const currentW = node.width() * node.scaleX();
		const currentH = node.height() * node.scaleY();

		// Convert current bounds to logical coordinates
		const logicalX = currentX / scaleFactor;
		const logicalY = currentY / scaleFactor;
		const logicalW = currentW / scaleFactor;
		const logicalH = currentH / scaleFactor;

		const threshold = 5;

		const pickBestSnap = (dragPoints: number[], targetPoints: number[]) => {
			let best: { delta: number; guide: number } | null = null;
			for (const dragPoint of dragPoints) {
				for (const targetPoint of targetPoints) {
					const delta = targetPoint - dragPoint;
					const abs = Math.abs(delta);
					if (abs > threshold) continue;
					if (!best || abs < Math.abs(best.delta)) {
						best = { delta, guide: targetPoint };
					}
				}
			}
			return best;
		};

		const xTargets = [0, logicalWidth / 2, logicalWidth];
		const yTargets = [0, logicalHeight / 2, logicalHeight];

		for (const other of items) {
			if (other.id === id) continue;
			xTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
			yTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
		}

		const xDragPoints = [logicalX, logicalX + logicalW / 2, logicalX + logicalW];
		const yDragPoints = [logicalY, logicalY + logicalH / 2, logicalY + logicalH];

		const xSnap = pickBestSnap(xDragPoints, xTargets);
		const ySnap = pickBestSnap(yDragPoints, yTargets);

		if (xSnap) node.x((logicalX + xSnap.delta) * scaleFactor);
		if (ySnap) node.y((logicalY + ySnap.delta) * scaleFactor);

		setSnappingLines({ x: xSnap?.guide ?? null, y: ySnap?.guide ?? null });
	};

	const handleDragEnd: CanvasItemDragHandler = (id, e) => {
		setSnappingLines({ x: null, y: null });
		onInteractionChange(false);
		const node = e.target;
		const dropped = { x: node.x() / scaleFactor, y: node.y() / scaleFactor };
		const original = items.find((i) => i.id === id);
		if (altDragId === id && original) {
			setAltDragId(null);
			// Put the original back and add the copy where it was dropped: one write, one undo step.
			node.position({ x: original.x * scaleFactor, y: original.y * scaleFactor });
			const [copyId] = insertItemCopies([{ ...original, ...dropped }], 0);
			if (copyId) onCopied(copyId);
			return;
		}
		updateItem(id, dropped);
	};

	const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
	const margin = SAFE_MARGIN_MM * MM_TO_PX * scaleFactor;

	return (
		<div className="shadow-[0_1px_3px_rgb(17_24_39/0.08),0_12px_32px_-12px_rgb(17_24_39/0.25)] dark:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)]">
			<Stage
				width={logicalWidth * scaleFactor}
				height={logicalHeight * scaleFactor}
				ref={stageRef}
				onMouseDown={handleMouseDown}
				onTouchStart={handleMouseDown}
				className="bg-white"
			>
				<Layer>
					<Rect
						name="background-rect"
						width={logicalWidth * scaleFactor}
						height={logicalHeight * scaleFactor}
						fill="white"
					/>

					{sortedItems.map((item) => (
						<React.Fragment key={item.id}>
							{altDragId === item.id && (
								<CanvasItemShape
									item={item}
									scaleFactor={scaleFactor}
									interaction={{ listening: false }}
								/>
							)}
							<KonvaCanvasItem
								item={item}
								onSelect={onSelectItem}
								onNode={handleNode}
								scaleFactor={scaleFactor}
								onDragMove={handleDragMove}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
								hidden={item.id === editingId}
								onEditText={onEditText}
								onInteractionChange={onInteractionChange}
							/>
						</React.Fragment>
					))}

					{/* Print overlay: what the printer will do to the sheet. Never exported. */}
					<Group name={EDITOR_ONLY} listening={false}>
						<Rect
							x={margin}
							y={margin}
							width={logicalWidth * scaleFactor - margin * 2}
							height={logicalHeight * scaleFactor - margin * 2}
							stroke={GUIDE_COLOR}
							strokeWidth={1}
							opacity={0.35}
							dash={[6, 4]}
						/>
						{sortedItems
							.filter((item) => warnedIds.has(item.id) && item.id !== editingId)
							.map((item) => (
								<Rect
									key={item.id}
									x={item.x * scaleFactor}
									y={item.y * scaleFactor}
									width={item.width * scaleFactor}
									height={item.height * scaleFactor}
									rotation={item.rotation}
									stroke={WARNING_COLOR}
									strokeWidth={2}
									dash={[6, 3]}
								/>
							))}
					</Group>

					{/* Snapping guide lines layer (rendered above items for visibility) */}
					{snappingLines.x !== null && (
						<Line
							name={EDITOR_ONLY}
							points={[
								snappingLines.x * scaleFactor,
								0,
								snappingLines.x * scaleFactor,
								logicalHeight * scaleFactor,
							]}
							stroke={GUIDE_COLOR}
							strokeWidth={1}
							dash={[4, 4]}
						/>
					)}
					{snappingLines.y !== null && (
						<Line
							name={EDITOR_ONLY}
							points={[
								0,
								snappingLines.y * scaleFactor,
								logicalWidth * scaleFactor,
								snappingLines.y * scaleFactor,
							]}
							stroke={GUIDE_COLOR}
							strokeWidth={1}
							dash={[4, 4]}
						/>
					)}

					{marquee && (
						<Rect
							name={EDITOR_ONLY}
							listening={false}
							x={Math.min(marquee.x0, marquee.x1)}
							y={Math.min(marquee.y0, marquee.y1)}
							width={Math.abs(marquee.x1 - marquee.x0)}
							height={Math.abs(marquee.y1 - marquee.y0)}
							fill="rgba(124, 58, 237, 0.08)"
							stroke={GUIDE_COLOR}
							strokeWidth={1}
						/>
					)}

					<Transformer
						ref={trRef}
						borderStroke={GUIDE_COLOR}
						anchorStroke={GUIDE_COLOR}
						anchorFill="#FFFFFF"
						anchorSize={9}
						anchorCornerRadius={2}
						rotateAnchorOffset={24}
						enabledAnchors={loneText ? TEXT_ANCHORS : undefined}
						boundBoxFunc={(oldBox, newBox) => {
							if (newBox.width < (loneText ? 30 : 10) || newBox.height < 10) return oldBox;
							return newBox;
						}}
					/>
				</Layer>
			</Stage>
		</div>
	);
}
