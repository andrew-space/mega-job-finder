"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContractType, JobOffer, RemoteMode } from "@/lib/job-types";

interface JobsExplorerProps {
  jobs: JobOffer[];
}

const contractAccent: Record<ContractType, string> = {
  CDI: "#16A34A",
  CDD: "#EA580C",
  Alternance: "#7C3AED",
  Stage: "#2563EB",
  Freelance: "#4F46E5",
  Interim: "#DC2626",
};

export function JobsExplorer({ jobs }: JobsExplorerProps) {
  const [sourceMode, setSourceMode] = useState<"mock" | "live">("mock");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState<RemoteMode | "all">("all");
  const [apiJobs, setApiJobs] = useState<JobOffer[]>(jobs);
  const [apiMode, setApiMode] = useState<"mock" | "mixed" | "live">("mock");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(jobs[0]?.id ?? null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setApiError(null);

      try {
        const params = new URLSearchParams();
        params.set("live", sourceMode === "live" ? "1" : "0");
        if (query.trim()) params.set("q", query.trim());
        if (city.trim()) params.set("city", city.trim());

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const payload = (await response.json()) as {
          data?: JobOffer[];
          meta?: { mode?: "mock" | "mixed" | "live" };
        };

        const nextJobs = payload.data ?? [];
        setApiJobs(nextJobs);
        setApiMode(payload.meta?.mode ?? "mock");
        setActiveId((current) => {
          if (current && nextJobs.some((job) => job.id === current)) return current;
          return nextJobs[0]?.id ?? null;
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setApiError(error instanceof Error ? error.message : "Erreur API inattendue");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [sourceMode, query, city]);

  const filtered = useMemo(() => {
    return apiJobs.filter((job) => {
      const fullText = `${job.title} ${job.company} ${job.skills.join(" ")}`.toLowerCase();
      const qMatch = query.length === 0 || fullText.includes(query.toLowerCase());
      const cityMatch = city.length === 0 || job.location.city.toLowerCase().includes(city.toLowerCase());
      const remoteMatch = remote === "all" || remote === job.remote;
      return qMatch && cityMatch && remoteMatch && !job.isDuplicate;
    });
  }, [apiJobs, city, query, remote]);

  return (
    <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 gap-4 lg:grid-cols-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
                <button
                  type="button"
                  className={`rounded-md px-2 py-1 ${sourceMode === "mock" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                  onClick={() => setSourceMode("mock")}
                >
                  Mode mock
                </button>
                <button
                  type="button"
                  className={`rounded-md px-2 py-1 ${sourceMode === "live" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                  onClick={() => setSourceMode("live")}
                >
                  Mode live
                </button>
              </div>
              <span className="text-xs text-slate-500">API: {apiMode}</span>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Poste, entreprise, competences"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ville"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <select
                value={remote}
                onChange={(event) => setRemote(event.target.value as RemoteMode | "all")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Teletravail: tous</option>
                <option value="none">Sur site</option>
                <option value="partial">Hybride</option>
                <option value="full">Full remote</option>
              </select>
            </div>
            {loading ? <p className="text-xs text-slate-500">Chargement des offres...</p> : null}
            {apiError ? <p className="text-xs text-red-600">Erreur API: {apiError}</p> : null}
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-260px)]">
          {filtered.map((job) => {
            const active = activeId === job.id;
            return (
              <article
                key={job.id}
                onMouseEnter={() => setActiveId(job.id)}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  active ? "border-blue-400 bg-blue-50/40" : "border-slate-200 bg-white"
                }`}
                style={{ borderLeft: `6px solid ${contractAccent[job.contractType]}` }}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {job.source} • {job.contractType}
                </p>
                <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                <p className="text-sm text-slate-600">{job.company}</p>
                <p className="text-xs text-slate-500">
                  {job.location.city} • {job.remote === "full" ? "Remote" : job.remote === "partial" ? "Hybride" : "Sur site"}
                </p>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Aucune offre avec ces filtres.
            </p>
          ) : null}
        </div>
      </section>

      <section className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 lg:col-span-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Carte interactive (mode demo)</h2>
          <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600">
            {filtered.length} offres visibles
          </span>
        </div>

        <div className="relative h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.16),transparent_40%),radial-gradient(circle_at_75%_70%,rgba(22,163,74,0.16),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(241,245,249,0.9))]" />

          {filtered.map((job) => {
            const isActive = job.id === activeId;
            const left = `${((job.location.coords.lng + 5) / 12) * 100}%`;
            const top = `${100 - ((job.location.coords.lat - 41) / 10) * 100}%`;

            return (
              <button
                key={job.id}
                onMouseEnter={() => setActiveId(job.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-xs shadow ${
                  isActive
                    ? "z-10 border-blue-700 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                style={{ left, top }}
                type="button"
              >
                {job.location.city}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
