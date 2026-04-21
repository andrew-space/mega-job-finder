"use client";

import type { JobOffer } from "@/lib/job-types";
import { clsx } from "clsx";

const CONTRACT_COLOR: Record<string, { dot: string; text: string }> = {
  CDI:        { dot: "bg-emerald-500", text: "text-emerald-700" },
  CDD:        { dot: "bg-amber-500",   text: "text-amber-700" },
  Alternance: { dot: "bg-blue-500",    text: "text-blue-700" },
  Stage:      { dot: "bg-violet-500",  text: "text-violet-700" },
  Freelance:  { dot: "bg-orange-500",  text: "text-orange-700" },
  Interim:    { dot: "bg-slate-400",   text: "text-slate-500" },
};

function formatSalary(salary: JobOffer["salary"]): string | null {
  if (!salary) return null;
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k€` : `${n}€`);
  const { min, max, period } = salary;
  const label = period === "month" ? "/mois" : "/an";
  if (min && max) return `${fmt(min)} – ${fmt(max)}${label}`;
  if (min) return `dès ${fmt(min)}${label}`;
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}mois`;
}

interface JobCardProps {
  job: JobOffer;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function JobCard({ job, isActive, onMouseEnter, onMouseLeave, onClick }: JobCardProps) {
  const salary = formatSalary(job.salary);
  const colors = CONTRACT_COLOR[job.contractType] ?? { dot: "bg-slate-400", text: "text-slate-500" };

  return (
    <article
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={clsx(
        "group cursor-pointer border-b border-slate-100 bg-white px-4 py-3.5 transition-colors",
        isActive ? "bg-blue-50/60" : "hover:bg-slate-50"
      )}
    >
      {/* Title + date */}
      <div className="mb-0.5 flex items-start justify-between gap-2">
        <h3 className={clsx(
          "flex-1 text-[13px] font-semibold leading-snug line-clamp-2",
          isActive ? "text-blue-800" : "text-slate-900 group-hover:text-blue-700"
        )}>
          {job.title}
        </h3>
        <span className="shrink-0 text-[11px] text-slate-400 mt-0.5">{timeAgo(job.publishedAt)}</span>
      </div>

      {/* Company */}
      <p className="mb-2 text-[12px] text-slate-500">{job.company}</p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* Contract badge */}
        <span className={clsx("flex items-center gap-1 text-[11px] font-semibold", colors.text)}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", colors.dot)} />
          {job.contractType}
        </span>

        {/* Location */}
        <span className="text-[11px] text-slate-400">{job.location.city}</span>

        {/* Remote */}
        {job.remote !== "none" && (
          <span className="text-[11px] font-medium text-blue-600">
            {job.remote === "full" ? "Remote" : "Hybride"}
          </span>
        )}

        {/* Salary */}
        {salary && (
          <span className="text-[11px] font-medium text-slate-700">{salary}</span>
        )}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}


