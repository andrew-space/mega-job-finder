import Link from "next/link";
import { mockJobs } from "@/lib/mock-jobs";
import { prisma } from "@/server/db";

async function getLiveInsights(): Promise<{
  topSkills: [string, number][];
  remotePercent: number;
  totalJobs: number;
  isLive: boolean;
} | null> {
  try {
    const jobs = await prisma.jobOffer.findMany({
      select: { skills: true, remoteType: true },
    });
    if (jobs.length === 0) return null;

    const skillCounts: Record<string, number> = {};
    for (const job of jobs) {
      const skills = job.skills as string[] | null;
      if (Array.isArray(skills)) {
        for (const skill of skills) {
          skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
        }
      }
    }
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const remoteFriendly = jobs.filter((j) => j.remoteType !== "none").length;
    const remotePercent = Math.round((remoteFriendly / jobs.length) * 100);

    return { topSkills, remotePercent, totalJobs: jobs.length, isLive: true };
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

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

function getMockInsights() {
  const topSkills = Object.entries(
    mockJobs.reduce<Record<string, number>>((acc, job) => {
      for (const skill of job.skills) {
        acc[skill] = (acc[skill] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const remoteFriendlyJobs = mockJobs.filter((job) => job.remote !== "none").length;
  const remotePercent = Math.round((remoteFriendlyJobs / mockJobs.length) * 100);
  return { topSkills, remotePercent, totalJobs: mockJobs.length, isLive: false };
}

export default async function ProfilePage() {
  const liveInsights = await getLiveInsights();
  const insights = liveInsights ?? getMockInsights();
  const { topSkills, remotePercent, totalJobs, isLive } = insights;

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
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Stage 5</p>
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

        <section className="mt-10 rounded-xl border border-slate-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Insights marché
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                isLive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isLive ? `live · ${totalJobs} offres` : "mock"}
            </span>
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {remotePercent}% des offres supportent au moins du télétravail partiel.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {topSkills.map(([skill, count]) => (
              <span
                key={skill}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {skill} · {count}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}