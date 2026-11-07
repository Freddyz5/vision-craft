import { BringToFront, Ellipsis, SendToBack } from "lucide-react";
import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { measureTextHeight } from "../../../shared/utils/textMetrics";
import { MM_TO_PX } from "../../Canvas/constants/presets";
import { NumberInput } from "./NumberInput";
import { ToolPopover } from "./ToolPopover";

const PX_PER_CM = MM_TO_PX * 10;

interface MoreMenuProps {
	/** The single selected item, to place exactly; absent for a group. */
	item?: CanvasItem;
	onBringToFront: () => void;
	onSendToBack: () => void;
	onUpdate: (patch: Partial<CanvasItem>) => void;
}

/**
 * "⋯" in the floating toolbar (desktop): Al frente / Al fondo, and for one
 * item its exact position and size in cm and rotation in degrees.
 */
export function MoreMenu({ item, onBringToFront, onSendToBack, onUpdate }: MoreMenuProps) {
	const text = !!item && isTextItem(item);
	return (
		<ToolPopover
			label="Más opciones"
			panelLabel="Más opciones"
			widthClass="w-64"
			icon={<Ellipsis className="h-4 w-4" aria-hidden="true" />}
		>
			<div className="grid grid-cols-2 gap-1">
				<button
					type="button"
					onClick={onBringToFront}
					className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold focus-visible:outline-2"
				>
					<BringToFront className="h-4 w-4" aria-hidden="true" />
					Al frente
				</button>
				<button
					type="button"
					onClick={onSendToBack}
					className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold focus-visible:outline-2"
				>
					<SendToBack className="h-4 w-4" aria-hidden="true" />
					Al fondo
				</button>
			</div>

			{item && (
				<fieldset className="border-df-hairline dark:border-df-hairline-dark grid grid-cols-2 gap-2 border-t pt-3">
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
							// A text's height follows the lines its new width wraps into.
							onUpdate(text ? { width, height: measureTextHeight({ ...item, width }) } : { width });
						}}
					/>
					{!text && (
						<NumberField
							label="Alto (cm)"
							value={item.height / PX_PER_CM}
							min={0.5}
							onChange={(v) => onUpdate({ height: v * PX_PER_CM })}
						/>
					)}
					<NumberField
						label="Giro (°)"
						value={item.rotation}
						step={1}
						onChange={(v) => onUpdate({ rotation: v })}
					/>
				</fieldset>
			)}
		</ToolPopover>
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
