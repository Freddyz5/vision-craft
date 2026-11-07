import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import type { ToastAction, ToastTone } from "../hooks/useToast";

interface ToastProps {
	message: string | null;
	action?: ToastAction;
	tone?: ToastTone;
	/** Called after the action runs, to close the toast. */
	onDismiss?: () => void;
	/**
	 * "end" (bottom right) by default; "center" for a screen whose right
	 * column holds its main action, so the toast never covers it.
	 */
	placement?: "end" | "center";
	/** Extra positioning, e.g. to clear a bottom bar. */
	className?: string;
}

// One ink surface for every toast; the tone lives in the icon, so the text
// always reads at full contrast.
const TONES: Record<ToastTone, { icon: string; Icon: typeof CircleCheck; spin?: boolean }> = {
	success: { icon: "text-df-accent-dark", Icon: CircleCheck },
	progress: { icon: "text-white/80 dark:text-df-ink-dark/80", Icon: Loader2, spin: true },
	error: { icon: "text-red-400", Icon: CircleAlert },
};

export function Toast({
	message,
	action,
	tone = "success",
	onDismiss,
	placement = "end",
	className = "",
}: ToastProps) {
	const { icon, Icon, spin } = TONES[tone];
	// The live region stays mounted so screen readers announce each new message.
	return (
		<div
			role="status"
			aria-live="polite"
			className={`toast toast-bottom pointer-events-none z-50 ${placement === "center" ? "toast-center" : "toast-end"} ${className}`}
		>
			{message && (
				<div className="bg-df-ink dark:bg-df-surface-dark dark:border-df-hairline-dark dark:text-df-ink-dark pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgb(17_24_39/0.5)] dark:border">
					<Icon
						className={`h-5 w-5 shrink-0 ${icon} ${spin ? "animate-spin" : ""}`}
						aria-hidden="true"
					/>
					<span>{message}</span>
					{action && (
						<button
							type="button"
							onClick={() => {
								action.onClick();
								onDismiss?.();
							}}
							className="text-df-primary-dark ml-1 shrink-0 rounded-full px-2 py-0.5 font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
						>
							{action.label}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
