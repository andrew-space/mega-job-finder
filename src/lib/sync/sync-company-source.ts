import { getCollectorForSource } from "@/lib/collectors";
import type { CollectOptions } from "@/lib/collectors/types";
import type { NormalizedJob } from "@/types/normalized-job";
import type { CompanySourceType, IngestionSourceType } from "@/types/source-types";

export interface CompanySourceRecord {
  id: string;
  companyName: string;
  careersUrl: string;
  sourceType: CompanySourceType;
  sourceIdentifier: string;
  isActive: boolean;
}

export interface SyncCompanySourceResult {
  companySourceId: string;
  sourceType: CompanySourceType;
  fetched: number;
  jobs: NormalizedJob[];
}

export async function syncCompanySource(
  source: CompanySourceRecord,
  options?: CollectOptions
): Promise<SyncCompanySourceResult> {
  if (!source.isActive) {
    return {
      companySourceId: source.id,
      sourceType: source.sourceType,
      fetched: 0,
      jobs: [],
    };
  }

  const collector = getCollectorForSource(source.sourceType as IngestionSourceType);
  const jobs = await collector.collect(
    {
      sourceType: source.sourceType,
      sourceIdentifier: source.sourceIdentifier,
      companyName: source.companyName,
      careersUrl: source.careersUrl,
    },
    options
  );

  return {
    companySourceId: source.id,
    sourceType: source.sourceType,
    fetched: jobs.length,
    jobs,
  };
}

export async function syncFranceTravail(options?: CollectOptions): Promise<NormalizedJob[]> {
  const collector = getCollectorForSource("francetravail");
  return collector.collect(
    {
      sourceType: "francetravail",
      sourceIdentifier: "france-travail",
    },
    options
  );
}
