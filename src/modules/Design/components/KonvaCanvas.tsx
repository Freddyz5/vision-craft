import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { KonvaImageItem } from './KonvaImageItem';
import { KonvaTextItem } from './KonvaTextItem';
import { updateItem, type CanvasItem } from '../../../shared/store/canvasStore';
import type { SelectedItemId } from '../types';
import type Konva from 'konva';

interface KonvaCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  logicalWidth: number;
  logicalHeight: number;
  items: CanvasItem[];
  selectedId: SelectedItemId;
  setSelectedId: (id: SelectedItemId) => void;
  scaleFactor: number;
}

export function KonvaCanvas({
  stageRef,
  logicalWidth,
  logicalHeight,
  items,
  selectedId,
  setSelectedId,
  scaleFactor
}: KonvaCanvasProps) {
  const [snappingLines, setSnappingLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Deselect when clicking on empty area
    if (e.target === e.target.getStage() || e.target.name() === 'background-rect') {
      setSelectedId(null);
    }
  };

  const handleDragMove = (id: string, e: any) => {
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

  const handleDragEnd = (id: string, e: any) => {
    setSnappingLines({ x: null, y: null });
    const node = e.target;
    updateItem(id, {
      x: node.x() / scaleFactor,
      y: node.y() / scaleFactor,
    });
  };

  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className='shadow-xl shadow-gray-200 dark:shadow-gray-900/50'>
      <Stage
        width={logicalWidth * scaleFactor}
        height={logicalHeight * scaleFactor}
        ref={stageRef as any}
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

          {sortedItems.map(item => {
            const isSelected = selectedId === item.id;
            if (item.type === 'text') {
              return (
                <KonvaTextItem
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  onSelect={setSelectedId}
                  scaleFactor={scaleFactor}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              );
            }
            return (
              <KonvaImageItem
                key={item.id}
                item={item}
                isSelected={isSelected}
                onSelect={setSelectedId}
                scaleFactor={scaleFactor}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            );
          })}

          {/* Snapping guide lines layer (rendered above items for visibility) */}
          {snappingLines.x !== null && (
            <Line
              points={[snappingLines.x * scaleFactor, 0, snappingLines.x * scaleFactor, logicalHeight * scaleFactor]}
              stroke="#EF4444"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
          {snappingLines.y !== null && (
            <Line
              points={[0, snappingLines.y * scaleFactor, logicalWidth * scaleFactor, snappingLines.y * scaleFactor]}
              stroke="#EF4444"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
