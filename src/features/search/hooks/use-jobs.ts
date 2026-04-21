"use client";

import { useQuery } from "@tanstack/react-query";
import type { JobOffer } from "@/lib/job-types";

export interface JobSearchParams {
  q?: string;
  city?: string;
  live?: boolean;
  contractType?: string;
}

export interface JobsResponse {
  data: JobOffer[];
  meta: {
    total: number;
    mode: "mock" | "live-db" | "live-fallback-mock";
    sourceCoverage: string[];
  };
}

async function fetchJobs(params: JobSearchParams): Promise<JobsResponse> {
  const url = new URLSearchParams();
  if (params.q) url.set("q", params.q);
  if (params.city) url.set("city", params.city);
  if (params.live) url.set("live", "1");
  if (params.contractType) url.set("contractType", params.contractType);

  const res = await fetch(`/api/jobs?${url.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger les offres.");
  return res.json();
}

export function useJobs(params: JobSearchParams) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => fetchJobs(params),
  });
}
