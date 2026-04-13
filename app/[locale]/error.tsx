"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 text-error mb-6">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-on-surface-variant mb-6">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          Réessayer
        </button>
      </div>
    </div>
  );
}
