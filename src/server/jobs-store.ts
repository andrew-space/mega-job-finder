import { Prisma } from "@prisma/client";
import type { JobOffer as DbJobOffer } from "@prisma/client";
import type {
  ContractType,
  JobOffer,
  JobSource,
  RemoteMode,
} from "@/lib/job-types";
import { prisma } from "@/server/db";

const ALLOWED_SOURCES: JobSource[] = [
  "linkedin",
  "indeed",
  "wttj",
  "hellowork",
  "france_travail",
  "cadremploi",
  "apec",
  "leboncoin",
];

const ALLOWED_CONTRACTS: ContractType[] = [
  "CDI",
  "CDD",
  "Alternance",
  "Stage",
  "Freelance",
  "Interim",
];

const ALLOWED_REMOTE: RemoteMode[] = ["none", "partial", "full"];

function parseSource(value: string): JobSource {
  if (ALLOWED_SOURCES.includes(value as JobSource)) return value as JobSource;
  return "france_travail";
}

function parseContract(value: string): ContractType {
  if (ALLOWED_CONTRACTS.includes(value as ContractType)) return value as ContractType;
  return "CDI";
}

function parseRemote(value: string): RemoteMode {
  if (ALLOWED_REMOTE.includes(value as RemoteMode)) return value as RemoteMode;
  return "none";
}

function parseExperience(value: string | null): JobOffer["experienceLevel"] {
  if (value === "junior" || value === "mid" || value === "senior" || value === "executive") {
    return value;
  }
  return "mid";
}

function parseSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function safeDate(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function toUpdateData(job: JobOffer): Prisma.JobOfferUpdateInput {
  return {
    title: job.title,
    company: job.company,
    city: job.location.city,
    department: job.location.department,
    region: job.location.region,
    latitude: job.location.coords.lat,
    longitude: job.location.coords.lng,
    contractType: job.contractType,
    remoteType: job.remote,
    salaryMin: job.salary?.min,
    salaryMax: job.salary?.max,
    salaryCurrency: job.salary?.currency ?? "EUR",
    experienceLevel: job.experienceLevel,
    description: job.description,
    skills: job.skills,
    publishedAt: safeDate(job.publishedAt),
    applyUrl: job.applyUrl,
  };
}

function toCreateData(job: JobOffer): Prisma.JobOfferCreateInput {
  return {
    id: job.id,
    sourceId: job.sourceId,
    source: job.source,
    title: job.title,
    company: job.company,
    city: job.location.city,
    department: job.location.department,
    region: job.location.region,
    latitude: job.location.coords.lat,
    longitude: job.location.coords.lng,
    contractType: job.contractType,
    remoteType: job.remote,
    salaryMin: job.salary?.min,
    salaryMax: job.salary?.max,
    salaryCurrency: job.salary?.currency ?? "EUR",
    experienceLevel: job.experienceLevel,
    description: job.description,
    skills: job.skills,
    publishedAt: safeDate(job.publishedAt),
    applyUrl: job.applyUrl,
    sourcePayload: Prisma.JsonNull,
  };
}

export function dbJobToAppJob(db: DbJobOffer): JobOffer {
  return {
    id: db.id,
    sourceId: db.sourceId,
    source: parseSource(db.source),
    title: db.title,
    company: db.company,
    location: {
      city: db.city,
      department: db.department,
      region: db.region,
      coords: {
        lat: db.latitude ?? 0,
        lng: db.longitude ?? 0,
      },
    },
    contractType: parseContract(db.contractType),
    salary:
      db.salaryMin || db.salaryMax
        ? {
            min: db.salaryMin ?? undefined,
            max: db.salaryMax ?? undefined,
            currency: "EUR",
            period: "year",
          }
        : undefined,
    remote: parseRemote(db.remoteType),
    experienceLevel: parseExperience(db.experienceLevel),
    sector: "",
    description: db.description,
    skills: parseSkills(db.skills),
    publishedAt: db.publishedAt.toISOString(),
    applyUrl: db.applyUrl,
    isDuplicate: false,
    crawledAt: db.updatedAt.toISOString(),
  };
}

export async function upsertJobs(jobs: JobOffer[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const job of jobs) {
    const existing = await prisma.jobOffer.findUnique({
      where: {
        sourceId_source: {
          sourceId: job.sourceId,
          source: job.source,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.jobOffer.update({
        where: { id: existing.id },
        data: toUpdateData(job),
      });
      updated += 1;
      continue;
    }

    await prisma.jobOffer.create({ data: toCreateData(job) });
    inserted += 1;
  }

  return { inserted, updated };
}

export async function getJobsFromDb(filters: {
  q?: string;
  city?: string;
  contractType?: ContractType;
  limit?: number;
}): Promise<JobOffer[]> {
  const where: Prisma.JobOfferWhereInput = {};

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }

  if (filters.contractType) {
    where.contractType = filters.contractType;
  }

  const rows = await prisma.jobOffer.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: filters.limit ?? 50,
  });

  return rows.map(dbJobToAppJob);
}

export async function getJobByIdFromDb(id: string): Promise<JobOffer | null> {
  const row = await prisma.jobOffer.findFirst({
    where: {
      OR: [{ id }, { sourceId: id }],
    },
  });

  if (!row) return null;
  return dbJobToAppJob(row);
}

function scoreRelatedJob(reference: JobOffer, candidate: JobOffer): number {
  let score = 0;

  if (reference.location.city === candidate.location.city) score += 4;
  if (reference.contractType === candidate.contractType) score += 2;
  if (reference.company === candidate.company) score += 1;
  if (reference.remote === candidate.remote) score += 1;

  const referenceSkills = new Set(reference.skills.map((skill) => skill.toLowerCase()));
  for (const skill of candidate.skills) {
    if (referenceSkills.has(skill.toLowerCase())) score += 3;
  }

  return score;
}

export async function getRelatedJobsFromDb(job: JobOffer, limit = 4): Promise<JobOffer[]> {
  const rows = await prisma.jobOffer.findMany({
    where: {
      id: { not: job.id },
      OR: [
        { city: job.location.city },
        { contractType: job.contractType },
        { source: job.source },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  return rows
    .map(dbJobToAppJob)
    .map((candidate) => ({
      candidate,
      score: scoreRelatedJob(job, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.candidate.publishedAt).getTime() - new Date(a.candidate.publishedAt).getTime();
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}