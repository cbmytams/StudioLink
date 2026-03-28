interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = "Une erreur est survenue",
  message,
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/12">
        <span className="text-xl text-red-300">!</span>
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-white/65">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] rounded-xl border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
