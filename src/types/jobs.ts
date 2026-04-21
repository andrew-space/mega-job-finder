// src/types/jobs.ts
// Central type definitions for JobRadar

export type JobSource = 
  | 'france_travail'
  | 'linkedin'
  | 'indeed'
  | 'wttj'
  | 'hellowork'
  | 'cadremploi'
  | 'leboncoin';

export type ContractType = 
  | 'CDI'
  | 'CDD'
  | 'Stage'
  | 'Alternance'
  | 'Freelance'
  | 'Interim';

export type RemoteMode = 'none' | 'partial' | 'full';

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'executive';

export interface Location {
  city: string;
  department?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export interface Salary {
  min?: number;
  max?: number;
  currency: string;
  period: 'month' | 'year';
}

export interface JobOffer {
  id: string;
  sourceId: string;
  source: JobSource;
  title: string;
  company: string;
  companyLogo?: string;
  location: Location;
  contractType: ContractType;
  salary?: Salary;
  remote: RemoteMode;
  experienceLevel?: ExperienceLevel;
  sector?: string;
  description: string;
  skills: string[];
  publishedAt: Date;
  expiresAt?: Date;
  applyUrl: string;
  isDuplicate?: boolean;
  duplicateGroupId?: string;
  crawledAt: Date;
}

export interface SearchQuery {
  q?: string;
  city?: string;
  contractTypes?: ContractType[];
  remote?: RemoteMode[];
  source?: JobSource[];
  maxSalary?: number;
  minSalary?: number;
  dateFrom?: Date;
  radius?: number; // km
}

export interface SearchResult {
  data: JobOffer[];
  meta: {
    total: number;
    filters: Record<string, unknown>;
    mode: 'mock' | 'live' | 'mixed';
    sourceCoverage: JobSource[];
  };
}

export interface RawJobOffer {
  id: string;
  [key: string]: unknown;
}

export interface Collector {
  source: JobSource;
  fetchOffers(query: SearchQuery): Promise<RawJobOffer[]>;
  normalizeOffer(raw: RawJobOffer): JobOffer;
  getRateLimit(): RateLimit;
}

export interface RateLimit {
  requests: number;
  perSeconds: number;
}
