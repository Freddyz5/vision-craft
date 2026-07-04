import { useCallback, useState } from "react";

/** Ephemeral single-message toast, auto-dismissed after `durationMs`. */
export function useToast(durationMs = 3000) {
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = useCallback(
		(message: string) => {
			setToastMessage(message);
			setTimeout(() => setToastMessage(null), durationMs);
		},
		[durationMs],
	);

	return { toastMessage, showToast };
}
