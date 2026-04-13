import { Link } from "@/lib/i18n/routing";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <span className="material-symbols-outlined text-3xl">search_off</span>
        </div>
        <h1 className="text-5xl font-black text-primary mb-2">404</h1>
        <p className="text-lg font-semibold text-on-surface mb-1">
          Page introuvable
        </p>
        <p className="text-on-surface-variant mb-6">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
