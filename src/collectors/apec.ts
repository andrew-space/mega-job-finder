import type { Collector, RateLimit, RawOffer } from "@/collectors/types";
import type { JobOffer, SearchQuery } from "@/lib/job-types";

const RATE_LIMIT: RateLimit = {
  requests: 5,
  perSeconds: 1,
};

function emptyOffer(raw: RawOffer): JobOffer {
  const now = new Date().toISOString();
  return {
    id: `apec-${raw.id}`,
    sourceId: raw.id,
    source: "apec",
    title: "",
    company: "",
    location: {
      city: "",
      department: "",
      region: "",
      coords: { lat: 0, lng: 0 },
    },
    contractType: "CDI",
    remote: "none",
    experienceLevel: "mid",
    sector: "",
    description: "",
    skills: [],
    publishedAt: now,
    applyUrl: "",
    isDuplicate: false,
    crawledAt: now,
  };
}

export const apecCollector: Collector = {
  source: "apec",
  async fetchOffers(query: SearchQuery): Promise<RawOffer[]> {
    void query;
    // TODO: implement official API request with token/key.
    return [];
  },
  normalizeOffer(raw: RawOffer): JobOffer {
    // TODO: map official schema to normalized JobOffer.
    return emptyOffer(raw);
  },
  getRateLimit(): RateLimit {
    return RATE_LIMIT;
  },
};
