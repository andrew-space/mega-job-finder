import type { NormalizedEmploymentType, NormalizedJob } from "@/types/normalized-job";
import type { IngestionSourceType } from "@/types/source-types";

function stripHtmlTags(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmploymentType(value?: string | null): NormalizedEmploymentType {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("full")) return "full_time";
  if (normalized.includes("part")) return "part_time";
  if (normalized.includes("intern")) return "internship";
  if (normalized.includes("apprent")) return "apprenticeship";
  if (normalized.includes("contract") || normalized.includes("freelance")) return "contract";
  if (normalized.includes("temp") || normalized.includes("interim")) return "temporary";
  return "other";
}

function parseLocation(raw: string | null | undefined): {
  locationRaw: string;
  city: string | null;
  region: string | null;
  country: string | null;
} {
  const locationRaw = raw?.trim() ?? "";
  if (!locationRaw) {
    return { locationRaw: "", city: null, region: null, country: null };
  }

  const parts = locationRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    locationRaw,
    city: parts[0] ?? null,
    region: parts[1] ?? null,
    country: parts[parts.length - 1] ?? null,
  };
}

export interface BuildNormalizedJobInput {
  externalId: string;
  sourceType: IngestionSourceType;
  sourceCompany: string;
  title: string;
  locationRaw?: string | null;
  descriptionHtml?: string | null;
  applyUrl: string;
  employmentTypeRaw?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export function buildNormalizedJob(input: BuildNormalizedJobInput): NormalizedJob {
  const location = parseLocation(input.locationRaw);
  const descriptionHtml = input.descriptionHtml ?? null;

  return {
    externalId: input.externalId,
    sourceType: input.sourceType,
    sourceCompany: input.sourceCompany,
    title: input.title,
    locationRaw: location.locationRaw,
    city: location.city,
    region: location.region,
    country: location.country,
    descriptionHtml,
    descriptionText: stripHtmlTags(descriptionHtml ?? ""),
    applyUrl: input.applyUrl,
    employmentType: normalizeEmploymentType(input.employmentTypeRaw),
    publishedAt: input.publishedAt ?? null,
    metadata: input.metadata ?? {},
  };
}
