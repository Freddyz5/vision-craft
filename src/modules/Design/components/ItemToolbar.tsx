import type React from "react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	CopyPlus,
	Crop,
	LockOpen,
	PenLine,
	RotateCw,
	Trash2,
	Type,
} from "lucide-react";
import {
	TEXT_DEFAULTS,
	isTextItem,
	type CanvasItem,
	type TextAlign,
} from "../../../shared/store/canvasStore";
import { measureTextHeight } from "../../../shared/utils/textMetrics";
import { TEXT_FONTS, fontStack } from "../../../shared/utils/fonts";
import { AlignControls, AlignMenu } from "./AlignMenu";
import { ArrangeMenu } from "./ArrangeMenu";
import { DesktopOnlyChip } from "./DesktopOnlyChip";
import { ShapeMenu } from "./ShapeMenu";
import { AdjustMenu } from "./AdjustMenu";
import { FrameMenu } from "./FrameMenu";
import { PositionFields } from "./PositionFields";
import { NumberInput } from "./NumberInput";
import { PopoverSideContext, Tip, ToolPopover } from "./ToolPopover";
import type { AlignEdge, AlignReference, DistributeAxis } from "../utils/arrange";
import { CROP_ASPECTS, type CropAspectId } from "../utils/crop";
import { shortcut } from "../utils/shortcuts";
import { useToolbarRoving } from "../hooks/useToolbarRoving";

/** The alignment button steps through these, like Canva's. */
const ALIGNS: { value: TextAlign; label: string; Icon: typeof AlignLeft }[] = [
	{ value: "left", label: "izquierda", Icon: AlignLeft },
	{ value: "center", label: "centro", Icon: AlignCenter },
	{ value: "right", label: "derecha", Icon: AlignRight },
];

/** Konva font sizes are logical px at 96 dpi; people pick sizes in points. */
const PX_PER_PT = 96 / 72;
const MIN_PT = 6;
const MAX_PT = 400;

interface ItemToolbarProps {
	/** The selection: one item gets its own controls, several get group actions. */
	items: CanvasItem[];
	/** "floating" sits over the selection on desktop; "docked" fills the bottom bar on mobile. */
	variant: "floating" | "docked";
	onUpdate: (patch: Partial<CanvasItem>) => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	/** One layer up or down. */
	onMoveLayer: (direction: "up" | "down") => void;
	/** Lock the selection, or unlock it when any of it is locked. */
	onToggleLock: () => void;
	onRemove: () => void;
	onEditText: () => void;
	onDuplicate: () => void;
	/** Set when the selection is one photo that can be cropped. */
	onCrop?: () => void;
	onAlign: (edge: AlignEdge, reference: AlignReference) => void;
	onDistribute: (axis: DistributeAxis) => void;
	style?: React.CSSProperties;
	/** Floating: which way its panels open, away from the selection. */
	panelSide?: "above" | "below";
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
	onMoveLayer,
	onToggleLock,
	onRemove,
	onEditText,
	onDuplicate,
	onCrop,
	onAlign,
	onDistribute,
	style,
	panelSide = "below",
}: ItemToolbarProps) {
	const [item] = items;
	const group = items.length > 1;
	const text = !group && isTextItem(item);
	const docked = variant === "docked";
	const fontSize = item.fontSize || TEXT_DEFAULTS.fontSize;
	const toolbarRef = useToolbarRoving<HTMLDivElement>();

	// Anything locked in the selection: the only action is to unlock it.
	if (items.some((i) => i.locked)) {
		return (
			<div
				ref={toolbarRef}
				role="toolbar"
				aria-label="Elemento bloqueado"
				style={style}
				className={
					docked
						? "bg-df-surface dark:bg-df-surface-dark flex h-full items-center justify-center px-2"
						: "bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark absolute z-20 flex items-center rounded-full border p-1 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]"
				}
			>
				<button
					type="button"
					onClick={onToggleLock}
					className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-visible:outline-2 md:h-9"
				>
					<LockOpen className="h-4 w-4" aria-hidden="true" />
					Desbloquear
				</button>
			</div>
		);
	}

	// NumberInput keeps it within MIN_PT–MAX_PT.
	const setPointSize = (pt: number) => {
		const next = pt * PX_PER_PT;
		// The box takes the lines the new size wraps into.
		onUpdate({ fontSize: next, height: measureTextHeight({ ...item, fontSize: next }) });
	};
	const setFontFamily = (fontFamily: string) =>
		onUpdate({ fontFamily, height: measureTextHeight({ ...item, fontFamily }) });
	const fontFamily = item.fontFamily || TEXT_DEFAULTS.fontFamily;
	// A board saved with a font no longer offered keeps it, listed by name.
	const fontOptions: { family: string; label: string }[] = TEXT_FONTS.some(
		(f) => f.family === fontFamily,
	)
		? [...TEXT_FONTS]
		: [...TEXT_FONTS, { family: fontFamily, label: fontFamily }];
	const alignIndex = Math.max(
		0,
		ALIGNS.findIndex((a) => a.value === (item.align || TEXT_DEFAULTS.align)),
	);
	const align = ALIGNS[alignIndex];
	const nextAlign = ALIGNS[(alignIndex + 1) % ALIGNS.length];

	// Font, size, colour and alignment: inline on desktop, in "Estilo" on a phone.
	const textStyle = (
		<>
			<select
				value={fontFamily}
				onChange={(e) => setFontFamily(e.target.value)}
				aria-label="Fuente"
				// The closed field previews the font it names.
				style={{ fontFamily: fontStack(fontFamily) }}
				className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-9 shrink-0 cursor-pointer rounded-full bg-transparent px-2 text-sm font-semibold focus-visible:outline-2 dark:scheme-dark pointer-coarse:h-11"
			>
				{fontOptions.map((f) => (
					<option key={f.family} value={f.family}>
						{f.label}
					</option>
				))}
			</select>
			<label className="text-df-muted dark:text-df-muted-dark flex shrink-0 items-center gap-1 text-xs font-semibold">
				<NumberInput
					min={MIN_PT}
					max={MAX_PT}
					value={Math.round(fontSize / PX_PER_PT)}
					onCommit={setPointSize}
					aria-label="Tamaño en puntos"
					className="text-df-ink dark:text-df-ink-dark bg-df-well dark:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark h-8 w-14 rounded-full px-2 text-center text-sm font-semibold tabular-nums focus-visible:outline-2 pointer-coarse:h-11"
				/>
				pt
			</label>
			<label className="hover:bg-df-well dark:hover:bg-df-well-dark has-focus-visible:outline-df-primary dark:has-focus-visible:outline-df-primary-dark relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full has-focus-visible:outline-2 pointer-coarse:h-11 pointer-coarse:w-11">
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
			<ToolButton
				docked={false}
				label={`Alineación: ${align.label}`}
				onClick={() => onUpdate({ align: nextAlign.value })}
			>
				<align.Icon className="h-4 w-4" aria-hidden="true" />
			</ToolButton>
		</>
	);

	return (
		<PopoverSideContext.Provider value={panelSide}>
			<div
				ref={toolbarRef}
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
						{docked ? (
							// On a phone the type controls open from one button, so the bar fits.
							<ToolPopover
								docked
								label="Estilo"
								panelLabel="Estilo del texto"
								icon={<Type className="h-4 w-4" aria-hidden="true" />}
							>
								<div className="flex flex-wrap items-center gap-2">{textStyle}</div>
							</ToolPopover>
						) : (
							textStyle
						)}
						<Divider docked={docked} />
					</>
				)}

				{onCrop && (
					<>
						<ToolButton docked={docked} showLabel={!docked} label="Recortar" onClick={onCrop}>
							<Crop className="h-4 w-4" aria-hidden="true" />
						</ToolButton>
						<ShapeMenu
							shape={item.shape}
							onChange={(shape) => onUpdate({ shape })}
							docked={docked}
							showLabel={!docked}
						/>
						{/* Desktop only, per the editor brief. */}
						{!docked && (
							<>
								<AdjustMenu item={item} onChange={(adjust) => onUpdate({ adjust })} showLabel />
								<FrameMenu item={item} onChange={(frame) => onUpdate({ frame })} showLabel />
							</>
						)}
						<Divider docked={docked} />
					</>
				)}
				{/* Lining items up is what a group is selected for, so it stays in view. */}
				{group && !docked && (
					<AlignMenu count={items.length} onAlign={onAlign} onDistribute={onDistribute} />
				)}
				{/* Layers, alignment to the sheet, exact position and lock: one menu. */}
				<ArrangeMenu
					docked={docked}
					onMoveLayer={onMoveLayer}
					onBringToFront={onBringToFront}
					onSendToBack={onSendToBack}
					onToggleLock={onToggleLock}
				>
					{!docked && !group && (
						<>
							<div className="border-df-hairline dark:border-df-hairline-dark space-y-2 border-t pt-3">
								<AlignControls count={1} onAlign={onAlign} onDistribute={onDistribute} />
							</div>
							<div className="border-df-hairline dark:border-df-hairline-dark border-t pt-3">
								<PositionFields item={item} onUpdate={onUpdate} />
							</div>
						</>
					)}
				</ArrangeMenu>
				{/* Desktop only, per the editor brief; on mobile it waits for "Más en computadora". */}
				{!docked && (
					<ToolButton docked={docked} label={`Duplicar (${shortcut("D")})`} onClick={onDuplicate}>
						<CopyPlus className="h-4 w-4" aria-hidden="true" />
					</ToolButton>
				)}
				{/* Quitar last and set apart, so it isn't hit on the way to another tool. */}
				{!docked && <Divider docked={docked} />}
				<ToolButton docked={docked} label={docked ? "Quitar" : "Quitar (Supr)"} onClick={onRemove}>
					<Trash2 className="h-4 w-4" aria-hidden="true" />
				</ToolButton>
				{docked && (
					<>
						<Divider docked={docked} />
						<DesktopOnlyChip />
					</>
				)}
			</div>
		</PopoverSideContext.Provider>
	);
}

function ToolButton({
	label,
	onClick,
	docked,
	showLabel = false,
	children,
}: {
	label: string;
	onClick: () => void;
	docked: boolean;
	/** Desktop: the name beside the icon instead of a tooltip. */
	showLabel?: boolean;
	children: React.ReactNode;
}) {
	const captioned = docked || showLabel;
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={captioned ? undefined : label}
			className={[
				"group text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark relative flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2",
				docked
					? "min-w-14 flex-col gap-1 rounded-xl px-2 text-xs font-semibold"
					: showLabel
						? "h-9 gap-1.5 rounded-full px-3 text-sm font-semibold pointer-coarse:h-11"
						: "h-9 w-9 rounded-full pointer-coarse:h-11 pointer-coarse:w-11",
			].join(" ")}
		>
			{children}
			{captioned && <span>{label}</span>}
			{!captioned && <Tip text={label} />}
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

interface CropToolbarProps {
	variant: "floating" | "docked";
	aspect: CropAspectId;
	onAspect: (aspect: CropAspectId) => void;
	/** The chosen proportion turned (5:4 rather than 4:5). */
	flipped: boolean;
	/** Set when the chosen proportion can be turned (not Libre or 1:1). */
	onFlip?: () => void;
	onCancel: () => void;
	onDone: () => void;
	style?: React.CSSProperties;
}

/** What the item toolbar turns into during crop mode. Enter = Listo, Esc = Cancelar. */
export function CropToolbar({
	variant,
	aspect,
	onAspect,
	flipped,
	onFlip,
	onCancel,
	onDone,
	style,
}: CropToolbarProps) {
	const docked = variant === "docked";
	const toolbarRef = useToolbarRoving<HTMLDivElement>();
	return (
		<div
			ref={toolbarRef}
			role="toolbar"
			aria-label="Recorte"
			style={style}
			className={
				docked
					? "bg-df-surface dark:bg-df-surface-dark flex h-full items-center gap-2 overflow-x-auto px-3"
					: "bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark absolute z-20 flex items-center gap-1 rounded-full border p-1 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]"
			}
		>
			{!docked && (
				<>
					<span className="text-df-muted dark:text-df-muted-dark shrink-0 px-2 text-xs font-semibold">
						Arrastra el recuadro o sus esquinas
					</span>
					<Divider docked={docked} />
				</>
			)}
			<div role="group" aria-label="Proporción" className="flex shrink-0 items-center gap-0.5">
				{CROP_ASPECTS.map((a) => (
					<button
						key={a.id}
						type="button"
						aria-pressed={aspect === a.id}
						onClick={() => onAspect(a.id)}
						className={[
							"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark shrink-0 rounded-full text-xs font-semibold transition-colors focus-visible:outline-2",
							docked ? "h-11 px-2.5" : "h-8 px-3",
							aspect === a.id
								? "bg-df-primary/10 dark:bg-df-primary-dark/15 text-df-primary dark:text-df-primary-dark"
								: "text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark",
						].join(" ")}
					>
						{/* Turned, "4:5" reads "5:4". */}
						{flipped && aspect === a.id ? a.label.split(":").reverse().join(":") : a.label}
					</button>
				))}
				{onFlip && (
					<button
						type="button"
						onClick={onFlip}
						aria-label="Girar la proporción"
						className={`group text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark relative flex shrink-0 items-center justify-center rounded-full focus-visible:outline-2 ${docked ? "h-11 w-11" : "h-8 w-8"}`}
					>
						<RotateCw className="h-4 w-4" aria-hidden="true" />
						{!docked && <Tip text="Girar la proporción" />}
					</button>
				)}
			</div>
			<Divider docked={docked} />
			<button
				type="button"
				onClick={onCancel}
				className={`text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark shrink-0 rounded-full px-3 text-sm font-semibold focus-visible:outline-2 ${docked ? "h-11" : "h-8"}`}
			>
				Cancelar
			</button>
			<button
				type="button"
				onClick={onDone}
				className={`bg-df-primary dark:bg-df-primary-dark dark:text-df-on-primary-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark shrink-0 rounded-full px-4 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${docked ? "h-11" : "h-8"}`}
			>
				Listo
			</button>
		</div>
	);
}
