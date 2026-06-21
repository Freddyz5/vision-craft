interface TiledPagesGridProps {
	cols: number;
	rows: number;
	/** width / height of a single sheet, used so each numbered cell reads as portrait or landscape correctly */
	paperAspectRatio: number;
}

/**
 * Rasterbator-style numbered page grid: shows how many sheets the poster
 * splits into and in what order they'll print (left\u2192right, top\u2192bottom,
 * which is also CSS grid's default auto-flow). Purely visual \u2014 cols/rows
 * come straight from the already-corrected printConfig (Fase 0), no new math.
 */
export function TiledPagesGrid({ cols, rows, paperAspectRatio }: TiledPagesGridProps) {
	const total = cols * rows;
	const cells = Array.from({ length: total }, (_, i) => i + 1);

	return (
		<div
			className="grid gap-1.5"
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
		>
			{cells.map((n) => (
				<div
					key={n}
					className="flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-base-200/60 dark:bg-base-300/10 text-[10px] font-bold text-df-ink dark:text-df-ink-dark"
					style={{ aspectRatio: paperAspectRatio }}
				>
					{n}
				</div>
			))}
		</div>
	);
}
