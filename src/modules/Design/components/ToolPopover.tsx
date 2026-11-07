import type React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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
	/** Desktop: show the name next to the icon instead of only in a tooltip. */
	showLabel?: boolean;
	children: React.ReactNode;
}

/**
 * The toolbar's tooltip: shown on hover (after a short wait) or keyboard
 * focus, instead of the browser's slow native one. The button carries the
 * same text as its accessible name, so this copy is hidden from readers.
 */
export function Tip({ text }: { text: string }) {
	return (
		<span
			aria-hidden="true"
			className="bg-df-ink dark:bg-df-surface-dark dark:border-df-hairline-dark pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-500 group-focus-visible:opacity-100 dark:border"
		>
			{text}
		</span>
	);
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
	showLabel = false,
	children,
}: ToolPopoverProps) {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

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

	// Keep the floating panel inside whatever clips it (the sheet's scrolling
	// area): centred under a button near the edge it would lose its first
	// options, and overflow to the left can't be scrolled to.
	useLayoutEffect(() => {
		const panel = panelRef.current;
		if (!open || docked || !panel) return;
		panel.style.marginLeft = "";
		panel.style.maxHeight = "";
		let clipper = panel.parentElement;
		while (clipper && getComputedStyle(clipper).overflowX === "visible") {
			clipper = clipper.parentElement;
		}
		const clip = clipper?.getBoundingClientRect() ?? {
			left: 0,
			right: window.innerWidth,
			bottom: window.innerHeight,
		};
		const rect = panel.getBoundingClientRect();
		const gap = 8;
		const shift =
			rect.left < clip.left + gap
				? clip.left + gap - rect.left
				: rect.right > clip.right - gap
					? clip.right - gap - rect.right
					: 0;
		if (shift) panel.style.marginLeft = `${shift}px`;
		// A long panel (Organizar) scrolls inside itself rather than past the
		// sheet's bottom edge, where its last options would be out of reach.
		const room = Math.min(clip.bottom, window.innerHeight) - rect.top - gap;
		if (rect.height > room) panel.style.maxHeight = `${Math.max(room, 200)}px`;
	}, [open, docked]);

	return (
		<div ref={rootRef} className={docked ? "flex shrink-0" : "relative"}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls={panelId}
				// A visible caption already names it; an icon alone gets the label.
				aria-label={docked || showLabel ? undefined : label}
				className={[
					"group text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark relative flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2",
					docked
						? "min-w-14 flex-col gap-1 rounded-xl px-2 text-xs font-semibold"
						: showLabel
							? "h-9 gap-1.5 rounded-full px-3 text-sm font-semibold pointer-coarse:h-11"
							: "h-9 w-9 rounded-full pointer-coarse:h-11 pointer-coarse:w-11",
					open ? "bg-df-well dark:bg-df-well-dark" : "",
				].join(" ")}
			>
				{icon}
				{(docked || showLabel) && <span>{label}</span>}
				{!docked && !showLabel && !open && <Tip text={label} />}
			</button>

			{open && (
				<div
					ref={panelRef}
					id={panelId}
					// Its controls aren't stops of the toolbar's arrow keys.
					data-toolbar-panel
					role="group"
					aria-label={panelLabel}
					className={[
						"bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark z-40 space-y-3 rounded-2xl border p-3 shadow-[0_10px_30px_-10px_rgb(17_24_39/0.35)] dark:shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]",
						// Fixed on mobile so the bar's horizontal scroll can't clip it.
						docked
							? "fixed inset-x-3 bottom-20"
							: `absolute top-full left-1/2 mt-2 -translate-x-1/2 overflow-y-auto overscroll-contain ${widthClass}`,
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
		<label className="text-df-muted dark:text-df-muted-dark grid grid-cols-[5.5rem_1fr_3.25rem] items-center gap-2 text-xs font-semibold">
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
