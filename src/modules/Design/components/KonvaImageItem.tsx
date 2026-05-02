import React, { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import type { CanvasItem } from '../../../shared/store/canvasStore';
import { updateItem, bringToFront, sendToBack, removeItem } from '../../../shared/store/canvasStore';
import type Konva from 'konva';

function useImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | undefined>();
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return [image];
}

interface KonvaImageItemProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  scaleFactor: number;
}

export function KonvaImageItem({ item, isSelected, onSelect, scaleFactor }: KonvaImageItemProps) {
  const [image] = useImage(item.imageSrc);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle keyboard events when selected
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only react if we are not typing in an input
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
      <KonvaImage
        ref={imageRef}
        image={image}
        x={item.x * scaleFactor}
        y={item.y * scaleFactor}
        width={item.width * scaleFactor}
        height={item.height * scaleFactor}
        rotation={item.rotation}
        draggable
        onClick={() => onSelect(item.id)}
        onTap={() => onSelect(item.id)}
        onDragEnd={(e) => {
          updateItem(item.id, {
            x: e.target.x() / scaleFactor,
            y: e.target.y() / scaleFactor,
          });
        }}
        onTransformEnd={(e) => {
          const node = imageRef.current;
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
            width: (item.width * scaleX),
            height: (item.height * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
}
