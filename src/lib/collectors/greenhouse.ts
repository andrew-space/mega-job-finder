import { buildNormalizedJob } from "@/lib/normalizers/job";
import type { Collector } from "@/lib/collectors/types";
import type { NormalizedJob } from "@/types/normalized-job";

type GreenhouseJob = {
  id: number;
  title?: string;
  location?: { name?: string };
  absolute_url?: string;
  updated_at?: string;
  content?: string;
  metadata?: Array<{ name?: string; value?: string }>;
};

type GreenhouseResponse = {
  jobs?: GreenhouseJob[];
};

const GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards";

function getEmploymentType(job: GreenhouseJob): string | null {
  const list = job.metadata ?? [];
  const match = list.find((item) => (item.name ?? "").toLowerCase().includes("employment"));
  return match?.value ?? null;
}

export const greenhouseCollector: Collector = {
  sourceType: "greenhouse",
  async collect(input, options): Promise<NormalizedJob[]> {
    const identifier = input.sourceIdentifier.trim().toLowerCase();
    if (!identifier) return [];

    const url = `${GREENHOUSE_API_BASE}/${encodeURIComponent(identifier)}/jobs?content=true`;
    const response = await fetch(url, {
      method: "GET",
      signal: options?.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Greenhouse fetch failed: ${response.status}`);
    }

    const payload = (await response.json()) as GreenhouseResponse;
    const rows = payload.jobs ?? [];
    const limitedRows = typeof options?.limit === "number" ? rows.slice(0, options.limit) : rows;

    return limitedRows.map((job) =>
      buildNormalizedJob({
        externalId: String(job.id),
        sourceType: "greenhouse",
        sourceCompany: input.companyName ?? identifier,
        title: job.title ?? "Untitled role",
        locationRaw: job.location?.name ?? null,
        descriptionHtml: job.content ?? null,
        applyUrl: job.absolute_url ?? `https://boards.greenhouse.io/${identifier}`,
        employmentTypeRaw: getEmploymentType(job),
        publishedAt: job.updated_at ?? null,
        metadata: {
          boardToken: identifier,
          rawLocation: job.location?.name ?? null,
        },
      })
    );
  },
};
