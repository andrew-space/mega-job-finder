import { listCompanySources, markCompanySourceSynced } from "@/server/company-sources";
import { upsertNormalizedJobs } from "@/server/normalized-jobs-store";
import { syncCompanySource } from "@/lib/sync/sync-company-source";

export type SourceSyncStat = {
  sourceType: string;
  companySourceId: string;
  companyName: string;
  fetched: number;
  inserted: number;
  updated: number;
  failed: boolean;
  error: string | null;
};

export type SyncAllCompanySourcesResult = {
  totalSources: number;
  fetched: number;
  inserted: number;
  updated: number;
  stats: SourceSyncStat[];
};

export async function syncAllActiveCompanySources(options?: { limit?: number }) {
  const sources = await listCompanySources({ activeOnly: true });
  const stats: SourceSyncStat[] = [];

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  for (const source of sources) {
    try {
      const result = await syncCompanySource(source, { limit: options?.limit ?? 50 });
      const persisted = await upsertNormalizedJobs(result.jobs);

      fetched += result.fetched;
      inserted += persisted.inserted;
      updated += persisted.updated;

      await markCompanySourceSynced(source.id);

      stats.push({
        sourceType: source.sourceType,
        companySourceId: source.id,
        companyName: source.companyName,
        fetched: result.fetched,
        inserted: persisted.inserted,
        updated: persisted.updated,
        failed: false,
        error: null,
      });
    } catch (error) {
      stats.push({
        sourceType: source.sourceType,
        companySourceId: source.id,
        companyName: source.companyName,
        fetched: 0,
        inserted: 0,
        updated: 0,
        failed: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalSources: sources.length,
    fetched,
    inserted,
    updated,
    stats,
  } satisfies SyncAllCompanySourcesResult;
}
