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

const FT_TIMEOUT_MS = 20000;

function parseMaxResults(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 100;
  return Math.max(1, Math.min(200, Math.floor(value)));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`France Travail timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
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
    const liveOffers = await withTimeout(
      fetchJobsFromFranceTravail(
        { q, city, contractTypes },
        { maxResults }
      ),
      FT_TIMEOUT_MS
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

    const message = error instanceof Error ? error.message : "Unknown error";
    const looksLikeMissingDbUrl = message.includes("Environment variable not found: DATABASE_URL");
    const looksLikeTableMissing = message.includes("relation") && message.includes("does not exist");

    const debug = {
      type: error instanceof Error ? error.name : "UnknownError",
      code: looksLikeMissingDbUrl
        ? "DB_ENV_MISSING"
        : looksLikeTableMissing
        ? "DB_SCHEMA_MISSING"
        : "REFRESH_FAILED",
      hint: looksLikeMissingDbUrl
        ? "DATABASE_URL not visible at runtime in this deployment"
        : looksLikeTableMissing
        ? "Prisma schema not applied in target database"
        : "Check server logs for collector or database errors",
    };

    return NextResponse.json(
      {
        ok: false,
        error: "Refresh failed",
        debug,
      },
      { status: 500 }
    );
  }
}
