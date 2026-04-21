import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navigation ── */}
      <nav className="flex h-14 items-center justify-between px-6 border-b border-slate-100">
        <span className="text-sm font-bold tracking-tight text-blue-700">
          JobRadar
        </span>
        <Link
          href="/search"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Commencer →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-600">
          Recherche d&apos;emploi en France
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Explorez les opportunités,{" "}
          <span className="text-blue-600">directement sur la carte.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
          Une façon plus visuelle et plus claire de découvrir votre prochain
          emploi en France. Recherche géographique, fiches lisibles, sans bruit.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all hover:shadow-blue-600/40"
          >
            Commencer à explorer →
          </Link>
          <span className="text-sm text-slate-400">
            Données France Travail · Gratuit · Sans inscription
          </span>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-2xl">🗺️</div>
            <h3 className="mb-1.5 font-semibold text-slate-900">Carte interactive</h3>
            <p className="text-sm text-slate-500">
              Visualisez où se trouvent les opportunités. Cliquez sur un marqueur
              pour voir l&apos;offre, sans perdre le contexte géographique.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-2xl">📍</div>
            <h3 className="mb-1.5 font-semibold text-slate-900">Recherche locale</h3>
            <p className="text-sm text-slate-500">
              Cherchez par ville, explorez les alentours. Comprenez où sont
              concentrées les offres dans votre région.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 text-2xl">📋</div>
            <h3 className="mb-1.5 font-semibold text-slate-900">Fiches claires</h3>
            <p className="text-sm text-slate-500">
              Pas de bruit, pas de surcharge. Chaque offre est présentée de façon
              lisible, avec les informations qui comptent vraiment.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        JobRadar · Données issues de France Travail · MVP 2026
      </footer>
    </div>
  );
}
