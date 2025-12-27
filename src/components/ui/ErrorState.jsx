/**
 * Reusable error state component
 */
export function ErrorState({ 
  error, 
  actionLabel = null, 
  actionHref = null, 
  onAction = null,
  className = "" 
}) {
  return (
    <section className={`min-h-screen px-4 pt-28 pb-20 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="p-8 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300 text-center">
          <p className="font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
          {actionLabel && (
            actionHref ? (
              <a
                href={actionHref}
                className="mt-4 inline-block px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
              >
                {actionLabel}
              </a>
            ) : onAction ? (
              <button
                onClick={onAction}
                className="mt-4 px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
              >
                {actionLabel}
              </button>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

