export const RULER_SIZE = 20;

interface SheetRulerProps {
	orientation: "horizontal" | "vertical";
	lengthMm: number;
	/** Screen px per mm of the sheet at the current zoom. */
	pxPerMm: number;
	className?: string;
}

/**
 * A centimetre ruler along one edge of the sheet. Lives outside the Konva
 * stage, so it never reaches an export. Labels thin out as the sheet shrinks.
 */
export function SheetRuler({ orientation, lengthMm, pxPerMm, className = "" }: SheetRulerProps) {
	const horizontal = orientation === "horizontal";
	const length = lengthMm * pxPerMm;
	const labelEveryMm = [10, 50, 100].find((mm) => mm * pxPerMm >= 28) ?? 100;
	const tickEveryMm = pxPerMm * 5 >= 5 ? 5 : 10;

	const ticks: { at: number; mm: number }[] = [];
	for (let mm = 0; mm <= lengthMm + 0.01; mm += tickEveryMm) ticks.push({ at: mm * pxPerMm, mm });

	return (
		<svg
			aria-hidden="true"
			width={horizontal ? length : RULER_SIZE}
			height={horizontal ? RULER_SIZE : length}
			className={`text-df-muted dark:text-df-muted-dark overflow-visible select-none ${className}`}
		>
			{ticks.map(({ at, mm }) => {
				const labelled = mm % labelEveryMm === 0;
				const size = labelled ? 8 : mm % 10 === 0 ? 5 : 3;
				return (
					<g key={mm}>
						{horizontal ? (
							<line x1={at} x2={at} y1={RULER_SIZE - size} y2={RULER_SIZE} stroke="currentColor" />
						) : (
							<line y1={at} y2={at} x1={RULER_SIZE - size} x2={RULER_SIZE} stroke="currentColor" />
						)}
						{labelled && mm > 0 && (
							<text
								x={horizontal ? at + 2 : RULER_SIZE - 10}
								y={horizontal ? 9 : at + 2}
								fontSize={10}
								fill="currentColor"
								textAnchor={horizontal ? "start" : "end"}
								dominantBaseline={horizontal ? "middle" : "hanging"}
								transform={horizontal ? undefined : `rotate(-90 ${RULER_SIZE - 10} ${at + 2})`}
							>
								{mm / 10}
							</text>
						)}
					</g>
				);
			})}
		</svg>
	);
}
