import type React from "react";
import { BringToFront, CopyPlus, PenLine, SendToBack, Trash2 } from "lucide-react";
import { TEXT_DEFAULTS, isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import { AlignMenu } from "./AlignMenu";
import { DesktopOnlyChip } from "./DesktopOnlyChip";
import type { AlignEdge, AlignReference, DistributeAxis } from "../utils/arrange";

const FONTS = [
	{ value: "Inter", label: "Inter" },
	{ value: "Georgia", label: "Georgia" },
	{ value: "Courier New", label: "Courier" },
	{ value: "Comic Sans MS", label: "Comic" },
];

/** "⌘" on Apple keyboards, "Ctrl" elsewhere, for shortcut hints. */
function modKey(): string {
	return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

/** Konva font sizes are logical px at 96 dpi; people pick sizes in points. */
const PX_PER_PT = 96 / 72;

interface ItemToolbarProps {
	/** The selection: one item gets its own controls, several get group actions. */
	items: CanvasItem[];
	/** "floating" sits over the selection on desktop; "docked" fills the bottom bar on mobile. */
	variant: "floating" | "docked";
	onUpdate: (patch: Partial<CanvasItem>) => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	onRemove: () => void;
	onEditText: () => void;
	onDuplicate: () => void;
	onAlign: (edge: AlignEdge, reference: AlignReference) => void;
	onDistribute: (axis: DistributeAxis) => void;
	style?: React.CSSProperties;
}

/**
 * The selected item's actions, and the only place they live. Later phases
 * add crop, shape, adjustments, frame, duplicate and lock here.
 */
export function ItemToolbar({
	items,
	variant,
	onUpdate,
	onBringToFront,
	onSendToBack,
	onRemove,
	onEditText,
	onDuplicate,
	onAlign,
	onDistribute,
	style,
}: ItemToolbarProps) {
	const [item] = items;
	const group = items.length > 1;
	const text = !group && isTextItem(item);
	const docked = variant === "docked";
	const fontSize = item.fontSize || TEXT_DEFAULTS.fontSize;

	const setPointSize = (pt: number) => {
		if (!Number.isFinite(pt) || pt < 6) return;
		const next = Math.min(pt, 400) * PX_PER_PT;
		// Grow the box with the type so the same lines stay visible.
		onUpdate({ fontSize: next, height: item.height * (next / fontSize) });
	};

	return (
		<div
			role="toolbar"
			aria-label={
				group
					? `Acciones de ${items.length} elementos`
					: text
						? "Acciones del texto"
						: "Acciones de la foto"
			}
			style={style}
			className={
				docked
					? "bg-df-surface dark:bg-df-surface-dark flex h-full items-stretch gap-1 overflow-x-auto px-2"
					: "bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark absolute z-20 flex items-center gap-1 rounded-full border p-1 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]"
			}
		>
			{group && (
				<>
					<span className="text-df-muted dark:text-df-muted-dark shrink-0 px-2 text-xs font-semibold">
						{items.length} elementos
					</span>
					<Divider docked={docked} />
				</>
			)}
			{text && (
				<>
					<ToolButton docked={docked} label="Editar texto" onClick={onEditText}>
						<PenLine className="h-4 w-4" aria-hidden="true" />
					</ToolButton>
					<select
						value={item.fontFamily || TEXT_DEFAULTS.fontFamily}
						onChange={(e) => onUpdate({ fontFamily: e.target.value })}
						aria-label="Fuente"
						className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-9 shrink-0 cursor-pointer rounded-full bg-transparent px-2 text-sm font-semibold focus-visible:outline-2 dark:[color-scheme:dark]"
					>
						{FONTS.map((f) => (
							<option key={f.value} value={f.value}>
								{f.label}
							</option>
						))}
					</select>
					<label className="text-df-muted dark:text-df-muted-dark flex shrink-0 items-center gap-1 text-xs font-semibold">
						<input
							type="number"
							min={6}
							max={400}
							value={Math.round(fontSize / PX_PER_PT)}
							onChange={(e) => setPointSize(Number(e.target.value))}
							aria-label="Tamaño en puntos"
							className="text-df-ink dark:text-df-ink-dark bg-df-well dark:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-8 w-14 rounded-full px-2 text-center text-sm font-semibold tabular-nums focus-visible:outline-2"
						/>
						pt
					</label>
					<label className="hover:bg-df-well dark:hover:bg-df-well-dark relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full">
						<span
							className="border-df-hairline dark:border-df-hairline-dark h-5 w-5 rounded-full border-2"
							style={{ backgroundColor: item.fillColor || TEXT_DEFAULTS.fillColor }}
							aria-hidden="true"
						/>
						<input
							type="color"
							value={item.fillColor || TEXT_DEFAULTS.fillColor}
							onChange={(e) => onUpdate({ fillColor: e.target.value })}
							aria-label="Color del texto"
							className="absolute inset-0 cursor-pointer opacity-0"
						/>
					</label>
					<Divider docked={docked} />
				</>
			)}

			<ToolButton docked={docked} label="Al frente" onClick={onBringToFront}>
				<BringToFront className="h-4 w-4" aria-hidden="true" />
			</ToolButton>
			<ToolButton docked={docked} label="Al fondo" onClick={onSendToBack}>
				<SendToBack className="h-4 w-4" aria-hidden="true" />
			</ToolButton>
			<Divider docked={docked} />
			{/* Desktop only, per the editor brief; on mobile they wait for "Más en computadora". */}
			{!docked && (
				<>
					<AlignMenu count={items.length} onAlign={onAlign} onDistribute={onDistribute} />
					<ToolButton docked={docked} label={`Duplicar (${modKey()}+D)`} onClick={onDuplicate}>
						<CopyPlus className="h-4 w-4" aria-hidden="true" />
					</ToolButton>
				</>
			)}
			<ToolButton docked={docked} label="Quitar" onClick={onRemove}>
				<Trash2 className="h-4 w-4" aria-hidden="true" />
			</ToolButton>
			{docked && (
				<>
					<Divider docked={docked} />
					<DesktopOnlyChip />
				</>
			)}
		</div>
	);
}

function ToolButton({
	label,
	onClick,
	docked,
	children,
}: {
	label: string;
	onClick: () => void;
	docked: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={docked ? undefined : label}
			aria-label={docked ? undefined : label}
			className={[
				"text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2",
				docked
					? "min-w-14 flex-col gap-1 rounded-xl px-2 text-[11px] font-semibold"
					: "h-9 w-9 rounded-full",
			].join(" ")}
		>
			{children}
			{docked && <span>{label}</span>}
		</button>
	);
}

function Divider({ docked }: { docked: boolean }) {
	return (
		<span
			className={`bg-df-hairline dark:bg-df-hairline-dark w-px shrink-0 ${docked ? "my-3" : "h-5"}`}
			aria-hidden="true"
		/>
	);
}
