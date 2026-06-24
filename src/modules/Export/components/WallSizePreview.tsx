interface WallSizePreviewProps {
	/** Total assembled poster width, in mm (cols * paperWidthMm) */
	posterWidthMm: number;
	/** Total assembled poster height, in mm (rows * paperHeightMm) */
	posterHeightMm: number;
	/** Optional canvas preview image used to show the actual poster artwork */
	previewSrc?: string | null;
	/** Grid subdivision used to visualize the tiled poster layout */
	cols?: number;
	rows?: number;
}

const DOOR_HEIGHT_MM = 2000;
const DOOR_WIDTH_MM = 800;
// The larger of (door height, poster width, poster height) maps to this many
// px, so door and poster always share one mm\u2192px ratio (true proportional
// scale) no matter how big the assembled poster ends up being.
const MAX_DIMENSION_PX = 180;

/**
 * Rasterbator-style "how big will this actually be on my wall" illustration:
 * a standard 2m door next to the assembled poster, both drawn to the same
 * real-world scale, with the poster's physical size printed underneath.
 */
export function WallSizePreview({
	posterWidthMm,
	posterHeightMm,
	previewSrc,
	cols = 1,
	rows = 1,
}: WallSizePreviewProps) {
	const largestMm = Math.max(DOOR_HEIGHT_MM, posterWidthMm, posterHeightMm);
	const pxPerMm = MAX_DIMENSION_PX / largestMm;

	const doorHpx = DOOR_HEIGHT_MM * pxPerMm;
	const doorWpx = DOOR_WIDTH_MM * pxPerMm;
	const posterHpx = posterHeightMm * pxPerMm;
	const posterWpx = posterWidthMm * pxPerMm;

	const gap = 28;
	const padX = 20;
	const padTop = 16;
	const labelHeight = 30;
	const topY = padTop;
	const baseY = topY + Math.max(doorHpx, posterHpx);

	const svgWidth = padX * 2 + doorWpx + gap + posterWpx;
	const svgHeight = baseY + labelHeight;

	const doorX = padX;
	const doorY = topY;
	const posterX = padX + doorWpx + gap;
	const posterY = topY;

	const posterWidthCm = Math.round(posterWidthMm / 10);
	const posterHeightCm = Math.round(posterHeightMm / 10);

	return (
		<div className="flex flex-col items-center text-base-content">
			<svg
				viewBox={`0 0 ${svgWidth} ${svgHeight}`}
				width="100%"
				style={{ maxWidth: 320 }}
				role="img"
				aria-label={`Comparación de tamaño: póster de ${posterWidthCm} por ${posterHeightCm} cm junto a una puerta estándar de 2 metros`}
			>
				<defs>
					<linearGradient id="wallPosterGradient" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#A78BFA" stopOpacity={0.65} />
						<stop offset="100%" stopColor="#7C3AED" stopOpacity={0.5} />
					</linearGradient>
					<clipPath id="wallPosterClip">
						<rect x={posterX} y={posterY} width={posterWpx} height={posterHpx} />
					</clipPath>
				</defs>

				{/* floor line */}
				<line x1={0} y1={baseY} x2={svgWidth} y2={baseY} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />

				{/* door */}
				<rect
					x={doorX}
					y={doorY}
					width={doorWpx}
					height={doorHpx}
					rx={2}
					fill="none"
					stroke="currentColor"
					strokeOpacity={0.55}
					strokeWidth={1.5}
				/>
				<circle
					cx={doorX + doorWpx - 6}
					cy={doorY + doorHpx / 2}
					r={1.6}
					fill="currentColor"
					fillOpacity={0.55}
				/>

				{/* poster */}
				{previewSrc ? (
					<image
						href={previewSrc}
						x={posterX}
						y={posterY}
						width={posterWpx}
						height={posterHpx}
						preserveAspectRatio="none"
						clipPath="url(#wallPosterClip)"
					/>
				) : (
					<rect
						x={posterX}
						y={posterY}
						width={posterWpx}
						height={posterHpx}
						fill="url(#wallPosterGradient)"
					/>
				)}
				{Array.from({ length: Math.max(0, cols - 1) }, (_, index) => {
					const x = posterX + ((index + 1) * posterWpx) / cols;
					return (
						<line
							key={`poster-v-${index}`}
							x1={x}
							y1={posterY}
							x2={x}
							y2={posterY + posterHpx}
							stroke="white"
							strokeOpacity={0.7}
							strokeWidth={1.2}
						/>
					);
				})}
				{Array.from({ length: Math.max(0, rows - 1) }, (_, index) => {
					const y = posterY + ((index + 1) * posterHpx) / rows;
					return (
						<line
							key={`poster-h-${index}`}
							x1={posterX}
							y1={y}
							x2={posterX + posterWpx}
							y2={y}
							stroke="white"
							strokeOpacity={0.7}
							strokeWidth={1.2}
						/>
					);
				})}

				{/* labels */}
				<text
					x={doorX + doorWpx / 2}
					y={baseY + 16}
					textAnchor="middle"
					fontSize={9}
					fontWeight={700}
					fill="currentColor"
					fillOpacity={0.6}
				>
					Puerta (2 m)
				</text>
				<text
					x={posterX + posterWpx / 2}
					y={baseY + 16}
					textAnchor="middle"
					fontSize={9}
					fontWeight={700}
					fill="#7C3AED"
				>
					~{posterWidthCm} × {posterHeightCm} cm
				</text>
			</svg>
		</div>
	);
}
