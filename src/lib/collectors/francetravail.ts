import { fetchJobsFromFranceTravail } from "@/server/collectors/france-travail";
import { buildNormalizedJob } from "@/lib/normalizers/job";
import type { Collector } from "@/lib/collectors/types";
import type { NormalizedJob } from "@/types/normalized-job";

export const franceTravailCollector: Collector = {
  sourceType: "francetravail",
  async collect(input, options): Promise<NormalizedJob[]> {
    const rows = await fetchJobsFromFranceTravail(
      { q: input.companyName, city: undefined, contractTypes: undefined },
      { maxResults: options?.limit ?? 100 }
    );

    return rows.map((job) =>
      buildNormalizedJob({
        externalId: job.sourceId,
        sourceType: "francetravail",
        sourceCompany: job.company,
        title: job.title,
        locationRaw: [job.location.city, job.location.region, "France"].filter(Boolean).join(", "),
        descriptionHtml: null,
        applyUrl: job.applyUrl,
        employmentTypeRaw: job.contractType,
        publishedAt: job.publishedAt,
        metadata: {
          source: job.source,
          city: job.location.city,
          department: job.location.department,
          remote: job.remote,
          skills: job.skills,
        },
      })
    );
  },
};
