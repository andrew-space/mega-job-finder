import Link from "next/link";
import { notFound } from "next/navigation";
import type { JobOffer } from "@/lib/job-types";
import { mockJobs } from "@/lib/mock-jobs";
import { getRelatedJobsFromDb } from "@/server/jobs-store";

interface Props {
  params: Promise<{ id: string }>;
}

async function getJob(id: string): Promise<JobOffer | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/jobs/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { data?: JobOffer };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function getRelatedJobsFromMock(job: JobOffer, limit = 4): JobOffer[] {
  const refSkills = new Set(job.skills.map((skill) => skill.toLowerCase()));

  return mockJobs
    .filter((candidate) => candidate.id !== job.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.location.city === job.location.city) score += 4;
      if (candidate.contractType === job.contractType) score += 2;
      if (candidate.remote === job.remote) score += 1;
      for (const skill of candidate.skills) {
        if (refSkills.has(skill.toLowerCase())) score += 3;
      }

      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.candidate.publishedAt).getTime() - new Date(a.candidate.publishedAt).getTime();
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

const CONTRACT_BADGE: Record<string, string> = {
  CDI: "bg-emerald-100 text-emerald-800",
  CDD: "bg-amber-100 text-amber-800",
  Alternance: "bg-blue-100 text-blue-800",
  Stage: "bg-violet-100 text-violet-800",
  Freelance: "bg-orange-100 text-orange-800",
  Interim: "bg-slate-100 text-slate-600",
};

const EXPERIENCE_LABEL: Record<string, string> = {
  junior: "Junior",
  mid: "Confirmé",
  senior: "Senior",
  executive: "Executive",
};

const SOURCE_LABEL: Record<string, string> = {
  france_travail: "France Travail",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  wttj: "Welcome to the Jungle",
  hellowork: "HelloWork",
  cadremploi: "Cadremploi",
  apec: "APEC",
  leboncoin: "Leboncoin",
};

function formatSalary(salary: JobOffer["salary"]): string | null {
  if (!salary) return null;
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);
  const { min, max, currency, period } = salary;
  const label = period === "month" ? "/mois" : "/an";
  if (min && max) return `${fmt(min)} – ${fmt(max)} ${currency}${label}`;
  if (min) return `${fmt(min)}+ ${currency}${label}`;
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  let relatedJobs: JobOffer[] = [];
  try {
    relatedJobs = await getRelatedJobsFromDb(job, 4);
  } catch {
    relatedJobs = [];
  }

  if (relatedJobs.length === 0) {
    relatedJobs = getRelatedJobsFromMock(job, 4);
  }

  const salary = formatSalary(job.salary);
  const badgeClass =
    CONTRACT_BADGE[job.contractType] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top nav ── */}
      <nav className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-6">
        <Link
          href="/search"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour aux offres
        </Link>
        <span className="text-slate-300">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-slate-700">
          {job.title}
        </span>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* ── Header ── */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="mb-1 text-2xl font-bold leading-tight text-slate-900">
                {job.title}
              </h1>
              <p className="text-base font-medium text-slate-600">
                {job.company}
              </p>
            </div>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
            >
              Postuler →
            </a>
          </div>

          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {job.contractType}
            </span>
            {salary && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {salary}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {EXPERIENCE_LABEL[job.experienceLevel] ?? job.experienceLevel}
            </span>
            {job.remote !== "none" && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {job.remote === "full" ? "Full remote" : "Hybride"}
              </span>
            )}
          </div>

          {/* Location + date */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0L6.343 16.657a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {job.location.city}
              {job.location.department ? `, ${job.location.department}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Publié {timeAgo(job.publishedAt)}
            </span>
          </div>
        </div>

        {/* ── Skills ── */}
        {job.skills.length > 0 && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Compétences recherchées
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Description du poste
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {job.description}
          </p>
        </div>

        {relatedJobs.length > 0 && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Offres similaires
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Même zone, contrat ou compétences proches.
                </p>
              </div>
              <Link
                href="/search"
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Voir plus
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {relatedJobs.map((relatedJob) => {
                const relatedSalary = formatSalary(relatedJob.salary);

                return (
                  <Link
                    key={relatedJob.id}
                    href={`/jobs/${relatedJob.id}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                          {relatedJob.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{relatedJob.company}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {timeAgo(relatedJob.publishedAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>{relatedJob.location.city}</span>
                      <span>{relatedJob.contractType}</span>
                      {relatedSalary && <span className="font-medium text-slate-700">{relatedSalary}</span>}
                    </div>

                    {relatedJob.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {relatedJob.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Bottom CTA ── */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            Ce poste vous intéresse ?
          </p>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            Postuler maintenant →
          </a>
          <p className="text-xs text-slate-400">
            Vous serez redirigé vers{" "}
            {SOURCE_LABEL[job.source] ?? job.source}
          </p>
        </div>
      </main>
    </div>
  );
}
