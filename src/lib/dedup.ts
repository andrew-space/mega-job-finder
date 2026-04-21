import type { JobOffer } from "@/lib/job-types";

const sourcePriority: Record<JobOffer["source"], number> = {
  wttj: 8,
  linkedin: 7,
  cadremploi: 6,
  indeed: 5,
  hellowork: 4,
  france_travail: 3,
  apec: 2,
  leboncoin: 1,
};

function normalizeCompanyName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(sas|sa|sarl|sasu|eurl|inc|ltd)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  const distance = levenshtein(left, right);
  const maxLength = Math.max(left.length, right.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

function publishedWithin48h(a: string, b: string): boolean {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Math.abs(left - right) <= 48 * 60 * 60 * 1000;
}

export function computeDuplicateScore(a: JobOffer, b: JobOffer): number {
  let score = 0;

  const titleSimilarity = similarity(a.title, b.title);
  if (titleSimilarity > 0.85) score += 40;

  const companySimilarity = similarity(normalizeCompanyName(a.company), normalizeCompanyName(b.company));
  if (companySimilarity > 0.9) score += 30;

  const sameLocation =
    a.location.city.toLowerCase() === b.location.city.toLowerCase() &&
    a.location.department.toLowerCase() === b.location.department.toLowerCase();
  if (sameLocation) score += 20;

  if (publishedWithin48h(a.publishedAt, b.publishedAt)) score += 10;

  return score;
}

export function selectPreferredOffer(a: JobOffer, b: JobOffer): JobOffer {
  return sourcePriority[a.source] >= sourcePriority[b.source] ? a : b;
}

export function markDuplicates(offers: JobOffer[]): JobOffer[] {
  const result: JobOffer[] = offers.map((offer) => ({ ...offer, isDuplicate: false }));

  for (let i = 0; i < result.length; i += 1) {
    for (let j = i + 1; j < result.length; j += 1) {
      const score = computeDuplicateScore(result[i], result[j]);
      if (score < 80) continue;

      const preferred = selectPreferredOffer(result[i], result[j]);
      const duplicate = preferred.id === result[i].id ? result[j] : result[i];
      const groupId = `${preferred.id}:${duplicate.id}`;
      duplicate.isDuplicate = true;
      duplicate.duplicateGroupId = groupId;
      preferred.duplicateGroupId = groupId;
    }
  }

  return result;
}
