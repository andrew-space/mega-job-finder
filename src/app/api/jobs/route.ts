import { NextResponse } from "next/server";
import { franceTravailCollector } from "@/collectors/france-travail";
import { markDuplicates } from "@/lib/dedup";
import type { JobOffer } from "@/lib/job-types";
import { mockJobs } from "@/lib/mock-jobs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim();
  const city = searchParams.get("city")?.toLowerCase().trim();
  const wantsLive = searchParams.get("live") === "1";

  let offers: JobOffer[] = [...mockJobs];
  let mode: "mock" | "mixed" | "live" = "mock";

  if (wantsLive) {
    try {
      const raw = await franceTravailCollector.fetchOffers({ q, city });
      const normalized = raw.map((item) => franceTravailCollector.normalizeOffer(item));
      if (normalized.length > 0) {
        offers = normalized;
        mode = "live";
      }
    } catch {
      mode = "mock";
    }
  }

  const deduped = markDuplicates(offers);
  const filtered = deduped.filter((job) => {
    const text = `${job.title} ${job.company} ${job.description}`.toLowerCase();
    const qMatch = !q || text.includes(q);
    const cityMatch = !city || job.location.city.toLowerCase().includes(city);
    return qMatch && cityMatch;
  });

  return NextResponse.json({
    data: filtered,
    meta: {
      total: filtered.length,
      sourceCoverage: [...new Set(filtered.map((item) => item.source))],
      mode,
    },
  });
}
