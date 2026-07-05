import { CircleCheck } from "lucide-react";

interface ToastProps {
	message: string | null;
}

export function Toast({ message }: ToastProps) {
	if (!message) return null;

	return (
		<div className="toast toast-end toast-bottom z-50">
			<div className="alert alert-success flex items-center gap-2 font-semibold text-white shadow-lg">
				<CircleCheck className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
				<span>{message}</span>
			</div>
		</div>
	);
}
