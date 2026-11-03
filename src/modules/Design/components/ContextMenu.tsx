import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ContextMenuEntry {
	label: string;
	/** Shortcut hint shown on the right, e.g. "Ctrl+C". */
	hint?: string;
	onSelect: () => void;
	disabled?: boolean;
	/** Draw a divider above this entry. */
	separated?: boolean;
	danger?: boolean;
}

interface ContextMenuProps {
	/** Where the right click happened, in viewport px. */
	x: number;
	y: number;
	entries: ContextMenuEntry[];
	onClose: () => void;
}

/**
 * The editor's right-click menu (desktop). A real menu: focus starts on the
 * first entry, arrows move, Enter picks, Esc / click outside / scroll close.
 */
export function ContextMenu({ x, y, entries, onClose }: ContextMenuProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState({ left: x, top: y });

	// Keep the whole menu on screen.
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const { width, height } = el.getBoundingClientRect();
		setPos({
			left: Math.min(x, window.innerWidth - width - 8),
			top: Math.min(y, window.innerHeight - height - 8),
		});
	}, [x, y]);

	useEffect(() => {
		ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
		const close = (e: Event) => {
			if (e.type === "pointerdown" && ref.current?.contains(e.target as Node)) return;
			onClose();
		};
		document.addEventListener("pointerdown", close);
		window.addEventListener("resize", close);
		window.addEventListener("scroll", close, true);
		return () => {
			document.removeEventListener("pointerdown", close);
			window.removeEventListener("resize", close);
			window.removeEventListener("scroll", close, true);
		};
	}, [onClose]);

	const onKeyDown = (e: React.KeyboardEvent) => {
		const buttons = Array.from(
			ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
		);
		const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			const step = e.key === "ArrowDown" ? 1 : -1;
			buttons[(i + step + buttons.length) % buttons.length]?.focus();
		} else if (e.key === "Escape" || e.key === "Tab") {
			e.preventDefault();
			e.stopPropagation();
			onClose();
		}
		// Keep editor shortcuts (arrows, Supr…) from acting while the menu is open.
		e.stopPropagation();
	};

	return (
		<div
			ref={ref}
			role="menu"
			aria-label="Acciones"
			tabIndex={-1}
			onKeyDown={onKeyDown}
			onContextMenu={(e) => e.preventDefault()}
			style={{ left: pos.left, top: pos.top }}
			className="bg-df-surface dark:bg-df-surface-dark border-df-hairline dark:border-df-hairline-dark fixed z-50 min-w-52 rounded-2xl border p-1.5 shadow-[0_12px_32px_-12px_rgb(17_24_39/0.4)] dark:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)]"
		>
			{entries.map((entry) => (
				<div key={entry.label}>
					{entry.separated && (
						<div
							className="bg-df-hairline dark:bg-df-hairline-dark mx-2 my-1 h-px"
							role="separator"
						/>
					)}
					<button
						type="button"
						role="menuitem"
						disabled={entry.disabled}
						onClick={() => {
							entry.onSelect();
							onClose();
						}}
						className={[
							"focus-visible:bg-df-well dark:focus-visible:bg-df-well-dark hover:bg-df-well dark:hover:bg-df-well-dark flex w-full items-center justify-between gap-6 rounded-xl px-3 py-1.5 text-left text-sm outline-none disabled:opacity-40 disabled:hover:bg-transparent",
							entry.danger ? "text-red-600 dark:text-red-400" : "text-df-ink dark:text-df-ink-dark",
						].join(" ")}
					>
						{entry.label}
						{entry.hint && (
							<span className="text-df-muted dark:text-df-muted-dark text-xs">{entry.hint}</span>
						)}
					</button>
				</div>
			))}
		</div>
	);
}
