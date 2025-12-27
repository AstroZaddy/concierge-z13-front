/**
 * Reusable loading state component
 */
export function LoadingState({ message = "Loading...", className = "" }) {
  return (
    <section className={`min-h-screen px-4 pt-28 pb-20 ${className}`}>
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-gray-400">{message}</p>
      </div>
    </section>
  );
}

