import { useCallback, useRef, useState } from "react";

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface ToastState {
	message: string;
	action?: ToastAction;
}

/** Ephemeral single-message toast, auto-dismissed after `durationMs`. */
export function useToast(durationMs = 3000) {
	const [toast, setToast] = useState<ToastState | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = useCallback(
		(message: string, action?: ToastAction) => {
			// A new toast restarts the countdown instead of being cut short by the previous one.
			if (timerRef.current) clearTimeout(timerRef.current);
			setToast({ message, action });
			timerRef.current = setTimeout(() => setToast(null), action ? durationMs * 2 : durationMs);
		},
		[durationMs],
	);

	const dismissToast = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setToast(null);
	}, []);

	return { toast, toastMessage: toast?.message ?? null, showToast, dismissToast };
}
