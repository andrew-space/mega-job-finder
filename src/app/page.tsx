import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="flex h-14 items-center justify-between border-b border-slate-100 px-6">
        <span className="text-sm font-bold text-slate-900">JobRadar</span>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Profil
          </Link>
          <Link
            href="/search"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Rechercher
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Emploi en France
        </p>
        <h1 className="mx-auto max-w-2xl text-center text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Une carte pour trouver<br />votre prochain poste.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-center text-base text-slate-500">
          Visualisez les offres autour de vous. Filtrez, comparez, postulez —
          sans surcharge d&apos;information.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-block rounded-md bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Explorer les offres
          </Link>
          <Link
            href="/profile"
            className="inline-block rounded-md border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Préparer mon profil
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Données France Travail · Gratuit · Sans inscription
        </p>
      </main>

      {/* Features */}
      <section className="border-t border-slate-100 px-6 py-16">
        <div className="mx-auto grid max-w-3xl gap-px border border-slate-100 sm:grid-cols-3">
          <div className="bg-white px-6 py-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">01</p>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Carte interactive</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Cherchez par zone géographique. Voyez en un coup d&apos;œil où se concentrent les opportunités.
            </p>
          </div>
          <div className="bg-white px-6 py-8 border-t border-slate-100 sm:border-t-0 sm:border-l">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">02</p>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Fiches lisibles</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Contrat, salaire, télétravail : l’essentiel visible d’un coup d’œil, sans bruit.
            </p>
          </div>
          <div className="bg-white px-6 py-8 border-t border-slate-100 sm:border-t-0 sm:border-l">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">03</p>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Données live</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Offres directement issues de France Travail, actualisées en temps réel.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-5 text-center text-xs text-slate-400">
        JobRadar · MVP 2026
      </footer>
    </div>
  );
}
