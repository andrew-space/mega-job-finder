import { prisma } from "@/server/db";
import { fetchJobsFromFranceTravail } from "@/server/collectors/france-travail";
import { fetchJobsFromApec } from "@/server/collectors/apec";
import { upsertJobs } from "@/server/jobs-store";
import type { ContractType, JobOffer } from "@/lib/job-types";

const FT_TIMEOUT_MS = 20000;

export type RefreshPayload = {
  q?: string;
  city?: string;
  maxResults?: number;
  contractType?: ContractType;
};

export type RefreshResult = {
  ok: true;
  summary: {
    fetched: number;
    inserted: number;
    updated: number;
    skipped: number;
  };
  filters: {
    q: string | null;
    city: string | null;
    contractType: ContractType | null;
    maxResults: number;
  };
};

type RefreshErrorDebug = {
  type: string;
  code: "DB_ENV_MISSING" | "DB_SCHEMA_MISSING" | "REFRESH_FAILED";
  hint: string;
};

type RefreshMonitor = {
  lastAttemptAt: string | null;
  lastTrigger: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

const refreshMonitor: RefreshMonitor = {
  lastAttemptAt: null,
  lastTrigger: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastErrorCode: null,
  lastErrorMessage: null,
};

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

export function mapRefreshError(error: unknown): RefreshErrorDebug {
  const message = error instanceof Error ? error.message : "Unknown error";
  const looksLikeMissingDbUrl = message.includes("Environment variable not found: DATABASE_URL");
  const looksLikeTableMissing = message.includes("relation") && message.includes("does not exist");

  return {
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
}

export async function runRefresh(payload: RefreshPayload): Promise<RefreshResult> {
  const q = payload.q?.trim() || undefined;
  const city = payload.city?.trim() || undefined;
  const contractTypes = payload.contractType ? [payload.contractType] : undefined;
  const maxResults = parseMaxResults(payload.maxResults);

  const [ftResult, apecResult] = await Promise.allSettled([
    withTimeout(
      fetchJobsFromFranceTravail({ q, city, contractTypes }, { maxResults }),
      FT_TIMEOUT_MS
    ),
    withTimeout(
      fetchJobsFromApec({ q, city, contractTypes }, { maxResults }),
      FT_TIMEOUT_MS
    ),
  ]);

  const liveOffers: JobOffer[] = [
    ...(ftResult.status === "fulfilled" ? ftResult.value : []),
    ...(apecResult.status === "fulfilled" ? apecResult.value : []),
  ];

  const { inserted, updated } = await upsertJobs(liveOffers);

  return {
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
  };
}

export async function runRefreshWithMonitoring(payload: RefreshPayload, trigger: string): Promise<RefreshResult> {
  refreshMonitor.lastAttemptAt = new Date().toISOString();
  refreshMonitor.lastTrigger = trigger;

  try {
    const result = await runRefresh(payload);
    refreshMonitor.lastSuccessAt = new Date().toISOString();
    refreshMonitor.lastErrorAt = null;
    refreshMonitor.lastErrorCode = null;
    refreshMonitor.lastErrorMessage = null;
    return result;
  } catch (error) {
    const debug = mapRefreshError(error);
    refreshMonitor.lastErrorAt = new Date().toISOString();
    refreshMonitor.lastErrorCode = debug.code;
    refreshMonitor.lastErrorMessage = error instanceof Error ? error.message : "Unknown error";
    throw error;
  }
}

export async function getRefreshStatusSnapshot() {
  let lastDataSyncAt: string | null = null;
  let totalJobs = 0;

  try {
    const [latest, count] = await Promise.all([
      prisma.jobOffer.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.jobOffer.count(),
    ]);

    lastDataSyncAt = latest?.updatedAt.toISOString() ?? null;
    totalJobs = count;
  } catch {
    // Keep status resilient when DB is unavailable.
  }

  return {
    ...refreshMonitor,
    lastDataSyncAt,
    totalJobs,
  };
}