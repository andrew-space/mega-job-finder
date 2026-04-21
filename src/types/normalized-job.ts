import type { IngestionSourceType } from "@/types/source-types";

export type NormalizedEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "apprenticeship"
  | "temporary"
  | "other";

export interface NormalizedJob {
  externalId: string;
  sourceType: IngestionSourceType;
  sourceCompany: string;
  title: string;
  locationRaw: string;
  city: string | null;
  region: string | null;
  country: string | null;
  descriptionHtml: string | null;
  descriptionText: string;
  applyUrl: string;
  employmentType: NormalizedEmploymentType;
  publishedAt: string | null;
  metadata: Record<string, unknown>;
}
