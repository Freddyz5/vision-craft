import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { KonvaImageItem } from './KonvaImageItem';
import type { CanvasItem } from '../../../shared/store/canvasStore';
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
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Deselect when clicking on empty area
    if (e.target === e.target.getStage() || e.target.name() === 'background-rect') {
      setSelectedId(null);
    }
  };

  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  // Render nothing if SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className='shadow-xl shadow-gray-300 dark:shadow-white'>
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

          {sortedItems.map(item => (
            <KonvaImageItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={setSelectedId}
              scaleFactor={scaleFactor}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

