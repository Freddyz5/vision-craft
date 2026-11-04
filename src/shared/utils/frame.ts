/** Polaroid card margins, as fractions of the card's width. */
const POLAROID_SIDE = 0.05;
const POLAROID_BOTTOM = 0.2;

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Where the photo sits inside a polaroid card of `width` × `height` (any unit). */
export function polaroidPhotoBox(width: number, height: number): Box {
	const side = width * POLAROID_SIDE;
	return {
		x: side,
		y: side,
		width: Math.max(1, width - side * 2),
		height: Math.max(1, height - side - width * POLAROID_BOTTOM),
	};
}

/**
 * Trim a source region (centred) to `aspect` (w/h), so a photo can fill a
 * box of another shape without being stretched, like CSS object-fit: cover.
 */
export function coverRegion(region: Box, aspect: number): Box {
	const current = region.width / region.height;
	if (current > aspect) {
		const width = region.height * aspect;
		return { ...region, x: region.x + (region.width - width) / 2, width };
	}
	const height = region.width / aspect;
	return { ...region, y: region.y + (region.height - height) / 2, height };
}
