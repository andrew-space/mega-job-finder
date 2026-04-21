import type { JobOffer, JobSource, SearchQuery } from "@/lib/job-types";

export interface RawOffer {
  id: string;
  payload: unknown;
}

export interface RateLimit {
  requests: number;
  perSeconds: number;
}

export interface Collector {
  source: JobSource;
  fetchOffers(query: SearchQuery): Promise<RawOffer[]>;
  normalizeOffer(raw: RawOffer): JobOffer;
  getRateLimit(): RateLimit;
}
