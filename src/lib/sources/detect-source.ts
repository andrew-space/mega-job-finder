import type { CompanySourceType } from "@/types/source-types";

export interface DetectedSource {
  sourceType: CompanySourceType;
  sourceIdentifier: string;
}

function splitPathSegments(value: string): string[] {
  return value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function firstUsableSegment(segments: string[]): string | null {
  const blacklist = new Set(["embed", "jobs", "job", "board", "boards", "openings", "careers"]);
  for (const segment of segments) {
    const normalized = segment.toLowerCase();
    if (!blacklist.has(normalized)) return segment;
  }
  return null;
}

function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed);
  return new URL(`https://${trimmed}`);
}

export function detectSourceFromCareersUrl(careersUrl: string): DetectedSource {
  const parsed = normalizeUrl(careersUrl);
  const host = parsed.hostname.toLowerCase();
  const segments = splitPathSegments(parsed.pathname);

  if (host.includes("greenhouse.io")) {
    const token = firstUsableSegment(segments);
    return {
      sourceType: "greenhouse",
      sourceIdentifier: token ?? parsed.hostname,
    };
  }

  if (host.includes("lever.co")) {
    const slug = firstUsableSegment(segments);
    return {
      sourceType: "lever",
      sourceIdentifier: slug ?? parsed.hostname,
    };
  }

  return {
    sourceType: "custom",
    sourceIdentifier: parsed.toString(),
  };
}
