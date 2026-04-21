import { NextResponse } from "next/server";
import { fetchJobsFromFranceTravail } from "@/server/collectors/france-travail";
import { upsertJobs } from "@/server/jobs-store";
import type { ContractType } from "@/lib/job-types";

type RefreshPayload = {
  q?: string;
  city?: string;
  maxResults?: number;
  contractType?: ContractType;
};

function parseMaxResults(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 100;
  return Math.max(1, Math.min(200, Math.floor(value)));
}

export async function POST(request: Request) {
  let payload: RefreshPayload = {};

  try {
    payload = (await request.json()) as RefreshPayload;
  } catch {
    payload = {};
  }

  const q = payload.q?.trim() || undefined;
  const city = payload.city?.trim() || undefined;
  const contractTypes = payload.contractType ? [payload.contractType] : undefined;
  const maxResults = parseMaxResults(payload.maxResults);

  try {
    const liveOffers = await fetchJobsFromFranceTravail(
      { q, city, contractTypes },
      { maxResults }
    );

    const { inserted, updated } = await upsertJobs(liveOffers);

    return NextResponse.json({
      ok: true,
      summary: {
        fetched: liveOffers.length,
        inserted,
        updated,
        skipped: Math.max(0, liveOffers.length - inserted - updated),
      },
      filters: {
        q: q ?? null,
        city: city ?? null,
        contractType: payload.contractType ?? null,
        maxResults,
      },
    });
  } catch (error) {
    console.error("Refresh pipeline failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Refresh failed",
      },
      { status: 500 }
    );
  }
}
