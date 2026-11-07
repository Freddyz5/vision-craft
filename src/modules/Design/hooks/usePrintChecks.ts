import { useMemo } from "react";
import { useStore } from "@nanostores/react";
import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { canvasImagesStore } from "../../../shared/store/canvasImages";
import {
	COVERED_WARNING,
	checkItem,
	imagePpi,
	isTextCovered,
	warningKey,
	type PrintWarning,
	type Sheet,
} from "../utils/printChecks";

export interface PrintListRow {
	item: CanvasItem;
	/** Open warnings, most serious first (dismissed ones left out). */
	warnings: PrintWarning[];
	/** Printed sharpness for photos whose size is known. */
	ppi: number | null;
}

/** The print list: one row per item, front-most first, with its open warnings. */
export function usePrintChecks(items: CanvasItem[], sheet: Sheet, dismissed: Set<string>) {
	const images = useStore(canvasImagesStore);

	return useMemo(() => {
		const rows: PrintListRow[] = [...items]
			.sort((a, b) => b.zIndex - a.zIndex)
			.map((item) => {
				const image = item.imageSrc ? images[item.imageSrc] : undefined;
				const warnings = checkItem(item, sheet, image);
				// The one check that needs the rest of the board.
				if (isTextItem(item) && isTextCovered(item, items)) warnings.push(COVERED_WARNING);
				return {
					item,
					// A hidden item won't print, so it can't go wrong on paper.
					warnings: item.hidden
						? []
						: warnings.filter((w) => !dismissed.has(warningKey(item.id, w.kind))),
					ppi: isTextItem(item) ? null : imagePpi(item, image),
				};
			});
		const warningCount = rows.reduce((n, row) => n + row.warnings.length, 0);
		return { rows, warningCount };
	}, [items, sheet, images, dismissed]);
}
