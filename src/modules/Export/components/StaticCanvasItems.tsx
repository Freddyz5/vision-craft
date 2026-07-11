import { useEffect, useState } from "react";
import { Image as KonvaImage, Text as KonvaText } from "react-konva";

interface StaticImageProps {
	src?: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	scaleFactor: number;
}

/** Non-interactive image render used by the read-only export/print preview stage. */
export function StaticImage({ src, x, y, width, height, rotation, scaleFactor }: StaticImageProps) {
	const [image, setImage] = useState<HTMLImageElement | undefined>();
	useEffect(() => {
		if (!src) return;
		const img = new window.Image();
		img.crossOrigin = "Anonymous";
		img.src = src;
		img.onload = () => setImage(img);
	}, [src]);
	return (
		<KonvaImage
			image={image}
			x={x * scaleFactor}
			y={y * scaleFactor}
			width={width * scaleFactor}
			height={height * scaleFactor}
			rotation={rotation}
		/>
	);
}

interface StaticTextProps {
	text?: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	scaleFactor: number;
	fontSize?: number;
	fillColor?: string;
	fontFamily?: string;
	fontStyle?: string;
}

/** Non-interactive text render used by the read-only export/print preview stage. */
export function StaticText({
	text,
	x,
	y,
	width,
	height,
	rotation,
	scaleFactor,
	fontSize,
	fillColor,
	fontFamily,
	fontStyle,
}: StaticTextProps) {
	return (
		<KonvaText
			text={text || ""}
			x={x * scaleFactor}
			y={y * scaleFactor}
			width={width * scaleFactor}
			height={height * scaleFactor}
			rotation={rotation}
			fontSize={(fontSize || 24) * scaleFactor}
			fill={fillColor || "#111827"}
			fontFamily={fontFamily || "Inter"}
			fontStyle={fontStyle || "normal"}
		/>
	);
}
