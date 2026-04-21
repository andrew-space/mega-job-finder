import type { NormalizedJob } from "@/types/normalized-job";
import type { CompanySourceType, IngestionSourceType } from "@/types/source-types";

export interface CollectOptions {
  limit?: number;
  signal?: AbortSignal;
}

export interface CollectorInput {
  sourceIdentifier: string;
  companyName?: string;
  careersUrl?: string;
  sourceType: IngestionSourceType;
}

export interface Collector {
  readonly sourceType: CompanySourceType | "francetravail";
  collect(input: CollectorInput, options?: CollectOptions): Promise<NormalizedJob[]>;
}
