import type React from "react";
import { ArrowDown, ArrowUp, BringToFront, Layers, Lock, SendToBack } from "lucide-react";
import { ToolPopover } from "./ToolPopover";
import { shortcut } from "../utils/shortcuts";

interface ArrangeMenuProps {
	onMoveLayer: (direction: "up" | "down") => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	onToggleLock: () => void;
	docked?: boolean;
	/** Extra rows below the layer and lock actions (e.g. alignment on desktop). */
	children?: React.ReactNode;
}

/**
 * "Organizar": where the selection sits among the layers, and locking it,
 * in one menu instead of a button each. The panel stays open, so a photo
 * can be moved up or down several layers in a row.
 */
export function ArrangeMenu({
	onMoveLayer,
	onBringToFront,
	onSendToBack,
	onToggleLock,
	docked = false,
	children,
}: ArrangeMenuProps) {
	const hint = (key: string, shift = false) => (docked ? undefined : shortcut(key, { shift }));
	return (
		<ToolPopover
			label="Organizar"
			panelLabel="Organizar"
			docked={docked}
			widthClass="w-64"
			icon={<Layers className="h-4 w-4" aria-hidden="true" />}
		>
			<div className="grid gap-0.5">
				<Row
					icon={ArrowUp}
					label="Subir una capa"
					hint={hint("]")}
					onClick={() => onMoveLayer("up")}
				/>
				<Row
					icon={ArrowDown}
					label="Bajar una capa"
					hint={hint("[")}
					onClick={() => onMoveLayer("down")}
				/>
				<Row
					icon={BringToFront}
					label="Al frente"
					hint={hint("]", true)}
					onClick={onBringToFront}
				/>
				<Row icon={SendToBack} label="Al fondo" hint={hint("[", true)} onClick={onSendToBack} />
			</div>
			<div className="border-df-hairline dark:border-df-hairline-dark border-t pt-2">
				<Row icon={Lock} label="Bloquear" hint={hint("L", true)} onClick={onToggleLock} />
			</div>
			{children}
		</ToolPopover>
	);
}

function Row({
	icon: Icon,
	label,
	hint,
	onClick,
}: {
	icon: typeof ArrowUp;
	label: string;
	hint?: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-semibold focus-visible:outline-2 pointer-coarse:min-h-11"
		>
			<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
			<span className="flex-1">{label}</span>
			{hint && (
				<span className="text-df-muted dark:text-df-muted-dark text-xs font-normal">{hint}</span>
			)}
		</button>
	);
}
