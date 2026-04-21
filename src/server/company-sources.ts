import { prisma } from "@/server/db";
import { detectSourceFromCareersUrl } from "@/lib/sources/detect-source";

export interface RegisterCompanySourceInput {
  companyName: string;
  careersUrl: string;
  isActive?: boolean;
}

export async function registerCompanySource(input: RegisterCompanySourceInput) {
  const detected = detectSourceFromCareersUrl(input.careersUrl);

  return prisma.companySource.upsert({
    where: {
      sourceType_sourceIdentifier: {
        sourceType: detected.sourceType,
        sourceIdentifier: detected.sourceIdentifier,
      },
    },
    update: {
      companyName: input.companyName,
      careersUrl: input.careersUrl,
      isActive: input.isActive ?? true,
    },
    create: {
      companyName: input.companyName,
      careersUrl: input.careersUrl,
      sourceType: detected.sourceType,
      sourceIdentifier: detected.sourceIdentifier,
      isActive: input.isActive ?? true,
    },
  });
}

export async function listActiveCompanySources() {
  return prisma.companySource.findMany({
    where: { isActive: true },
    orderBy: [{ companyName: "asc" }],
  });
}

export async function markCompanySourceSynced(sourceId: string) {
  return prisma.companySource.update({
    where: { id: sourceId },
    data: { lastSyncedAt: new Date() },
  });
}
