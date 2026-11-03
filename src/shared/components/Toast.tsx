import { CircleCheck } from "lucide-react";
import type { ToastAction } from "../hooks/useToast";

interface ToastProps {
	message: string | null;
	action?: ToastAction;
	/** Called after the action runs, to close the toast. */
	onDismiss?: () => void;
}

export function Toast({ message, action, onDismiss }: ToastProps) {
	// The live region stays mounted so screen readers announce each new message.
	return (
		<div
			role="status"
			aria-live="polite"
			className="toast toast-end toast-bottom pointer-events-none z-50"
		>
			{message && (
				<div className="alert alert-success pointer-events-auto flex items-center gap-2 font-semibold text-white shadow-lg">
					<CircleCheck className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
					<span>{message}</span>
					{action && (
						<button
							type="button"
							onClick={() => {
								action.onClick();
								onDismiss?.();
							}}
							className="ml-2 rounded-full px-2 py-0.5 font-bold underline underline-offset-2 hover:bg-white/15"
						>
							{action.label}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
