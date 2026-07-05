import { useEffect, useRef } from "react";
import type Konva from "konva";
import type { CanvasItem } from "../../../shared/store/canvasStore";
import {
	updateItem,
	bringToFront,
	sendToBack,
	removeItem,
} from "../../../shared/store/canvasStore";

interface UseCanvasItemInteractionsOptions {
	item: CanvasItem;
	isSelected: boolean;
	scaleFactor: number;
	/** Ref to the underlying Konva node (Image, Text, ...) the Transformer attaches to. */
	nodeRef: React.RefObject<Konva.Node | null>;
	onSelect: (id: string) => void;
	onDragMove?: (id: string, e: any) => void;
	onDragEnd?: (id: string, e: any) => void;
}

/**
 * Shared drag/select/resize/keyboard behavior for items placed on the Konva
 * design stage. KonvaImageItem and KonvaTextItem only differ in the shape
 * they render and their Transformer's boundBoxFunc/enabledAnchors.
 */
export function useCanvasItemInteractions({
	item,
	isSelected,
	scaleFactor,
	nodeRef,
	onSelect,
	onDragMove,
	onDragEnd,
}: UseCanvasItemInteractionsOptions) {
	const trRef = useRef<Konva.Transformer>(null);

	useEffect(() => {
		if (isSelected && trRef.current && nodeRef.current) {
			trRef.current.nodes([nodeRef.current]);
			trRef.current.getLayer()?.batchDraw();
		}
	}, [isSelected, nodeRef]);

	useEffect(() => {
		if (!isSelected) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Only react if we are not typing in an input
			if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

			if (e.key === "Backspace" || e.key === "Delete") {
				removeItem(item.id);
			} else if (e.key === "ArrowUp") {
				if (e.shiftKey) bringToFront(item.id);
				else updateItem(item.id, { y: item.y - 1 });
			} else if (e.key === "ArrowDown") {
				if (e.shiftKey) sendToBack(item.id);
				else updateItem(item.id, { y: item.y + 1 });
			} else if (e.key === "ArrowLeft") {
				updateItem(item.id, { x: item.x - 1 });
			} else if (e.key === "ArrowRight") {
				updateItem(item.id, { x: item.x + 1 });
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSelected, item]);

	const handleSelect = () => onSelect(item.id);

	const handleDragMove = (e: any) => onDragMove?.(item.id, e);

	const handleDragEnd = (e: any) => {
		if (onDragEnd) {
			onDragEnd(item.id, e);
			return;
		}
		updateItem(item.id, {
			x: e.target.x() / scaleFactor,
			y: e.target.y() / scaleFactor,
		});
	};

	const handleTransformEnd = () => {
		const node = nodeRef.current;
		if (!node) return;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();

		// Reset internal scaling and update width/height directly
		node.scaleX(1);
		node.scaleY(1);

		updateItem(item.id, {
			x: node.x() / scaleFactor,
			y: node.y() / scaleFactor,
			rotation: node.rotation(),
			width: item.width * scaleX,
			height: item.height * scaleY,
		});
	};

	return { trRef, handleSelect, handleDragMove, handleDragEnd, handleTransformEnd };
}
