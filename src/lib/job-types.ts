export type JobSource =
  | "linkedin"
  | "indeed"
  | "wttj"
  | "hellowork"
  | "france_travail"
  | "cadremploi"
  | "apec"
  | "leboncoin";

export type ContractType =
  | "CDI"
  | "CDD"
  | "Alternance"
  | "Stage"
  | "Freelance"
  | "Interim";

export type RemoteMode = "none" | "partial" | "full";

export interface JobOffer {
  id: string;
  sourceId: string;
  source: JobSource;
  title: string;
  company: string;
  companyLogo?: string;
  location: {
    city: string;
    department: string;
    region: string;
    coords: { lat: number; lng: number };
  };
  contractType: ContractType;
  salary?: { min?: number; max?: number; currency: "EUR"; period: "month" | "year" };
  remote: RemoteMode;
  experienceLevel: "junior" | "mid" | "senior" | "executive";
  sector: string;
  description: string;
  skills: string[];
  publishedAt: string;
  expiresAt?: string;
  applyUrl: string;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  crawledAt: string;
}

export interface SearchQuery {
  q?: string;
  city?: string;
  contractTypes?: ContractType[];
  remote?: RemoteMode[];
  source?: JobSource[];
}
