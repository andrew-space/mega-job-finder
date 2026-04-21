"use client";

import type { JobOffer } from "@/lib/job-types";
import { clsx } from "clsx";

const CONTRACT_BADGE: Record<string, string> = {
  CDI: "bg-emerald-100 text-emerald-800",
  CDD: "bg-amber-100 text-amber-800",
  Alternance: "bg-blue-100 text-blue-800",
  Stage: "bg-violet-100 text-violet-800",
  Freelance: "bg-orange-100 text-orange-800",
  Interim: "bg-slate-100 text-slate-600",
};

const CONTRACT_BORDER: Record<string, string> = {
  CDI: "border-l-emerald-500",
  CDD: "border-l-amber-500",
  Alternance: "border-l-blue-500",
  Stage: "border-l-violet-500",
  Freelance: "border-l-orange-500",
  Interim: "border-l-slate-400",
};

function formatSalary(salary: JobOffer["salary"]): string | null {
  if (!salary) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
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
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`;
  return `Il y a ${Math.floor(days / 30)}mois`;
}

interface JobCardProps {
  job: JobOffer;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function JobCard({
  job,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: JobCardProps) {
  const salary = formatSalary(job.salary);
  const badgeClass = CONTRACT_BADGE[job.contractType] ?? "bg-slate-100 text-slate-600";
  const borderClass = CONTRACT_BORDER[job.contractType] ?? "border-l-slate-400";

  return (
    <article
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={clsx(
        "group relative cursor-pointer rounded-xl border border-l-4 bg-white p-4",
        "transition-all duration-150 hover:shadow-md hover:border-r-slate-300 hover:border-t-slate-300 hover:border-b-slate-300",
        borderClass,
        isActive
          ? "shadow-md border-r-slate-300 border-t-slate-300 border-b-slate-300 ring-2 ring-blue-500/20"
          : "border-r-slate-200 border-t-slate-200 border-b-slate-200"
      )}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
          {job.title}
        </h3>
        <span className="shrink-0 text-xs text-slate-400 mt-0.5">
          {timeAgo(job.publishedAt)}
        </span>
      </div>

      {/* Company */}
      <p className="mb-2.5 text-xs font-medium text-slate-500">{job.company}</p>

      {/* Location */}
      <div className="mb-3 flex items-center gap-1 text-xs text-slate-500">
        <svg
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>{job.location.city}</span>
        {job.remote !== "none" && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-blue-600 font-medium">
              {job.remote === "full" ? "Full remote" : "Hybride"}
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            badgeClass
          )}
        >
          {job.contractType}
        </span>
        {salary && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {salary}
          </span>
        )}
        {job.skills.slice(0, 2).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
          >
            {skill}
          </span>
        ))}
      </div>
    </article>
  );
}
