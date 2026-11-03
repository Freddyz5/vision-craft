import type { CanvasConfig, CanvasPresetId } from "../../../shared/store/canvasStore";

const PAPER_NAMES: Record<CanvasPresetId, string> = {
	"a4-portrait": "A4",
	"a4-landscape": "A4",
	"a3-portrait": "A3",
	"a3-landscape": "A3",
	"us-letter": "Carta",
	"poster-small": "Póster S",
	"poster-large": "Póster L",
	"square-mini": "Cuadrado",
	custom: "Personalizado",
};

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("es-ES");

/** "A4 vertical · 21 × 29,7 cm" */
export function paperLabel(config: CanvasConfig): string {
	const orientation =
		config.widthMm === config.heightMm
			? ""
			: config.widthMm > config.heightMm
				? " horizontal"
				: " vertical";
	return `${PAPER_NAMES[config.presetId] ?? "Personalizado"}${orientation} · ${cm(config.widthMm)} × ${cm(config.heightMm)} cm`;
}
