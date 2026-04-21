import { NextResponse } from "next/server";
import { fetchJobsFromFranceTravail } from "@/server/collectors/france-travail";
import { markDuplicates } from "@/lib/dedup";
import type { JobOffer, ContractType } from "@/lib/job-types";
import { mockJobs } from "@/lib/mock-jobs";
import { getJobsFromDb, upsertJobs } from "@/server/jobs-store";

// Module-level cache so /api/jobs/[id] can serve live offers fetched here
export const jobCache = new Map<string, JobOffer>();

const FT_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`France Travail timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const city = searchParams.get("city")?.trim() || undefined;
  const live = searchParams.get("live") === "1";
  const contractType = (searchParams.get("contractType")?.trim() || undefined) as
    | ContractType
    | undefined;

  let offers: JobOffer[] = [];
  let mode: "mock" | "live-db" | "live-fallback-mock" = "mock";

  if (live) {
    try {
      const liveOffers = await withTimeout(
        fetchJobsFromFranceTravail(
          { q, city, contractTypes: contractType ? [contractType] : undefined },
          { maxResults: 50 }
        ),
        FT_TIMEOUT_MS
      );

      // Populate cache for detail page lookups
      liveOffers.forEach((job) => jobCache.set(job.id, job));

      // Persist live offers to DB and serve from DB for stable behavior across restarts
      await upsertJobs(liveOffers);
      offers = await getJobsFromDb({ q, city, contractType, limit: 50 });
      mode = "live-db";
    } catch (err) {
      console.error("Live flow failed, trying DB first then mock fallback:", err);

      try {
        offers = await getJobsFromDb({ q, city, contractType, limit: 50 });
        if (offers.length > 0) {
          mode = "live-db";
        } else {
          offers = [...mockJobs];
          mode = "live-fallback-mock";
        }
      } catch (dbErr) {
        console.error("DB query failed, falling back to mock:", dbErr);
        offers = [...mockJobs];
        mode = "live-fallback-mock";
      }
    }
  } else {
    offers = [...mockJobs];
    mode = "mock";
  }

  // Client-side filter for mock modes
  if (mode === "mock" || mode === "live-fallback-mock") {
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
