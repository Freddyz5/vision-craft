import type React from "react";
import { useEffect, useId, useRef, useState } from "react";

interface ToolPopoverProps {
	/** The button's name (its tooltip on desktop, its caption on mobile). */
	label: string;
	icon: React.ReactNode;
	/** Accessible name of the panel. */
	panelLabel: string;
	/** Docked (mobile): the panel opens fixed above the bottom bar, full width. */
	docked?: boolean;
	/** Tailwind width class for the floating panel. */
	widthClass?: string;
	children: React.ReactNode;
}

/**
 * A toolbar button that opens a small panel of options under it. Clicking
 * outside or Esc closes it (Esc is caught first, so it doesn't also clear
 * the selection).
 */
export function ToolPopover({
	label,
	icon,
	panelLabel,
	docked = false,
	widthClass = "w-64",
	children,
}: ToolPopoverProps) {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

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
		<div ref={rootRef} className={docked ? "flex shrink-0" : "relative"}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls={panelId}
				aria-label={docked ? undefined : label}
				title={docked ? undefined : label}
				className={[
					"text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2",
					docked
						? "min-w-14 flex-col gap-1 rounded-xl px-2 text-[11px] font-semibold"
						: "h-9 w-9 rounded-full",
					open ? "bg-df-well dark:bg-df-well-dark" : "",
				].join(" ")}
			>
				{icon}
				{docked && <span>{label}</span>}
			</button>

			{open && (
				<div
					id={panelId}
					role="group"
					aria-label={panelLabel}
					className={[
						"bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark z-40 space-y-3 rounded-2xl border p-3 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]",
						// Fixed on mobile so the bar's horizontal scroll can't clip it.
						docked
							? "fixed inset-x-3 bottom-20"
							: `absolute top-full left-1/2 mt-2 -translate-x-1/2 ${widthClass}`,
					].join(" ")}
				>
					{children}
				</div>
			)}
		</div>
	);
}

/** A labelled range row for popover panels. */
export function PanelSlider({
	label,
	value,
	min,
	max,
	onChange,
	suffix = "",
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
	suffix?: string;
}) {
	return (
		<label className="text-df-muted dark:text-df-muted-dark grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-xs font-semibold">
			{label}
			<input
				type="range"
				min={min}
				max={max}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="accent-df-primary dark:accent-df-primary-dark"
			/>
			<span className="text-df-ink dark:text-df-ink-dark text-right tabular-nums">
				{value}
				{suffix}
			</span>
		</label>
	);
}
