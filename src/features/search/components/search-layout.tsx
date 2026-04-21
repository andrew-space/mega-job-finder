"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ContractType } from "@/lib/job-types";
import { useJobs } from "@/features/search/hooks/use-jobs";
import { JobCard } from "@/features/search/components/job-card";

// Load Leaflet map only on client side to avoid SSR issues
const MapView = dynamic(
  () => import("@/features/search/components/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" /> }
);

const CONTRACT_TYPES: ContractType[] = [
  "CDI",
  "CDD",
  "Alternance",
  "Stage",
  "Freelance",
  "Interim",
];

export function SearchLayout() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [contractType, setContractType] = useState<string>("");
  const [liveMode, setLiveMode] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setDebouncedCity(city);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, city]);

  const { data, isLoading, error, isFetching } = useJobs({
    q: debouncedQuery || undefined,
    city: debouncedCity || undefined,
    live: liveMode,
    contractType: contractType || undefined,
  });

  const jobs = data?.data ?? [];
  const mode = data?.meta.mode;

  // Scroll selected job into view in the list
  useEffect(() => {
    if (!selectedJobId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-job-id="${selectedJobId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedJobId]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* ── Top Search Bar ── */}
      <header className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-sm font-bold tracking-tight text-blue-700"
          >
            JobRadar
          </Link>

          <div className="flex flex-1 items-center gap-2">
            {/* Keyword */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Poste, entreprise, compétence…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* City */}
            <div className="relative w-44">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
              <input
                type="text"
                placeholder="Ville…"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Contract filter */}
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Tous contrats</option>
              {CONTRACT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Live / Mock toggle */}
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setLiveMode(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                !liveMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mock
            </button>
            <button
              onClick={() => setLiveMode(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                liveMode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Live
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-1.5">
          {isFetching && (
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          )}
          <span className="text-xs text-slate-500">
            {isLoading
              ? "Chargement…"
              : error
              ? "Erreur de chargement"
              : `${jobs.length} offre${jobs.length !== 1 ? "s" : ""}`}
          </span>
          {mode && (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                mode === "live"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {mode === "live" ? "France Travail live" : "Données mock"}
            </span>
          )}
        </div>
      </header>

      {/* ── Main Split Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Job List */}
        <div
          ref={listRef}
          className="w-full overflow-y-auto border-r border-slate-200 bg-white p-4 md:w-[400px] lg:w-[440px]"
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Impossible de charger les offres.</p>
              <p className="mt-1 text-xs opacity-75">
                Vérifiez votre connexion ou basculez en mode Mock.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-3xl">🔍</div>
              <p className="text-sm font-medium text-slate-700">
                Aucune offre trouvée
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Essayez d&apos;autres mots-clés ou une autre ville
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} data-job-id={job.id}>
                  <JobCard
                    job={job}
                    isActive={selectedJobId === job.id}
                    onMouseEnter={() => setSelectedJobId(job.id)}
                    onMouseLeave={() => setSelectedJobId(null)}
                    onClick={() => setSelectedJobId(job.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="hidden flex-1 md:block">
          <MapView
            jobs={jobs}
            selectedJobId={selectedJobId}
            onJobSelect={setSelectedJobId}
          />
        </div>
      </div>
    </div>
  );
}
