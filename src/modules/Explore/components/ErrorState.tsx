import { CircleAlert, RefreshCw } from "lucide-react";

interface ErrorStateProps {
	error?: string;
	onRetry?: () => void;
}

export default function ErrorState({
	error = "Error cargando imágenes",
	onRetry,
}: ErrorStateProps) {
	return (
		<section
			className="flex h-80 flex-col items-center justify-center gap-6 px-6"
			role="alert"
			aria-live="assertive"
		>
			{/* Error Icon */}
			<div
				className="bg-df-surface dark:bg-df-surface-dark/70 border-df-border dark:border-df-border-dark rounded-full border p-4"
				aria-hidden="true"
			>
				<CircleAlert className="text-df-primary dark:text-df-primary-dark h-10 w-10" />
			</div>

			{/* Error Message */}
			<header className="text-center">
				<h2 className="text-df-ink dark:text-df-ink-dark mb-2 text-xl font-semibold">
					Algo salió mal
				</h2>
				<p className="text-df-muted dark:text-df-muted-dark max-w-xs text-sm">{error}</p>
			</header>

			{/* Retry Button */}
			{onRetry && (
				<button
					onClick={onRetry}
					className="bg-df-primary dark:bg-df-primary-dark flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 dark:hover:opacity-80"
					aria-label="Reintentar cargar imágenes"
				>
					<RefreshCw className="h-4 w-4" aria-hidden="true" />
					Reintentar
				</button>
			)}
		</section>
	);
}
