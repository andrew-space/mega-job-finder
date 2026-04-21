import { createHash } from "node:crypto";
import type { ContractType, JobOffer, JobSource } from "@/lib/job-types";
import type { NormalizedJob } from "@/types/normalized-job";
import { upsertJobs } from "@/server/jobs-store";

function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function mapSourceTypeToJobSource(sourceType: NormalizedJob["sourceType"]): JobSource {
  if (sourceType === "francetravail") return "france_travail";
  return sourceType;
}

function mapEmploymentTypeToContractType(value: NormalizedJob["employmentType"]): ContractType {
  if (value === "internship") return "Stage";
  if (value === "apprenticeship") return "Alternance";
  if (value === "temporary") return "Interim";
  if (value === "contract") return "Freelance";
  if (value === "part_time") return "CDD";
  return "CDI";
}

function normalizedJobToJobOffer(job: NormalizedJob): JobOffer {
  const source = mapSourceTypeToJobSource(job.sourceType);
  const sourceId = job.externalId;
  const stableId = `${source}-${hashId(`${source}|${sourceId}`)}`;

  return {
    id: stableId,
    sourceId,
    source,
    title: job.title,
    company: job.sourceCompany,
    location: {
      city: job.city ?? "Unknown",
      department: "00",
      region: job.region ?? "Unknown",
      coords: { lat: 0, lng: 0 },
    },
    contractType: mapEmploymentTypeToContractType(job.employmentType),
    remote: "none",
    experienceLevel: "mid",
    sector: "",
    description: job.descriptionText || "Description non disponible",
    skills: [],
    publishedAt: job.publishedAt ?? new Date().toISOString(),
    applyUrl: job.applyUrl,
    isDuplicate: false,
    crawledAt: new Date().toISOString(),
  };
}

export async function upsertNormalizedJobs(jobs: NormalizedJob[]) {
  const appJobs = jobs.map(normalizedJobToJobOffer);
  return upsertJobs(appJobs);
}
