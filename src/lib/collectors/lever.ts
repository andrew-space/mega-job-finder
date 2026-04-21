import { buildNormalizedJob } from "@/lib/normalizers/job";
import type { Collector } from "@/lib/collectors/types";
import type { NormalizedJob } from "@/types/normalized-job";

type LeverPosting = {
  id: string;
  text?: string;
  description?: string;
  descriptionPlain?: string;
  hostedUrl?: string;
  createdAt?: number;
  categories?: {
    location?: string;
    commitment?: string;
    team?: string;
  };
};

const LEVER_API_BASE = "https://api.lever.co/v0/postings";

export const leverCollector: Collector = {
  sourceType: "lever",
  async collect(input, options): Promise<NormalizedJob[]> {
    const identifier = input.sourceIdentifier.trim().toLowerCase();
    if (!identifier) return [];

    const url = `${LEVER_API_BASE}/${encodeURIComponent(identifier)}?mode=json`;
    const response = await fetch(url, {
      method: "GET",
      signal: options?.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Lever fetch failed: ${response.status}`);
    }

    const rows = (await response.json()) as LeverPosting[];
    const limitedRows = typeof options?.limit === "number" ? rows.slice(0, options.limit) : rows;

    return limitedRows.map((job) =>
      buildNormalizedJob({
        externalId: job.id,
        sourceType: "lever",
        sourceCompany: input.companyName ?? identifier,
        title: job.text ?? "Untitled role",
        locationRaw: job.categories?.location ?? null,
        descriptionHtml: job.description ?? null,
        applyUrl: job.hostedUrl ?? `https://jobs.lever.co/${identifier}`,
        employmentTypeRaw: job.categories?.commitment ?? null,
        publishedAt: typeof job.createdAt === "number" ? new Date(job.createdAt).toISOString() : null,
        metadata: {
          leverCompany: identifier,
          team: job.categories?.team ?? null,
          descriptionPlain: job.descriptionPlain ?? null,
        },
      })
    );
  },
};
