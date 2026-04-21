import type { CompanySourceType } from "@/types/source-types";

export interface CompanySource {
  id: string;
  companyName: string;
  careersUrl: string;
  sourceType: CompanySourceType;
  sourceIdentifier: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
