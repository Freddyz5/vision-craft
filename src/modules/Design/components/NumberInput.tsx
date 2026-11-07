import type React from "react";
import { useEffect, useRef } from "react";

interface NumberInputProps extends Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"
> {
	/** The current value, shown whenever the person isn't typing in the field. */
	value: number;
	/** A finished entry (Enter, leaving the field, or an arrow/spinner step), already clamped. */
	onCommit: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	/** Decimals shown and kept. */
	decimals?: number;
}

function rounded(value: number, decimals: number): number {
	return Number(value.toFixed(decimals)) || 0;
}

/**
 * A number field that lets the person type freely: nothing is applied
 * keystroke by keystroke (a "1" on the way to "12" isn't rejected, and the
 * field can be emptied). The entry is applied when it's finished and kept
 * inside min–max; an empty or invalid entry puts the current value back.
 */
export function NumberInput({
	value,
	onCommit,
	min,
	max,
	step = 1,
	decimals = 0,
	onKeyDown,
	...rest
}: NumberInputProps) {
	const ref = useRef<HTMLInputElement>(null);
	const shown = rounded(value, decimals);
	// Enter can also fire a change event: apply one entry only once.
	const sentRef = useRef<number | null>(null);

	// Follow outside changes (undo, the canvas) unless the person is typing here.
	useEffect(() => {
		sentRef.current = null;
		const input = ref.current;
		if (input && document.activeElement !== input) input.value = String(shown);
	}, [shown]);

	const commitRef = useRef(() => {});
	useEffect(() => {
		commitRef.current = () => {
			const input = ref.current;
			if (!input) return;
			const typed = input.valueAsNumber;
			if (!Number.isFinite(typed)) {
				input.value = String(shown);
				return;
			}
			const next = rounded(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, typed)), decimals);
			input.value = String(next);
			if (next === shown || next === sentRef.current) return;
			sentRef.current = next;
			onCommit(next);
		};
	});

	// The native change event fires once an entry is finished: on Enter or
	// blur after typing, and on every arrow-key or spinner step.
	useEffect(() => {
		const input = ref.current;
		if (!input) return;
		const commit = () => commitRef.current();
		input.addEventListener("change", commit);
		return () => input.removeEventListener("change", commit);
	}, []);

	return (
		<input
			ref={ref}
			type="number"
			inputMode="decimal"
			defaultValue={shown}
			min={min}
			max={max}
			step={step}
			onKeyDown={(e) => {
				if (e.key === "Enter") commitRef.current();
				else if (e.key === "Escape") e.currentTarget.value = String(shown);
				onKeyDown?.(e);
			}}
			{...rest}
		/>
	);
}
