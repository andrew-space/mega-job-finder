import Link from "next/link";

export const metadata = {
  title: "Profil & CV · JobRadar",
  description:
    "Évaluez votre préparation candidature et améliorez votre CV avec une checklist simple et actionable.",
};

const readinessChecks = [
  {
    title: "Titre CV ciblé",
    description: "Un intitulé précis aligné avec le poste recherché.",
    done: true,
  },
  {
    title: "Compétences clés",
    description: "Au moins 8 compétences techniques ou métier directement utiles.",
    done: false,
  },
  {
    title: "Impact mesuré",
    description: "Des résultats chiffrés sur les expériences récentes.",
    done: true,
  },
  {
    title: "Version ATS",
    description: "Un format lisible sans colonnes complexes pour les ATS.",
    done: false,
  },
  {
    title: "Profil LinkedIn aligné",
    description: "Même proposition de valeur sur CV et profil public.",
    done: true,
  },
];

const doneCount = readinessChecks.filter((item) => item.done).length;
const readinessPercent = Math.round((doneCount / readinessChecks.length) * 100);

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex h-14 items-center justify-between border-b border-slate-100 px-6">
        <Link href="/" className="text-sm font-bold text-slate-900">
          JobRadar
        </Link>
        <Link
          href="/search"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Retour aux offres
        </Link>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Stage 2</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Profil candidature
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          Une vue rapide pour prioriser les améliorations qui augmentent vos chances de réponse,
          sans surcharger votre workflow.
        </p>

        <section className="mt-10 rounded-xl border border-slate-200 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Readiness score
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{readinessPercent}%</p>
            </div>
            <p className="text-sm text-slate-500">
              {doneCount}/{readinessChecks.length} checkpoints validés
            </p>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${readinessPercent}%` }} />
          </div>
        </section>

        <section className="mt-8 grid gap-3">
          {readinessChecks.map((item) => (
            <article
              key={item.title}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.done ? "OK" : "À faire"}
              </span>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}