import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { measureTextHeight } from "../../../shared/utils/textMetrics";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { NumberInput } from "./NumberInput";
import { resizePhotoBox } from "../utils/crop";

const PX_PER_CM = MM_TO_PX * 10;

interface PositionFieldsProps {
	item: CanvasItem;
	onUpdate: (patch: Partial<CanvasItem>) => void;
}

/**
 * One item's exact position and size in cm and rotation in degrees
 * (desktop, inside "Organizar"). A text's height follows its lines, so it
 * has no height field; a photo is cropped to a typed size, never stretched.
 */
export function PositionFields({ item, onUpdate }: PositionFieldsProps) {
	const text = isTextItem(item);
	return (
		<fieldset className="grid grid-cols-2 gap-2">
			<legend className="sr-only">Posición y tamaño</legend>
			<NumberField
				label="X (cm)"
				value={item.x / PX_PER_CM}
				onChange={(v) => onUpdate({ x: v * PX_PER_CM })}
			/>
			<NumberField
				label="Y (cm)"
				value={item.y / PX_PER_CM}
				onChange={(v) => onUpdate({ y: v * PX_PER_CM })}
			/>
			<NumberField
				label="Ancho (cm)"
				value={item.width / PX_PER_CM}
				min={0.5}
				onChange={(v) => {
					const width = v * PX_PER_CM;
					// A text's height follows the lines its new width wraps into; a
					// photo is cropped to the new width, never stretched.
					onUpdate(
						text
							? { width, height: measureTextHeight({ ...item, width }) }
							: resizePhotoBox(item, { x: 0, y: 0, width, height: item.height }),
					);
				}}
			/>
			{!text && (
				<NumberField
					label="Alto (cm)"
					value={item.height / PX_PER_CM}
					min={0.5}
					onChange={(v) =>
						onUpdate(resizePhotoBox(item, { x: 0, y: 0, width: item.width, height: v * PX_PER_CM }))
					}
				/>
			)}
			<NumberField
				label="Giro (°)"
				value={item.rotation}
				step={1}
				onChange={(v) => onUpdate({ rotation: v })}
			/>
		</fieldset>
	);
}

function NumberField({
	label,
	value,
	onChange,
	step = 0.1,
	min,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	step?: number;
	min?: number;
}) {
	return (
		<label className="text-df-muted dark:text-df-muted-dark flex flex-col gap-1 text-xs font-semibold">
			{label}
			<NumberInput
				step={step}
				min={min}
				decimals={step < 1 ? 1 : 0}
				value={value}
				onCommit={onChange}
				className="text-df-ink dark:text-df-ink-dark bg-df-well dark:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-lg px-2 py-1.5 text-sm tabular-nums focus-visible:outline-2"
			/>
		</label>
	);
}
