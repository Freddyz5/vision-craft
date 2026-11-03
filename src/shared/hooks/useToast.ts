import { useCallback, useRef, useState } from "react";

export interface ToastAction {
	label: string;
	onClick: () => void;
}

/** success: done; progress: still working (e.g. uploading); error: it failed. */
export type ToastTone = "success" | "progress" | "error";

export interface ToastOptions {
	action?: ToastAction;
	tone?: ToastTone;
	/** Overrides the hook's default; a toast with an action stays twice as long. */
	durationMs?: number;
}

export interface ToastState {
	message: string;
	action?: ToastAction;
	tone: ToastTone;
}

/** Ephemeral single-message toast, auto-dismissed after `durationMs`. */
export function useToast(durationMs = 3000) {
	const [toast, setToast] = useState<ToastState | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = useCallback(
		(message: string, options: ToastOptions = {}) => {
			const { action, tone = "success" } = options;
			// A new toast restarts the countdown instead of being cut short by the previous one.
			if (timerRef.current) clearTimeout(timerRef.current);
			setToast({ message, action, tone });
			timerRef.current = setTimeout(
				() => setToast(null),
				options.durationMs ?? (action ? durationMs * 2 : durationMs),
			);
		},
		[durationMs],
	);

	const dismissToast = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setToast(null);
	}, []);

	return { toast, toastMessage: toast?.message ?? null, showToast, dismissToast };
}
