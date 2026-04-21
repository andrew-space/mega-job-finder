import type { Collector, RateLimit, RawOffer } from "@/collectors/types";
import type { JobOffer, SearchQuery } from "@/lib/job-types";
import { createHash } from "node:crypto";

const RATE_LIMIT: RateLimit = {
  requests: 10,
  perSeconds: 1,
};

const TOKEN_URL =
  process.env.FRANCE_TRAVAIL_TOKEN_URL ??
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";

const SEARCH_URL =
  process.env.FRANCE_TRAVAIL_SEARCH_URL ??
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

type FranceTravailRawPayload = {
  id?: string;
  intitule?: string;
  entreprise?: { nom?: string };
  description?: string;
  typeContrat?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number | string;
    longitude?: number | string;
    codePostal?: string;
  };
  dateCreation?: string;
  origineOffre?: {
    urlOrigine?: string;
  };
};

type FranceTravailSearchResponse = {
  resultats?: FranceTravailRawPayload[];
};

function toContractType(value?: string): JobOffer["contractType"] {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("altern")) return "Alternance";
  if (normalized.includes("stage")) return "Stage";
  if (normalized.includes("interim")) return "Interim";
  if (normalized.includes("freelance")) return "Freelance";
  if (normalized.includes("cdd")) return "CDD";
  return "CDI";
}

function parseCoords(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function inferRegionFromPostalCode(postalCode?: string): string {
  if (!postalCode || postalCode.length < 2) return "France";
  const dep = postalCode.slice(0, 2);
  if (["75", "77", "78", "91", "92", "93", "94", "95"].includes(dep)) {
    return "Ile-de-France";
  }
  if (["67", "68"].includes(dep)) return "Grand Est";
  if (["69", "01", "07", "26", "38", "42", "73", "74"].includes(dep)) {
    return "Auvergne-Rhone-Alpes";
  }
  return "France";
}

function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function createId(sourceId: string, title: string, company: string): string {
  const key = `${sourceId}|${title}|${company}`;
  return `ft-${hashId(key)}`;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("France Travail credentials are missing.");
  }

  const payload = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: process.env.FRANCE_TRAVAIL_SCOPE ?? "api_offresdemploiv2 o2dsoffre",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`France Travail token request failed with ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("France Travail token is missing in response.");
  }

  return data.access_token;
}

function emptyOffer(raw: RawOffer): JobOffer {
  const now = new Date().toISOString();
  return {
    id: `france-travail-${raw.id}`,
    sourceId: raw.id,
    source: "france_travail",
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

export const franceTravailCollector: Collector = {
  source: "france_travail",
  async fetchOffers(query: SearchQuery): Promise<RawOffer[]> {
    const accessToken = await getAccessToken();
    const params = new URLSearchParams();

    const freeText = [query.q, query.city].filter(Boolean).join(" ").trim();
    if (freeText) params.set("motsCles", freeText);
    params.set("range", "0-24");

    const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`France Travail search failed with ${response.status}`);
    }

    const data = (await response.json()) as FranceTravailSearchResponse;
    const rows = data.resultats ?? [];

    return rows.map((payload, index) => ({
      id: payload.id ?? `idx-${index}`,
      payload,
    }));
  },
  normalizeOffer(raw: RawOffer): JobOffer {
    const payload = (raw.payload ?? {}) as FranceTravailRawPayload;
    const title = payload.intitule ?? "Offre France Travail";
    const company = payload.entreprise?.nom ?? "Entreprise non renseignee";
    const cityLabel = payload.lieuTravail?.libelle ?? "France";
    const city = cityLabel.split("-")[0]?.trim() || cityLabel;
    const department = payload.lieuTravail?.codePostal?.slice(0, 2) ?? "00";
    const publishedAt = payload.dateCreation ?? new Date().toISOString();

    return {
      ...emptyOffer(raw),
      id: createId(raw.id, title, company),
      sourceId: payload.id ?? raw.id,
      title,
      company,
      location: {
        city,
        department,
        region: inferRegionFromPostalCode(payload.lieuTravail?.codePostal),
        coords: {
          lat: parseCoords(payload.lieuTravail?.latitude),
          lng: parseCoords(payload.lieuTravail?.longitude),
        },
      },
      contractType: toContractType(payload.typeContrat),
      description: payload.description ?? "Description non disponible",
      applyUrl: payload.origineOffre?.urlOrigine ?? "https://francetravail.fr",
      publishedAt,
      crawledAt: new Date().toISOString(),
    };
  },
  getRateLimit(): RateLimit {
    return RATE_LIMIT;
  },
};
