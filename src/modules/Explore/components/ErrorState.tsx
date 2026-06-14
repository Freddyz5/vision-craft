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
			className="flex flex-col items-center justify-center h-80 gap-6 px-6"
			role="alert"
			aria-live="assertive">
			{/* Error Icon */}
			<div
				className="p-4 rounded-full bg-df-surface dark:bg-df-surface-dark/70 border border-df-border dark:border-df-border-dark"
				aria-hidden="true">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					className="lucide lucide-circle-alert-icon lucide-circle-alert w-10 h-10 text-df-primary dark:text-df-primary-dark">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" x2="12" y1="8" y2="12" />
					<line x1="12" x2="12.01" y1="16" y2="16" />
				</svg>
			</div>

			{/* Error Message */}
			<header className="text-center">
				<h2 className="text-xl font-semibold text-df-ink dark:text-df-ink-dark mb-2">
					Algo salió mal
				</h2>
				<p className="text-sm text-df-muted dark:text-df-muted-dark max-w-xs">
					{error}
				</p>
			</header>

			{/* Retry Button */}
			{onRetry && (
				<button
					onClick={onRetry}
					className="px-6 py-2.5 text-sm font-medium rounded-lg
            bg-df-primary dark:bg-df-primary-dark
            text-white
            hover:opacity-90 dark:hover:opacity-80
            transition-opacity duration-200
            flex items-center gap-2 cursor-pointer"
					aria-label="Reintentar cargar imágenes">
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Reintentar
				</button>
			)}
		</section>
	);
}
