import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignHorizontalSpaceBetween,
	AlignStartHorizontal,
	AlignStartVertical,
	AlignVerticalSpaceBetween,
} from "lucide-react";
import type { AlignEdge, AlignReference, DistributeAxis } from "../utils/arrange";

const ALIGN_ROWS: { edge: AlignEdge; label: string; Icon: typeof AlignStartVertical }[][] = [
	[
		{ edge: "left", label: "Izquierda", Icon: AlignStartVertical },
		{ edge: "center", label: "Centro", Icon: AlignCenterVertical },
		{ edge: "right", label: "Derecha", Icon: AlignEndVertical },
	],
	[
		{ edge: "top", label: "Arriba", Icon: AlignStartHorizontal },
		{ edge: "middle", label: "Medio", Icon: AlignCenterHorizontal },
		{ edge: "bottom", label: "Abajo", Icon: AlignEndHorizontal },
	],
];

interface AlignMenuProps {
	/** How many items are selected: alignment to the selection needs 2, distributing needs 3. */
	count: number;
	onAlign: (edge: AlignEdge, reference: AlignReference) => void;
	onDistribute: (axis: DistributeAxis) => void;
}

/** "Alinear" in the item toolbar: a small panel to line items up or space them evenly. */
export function AlignMenu({ count, onAlign, onDistribute }: AlignMenuProps) {
	const [open, setOpen] = useState(false);
	const [reference, setReference] = useState<AlignReference>("selection");
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	// One item can only line up with the sheet.
	const effectiveReference: AlignReference = count < 2 ? "sheet" : reference;

	useEffect(() => {
		if (!open) return;
		const closeOnOutside = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.stopPropagation();
			setOpen(false);
			triggerRef.current?.focus();
		};
		document.addEventListener("pointerdown", closeOnOutside);
		document.addEventListener("keydown", closeOnEscape, true);
		return () => {
			document.removeEventListener("pointerdown", closeOnOutside);
			document.removeEventListener("keydown", closeOnEscape, true);
		};
	}, [open]);

	return (
		<div ref={rootRef} className="relative">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-label="Alinear"
				title="Alinear"
				className={[
					"text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2",
					open ? "bg-df-well dark:bg-df-well-dark" : "",
				].join(" ")}
			>
				<AlignCenterVertical className="h-4 w-4" aria-hidden="true" />
			</button>

			{open && (
				<div
					role="group"
					aria-label="Alinear y distribuir"
					className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark absolute top-full left-1/2 z-30 mt-2 w-60 -translate-x-1/2 space-y-3 rounded-2xl border p-3 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]"
				>
					{count >= 2 ? (
						<fieldset>
							<legend className="text-df-muted dark:text-df-muted-dark mb-1.5 text-xs font-semibold">
								Respecto a
							</legend>
							<div className="bg-df-well dark:bg-df-well-dark grid grid-cols-2 gap-1 rounded-full p-1">
								{(
									[
										["selection", "La selección"],
										["sheet", "La hoja"],
									] as const
								).map(([value, label]) => (
									<button
										key={value}
										type="button"
										aria-pressed={reference === value}
										onClick={() => setReference(value)}
										className={[
											"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-full px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-2",
											reference === value
												? "bg-df-surface dark:bg-df-surface-dark text-df-ink dark:text-df-ink-dark shadow-sm"
												: "text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark",
										].join(" ")}
									>
										{label}
									</button>
								))}
							</div>
						</fieldset>
					) : (
						<p className="text-df-muted dark:text-df-muted-dark text-xs font-semibold">
							Respecto a la hoja
						</p>
					)}

					{ALIGN_ROWS.map((row, i) => (
						<div key={i} className="grid grid-cols-3 gap-1">
							{row.map(({ edge, label, Icon }) => (
								<PanelButton
									key={edge}
									label={label}
									onClick={() => onAlign(edge, effectiveReference)}
								>
									<Icon className="h-4 w-4" aria-hidden="true" />
								</PanelButton>
							))}
						</div>
					))}

					{count >= 3 && (
						<div className="border-df-hairline dark:border-df-hairline-dark grid grid-cols-2 gap-1 border-t pt-3">
							<PanelButton
								label="Repartir en horizontal"
								onClick={() => onDistribute("horizontal")}
							>
								<AlignHorizontalSpaceBetween className="h-4 w-4" aria-hidden="true" />
							</PanelButton>
							<PanelButton label="Repartir en vertical" onClick={() => onDistribute("vertical")}>
								<AlignVerticalSpaceBetween className="h-4 w-4" aria-hidden="true" />
							</PanelButton>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function PanelButton({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-2"
		>
			{children}
			{label}
		</button>
	);
}
