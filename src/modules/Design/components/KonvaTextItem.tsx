import React, { useEffect, useRef } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import type { CanvasItem } from '../../../shared/store/canvasStore';
import { updateItem, bringToFront, sendToBack, removeItem } from '../../../shared/store/canvasStore';
import type Konva from 'konva';

interface KonvaTextItemProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  scaleFactor: number;
  onDragMove?: (id: string, e: any) => void;
  onDragEnd?: (id: string, e: any) => void;
}

export function KonvaTextItem({ item, isSelected, onSelect, scaleFactor, onDragMove, onDragEnd }: KonvaTextItemProps) {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle keyboard events when selected
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only react if we are not typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        removeItem(item.id);
      } else if (e.key === 'ArrowUp') {
        if (e.shiftKey) bringToFront(item.id);
        else updateItem(item.id, { y: item.y - 1 });
      } else if (e.key === 'ArrowDown') {
        if (e.shiftKey) sendToBack(item.id);
        else updateItem(item.id, { y: item.y + 1 });
      } else if (e.key === 'ArrowLeft') {
        updateItem(item.id, { x: item.x - 1 });
      } else if (e.key === 'ArrowRight') {
        updateItem(item.id, { x: item.x + 1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, item]);

  return (
    <React.Fragment>
      <KonvaText
        ref={textRef}
        text={item.text || ''}
        x={item.x * scaleFactor}
        y={item.y * scaleFactor}
        width={item.width * scaleFactor}
        height={item.height * scaleFactor}
        fontSize={(item.fontSize || 24) * scaleFactor}
        fontFamily={item.fontFamily || 'Inter'}
        fill={item.fillColor || '#7C3AED'}
        fontStyle={item.fontStyle || 'normal'}
        rotation={item.rotation}
        draggable
        onClick={() => onSelect(item.id)}
        onTap={() => onSelect(item.id)}
        onDragMove={(e) => onDragMove && onDragMove(item.id, e)}
        onDragEnd={(e) => {
          if (onDragEnd) {
            onDragEnd(item.id, e);
          } else {
            updateItem(item.id, {
              x: e.target.x() / scaleFactor,
              y: e.target.y() / scaleFactor,
            });
          }
        }}
        onTransformEnd={(e) => {
          const node = textRef.current;
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
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
}
