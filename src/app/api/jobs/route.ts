import { NextResponse } from "next/server";
import { fetchJobsFromFranceTravail } from "@/server/collectors/france-travail";
import { markDuplicates } from "@/lib/dedup";
import type { JobOffer, ContractType } from "@/lib/job-types";
import { mockJobs } from "@/lib/mock-jobs";

// Module-level cache so /api/jobs/[id] can serve live offers fetched here
export const jobCache = new Map<string, JobOffer>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const city = searchParams.get("city")?.trim() || undefined;
  const live = searchParams.get("live") === "1";
  const contractType = (searchParams.get("contractType")?.trim() || undefined) as
    | ContractType
    | undefined;

  let offers: JobOffer[] = [];
  let mode: "mock" | "live" | "mixed" = "mock";

  if (live) {
    try {
      offers = await fetchJobsFromFranceTravail(
        { q, city, contractTypes: contractType ? [contractType] : undefined },
        { maxResults: 50 }
      );
      // Populate cache for detail page lookups
      offers.forEach((job) => jobCache.set(job.id, job));
      mode = "live";
    } catch (err) {
      console.error("France Travail fetch failed, falling back to mock:", err);
      offers = [...mockJobs];
      mode = "mock";
    }
  } else {
    offers = [...mockJobs];
    mode = "mock";
  }

  // Client-side filter for mock mode
  if (mode === "mock") {
    const qLow = q?.toLowerCase();
    const cityLow = city?.toLowerCase();
    offers = offers.filter((job) => {
      const text = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      if (qLow && !text.includes(qLow)) return false;
      if (cityLow && !job.location.city.toLowerCase().includes(cityLow)) return false;
      if (contractType && job.contractType !== contractType) return false;
      return true;
    });
  }

  const deduped = markDuplicates(offers).filter((j) => !j.isDuplicate);

  return NextResponse.json({
    data: deduped,
    meta: {
      total: deduped.length,
      sourceCoverage: [...new Set(deduped.map((j) => j.source))],
      mode,
    },
  });
}
