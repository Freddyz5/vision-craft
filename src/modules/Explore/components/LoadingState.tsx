interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export default function LoadingState({
  message = "Cargando inspiración...",
  fullHeight = true,
}: LoadingStateProps) {
  return (
    <section 
      className={`flex flex-col justify-center items-center gap-4 ${fullHeight ? "h-80" : "h-40"}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido"
    >
      {/* Animated Spinner */}
      <div className="relative w-10 h-10" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-df-border dark:border-df-border-dark"></div>
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-df-primary dark:border-t-df-primary-dark
            animate-spin"
        ></div>
      </div>

      {/* Loading Text */}
      <p className="text-df-muted dark:text-df-muted-dark text-sm animate-pulse">
        {message}
      </p>
    </section>
  );
}
