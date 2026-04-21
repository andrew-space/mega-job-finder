import { createHash } from "node:crypto";
import type { JobOffer, SearchQuery } from "@/lib/job-types";

const TOKEN_URL =
  process.env.FRANCE_TRAVAIL_TOKEN_URL ??
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";

const SEARCH_URL =
  process.env.FRANCE_TRAVAIL_SEARCH_URL ??
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

type FTOffer = {
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
  origineOffre?: { urlOrigine?: string };
  salaire?: { libelle?: string };
  competences?: Array<{ libelle?: string }>;
  secteurActiviteLibelle?: string;
  experienceExige?: string; // "D" = junior | "S" = senior | "E" = mid
};

type FTSearchResponse = { resultats?: FTOffer[] };

// --- Auth ---

async function getToken(): Promise<string> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("France Travail credentials missing");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: process.env.FRANCE_TRAVAIL_SCOPE ?? "api_offresdemploiv2 o2dsoffre",
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`FT token failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("FT token missing in response");
  return data.access_token;
}

// --- Normalization helpers ---

function toContractType(value?: string): JobOffer["contractType"] {
  const v = value?.toUpperCase() ?? "";
  if (v === "APP" || v === "PRO" || v.includes("ALTERN")) return "Alternance";
  if (v.includes("STAGE")) return "Stage";
  if (v === "MIS" || v.includes("INTERIM")) return "Interim";
  if (v === "LIB" || v.includes("FREELANCE")) return "Freelance";
  if (v === "CDD") return "CDD";
  return "CDI";
}

function toExperienceLevel(value?: string): JobOffer["experienceLevel"] {
  if (value === "D") return "junior";
  if (value === "S") return "senior";
  return "mid";
}

function parseSalary(libelle?: string): JobOffer["salary"] | undefined {
  if (!libelle) return undefined;
  const nums = libelle
    .match(/\d[\d\s]*/g)
    ?.map((n) => parseInt(n.replace(/\s/g, ""), 10))
    .filter((n) => n > 500) ?? [];
  if (nums.length === 0) return undefined;
  const isMonthly = libelle.toLowerCase().includes("mensuel");
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted.length > 1 ? sorted[sorted.length - 1] : undefined,
    currency: "EUR",
    period: isMonthly ? "month" : "year",
  };
}

function parseCoord(v: number | string | undefined): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const REGION_MAP: Record<string, string[]> = {
  "Ile-de-France": ["75", "77", "78", "91", "92", "93", "94", "95"],
  "Grand Est": ["67", "68", "51", "52", "54", "55", "57", "08", "10"],
  "Auvergne-Rhone-Alpes": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  "Nouvelle-Aquitaine": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  "Occitanie": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  "Hauts-de-France": ["02", "59", "60", "62", "80"],
  "Provence-Alpes-Côte d'Azur": ["04", "05", "06", "13", "83", "84"],
  "Bretagne": ["22", "29", "35", "56"],
  "Pays de la Loire": ["44", "49", "53", "72", "85"],
  "Normandie": ["14", "27", "50", "61", "76"],
  "Centre-Val de Loire": ["18", "28", "36", "37", "41", "45"],
  "Bourgogne-Franche-Comté": ["21", "25", "39", "58", "70", "71", "89", "90"],
};

function inferRegion(postalCode?: string): string {
  const dep = postalCode?.slice(0, 2) ?? "";
  for (const [region, deps] of Object.entries(REGION_MAP)) {
    if (deps.includes(dep)) return region;
  }
  return "France";
}

function makeId(sourceId: string, title: string, company: string): string {
  const hash = createHash("sha256")
    .update(`${sourceId}|${title}|${company}`)
    .digest("hex")
    .slice(0, 12);
  return `ft-${hash}`;
}

function normalizeOffer(raw: FTOffer, idx: number): JobOffer {
  const now = new Date().toISOString();
  const id = raw.id ?? `idx-${idx}`;
  const title = raw.intitule ?? "Offre France Travail";
  const company = raw.entreprise?.nom ?? "Entreprise non renseignée";
  // FT labels like "75116 - PARIS 16" → "Paris 16"
  const cityRaw = raw.lieuTravail?.libelle ?? "France";
  const city = cityRaw.replace(/^\d{5}\s*-\s*/, "").trim();
  const postalCode = raw.lieuTravail?.codePostal;

  return {
    id: makeId(id, title, company),
    sourceId: id,
    source: "france_travail",
    title,
    company,
    location: {
      city,
      department: postalCode?.slice(0, 2) ?? "00",
      region: inferRegion(postalCode),
      coords: {
        lat: parseCoord(raw.lieuTravail?.latitude),
        lng: parseCoord(raw.lieuTravail?.longitude),
      },
    },
    contractType: toContractType(raw.typeContrat),
    salary: parseSalary(raw.salaire?.libelle),
    remote: "none",
    experienceLevel: toExperienceLevel(raw.experienceExige),
    sector: raw.secteurActiviteLibelle ?? "",
    description: raw.description ?? "Description non disponible",
    skills:
      (raw.competences
        ?.map((c) => c.libelle)
        .filter((s): s is string => Boolean(s)) ?? []).slice(0, 8),
    publishedAt: raw.dateCreation ?? now,
    applyUrl:
      raw.origineOffre?.urlOrigine ??
      `https://www.francetravail.fr/offres/recherche/detail/${id}`,
    isDuplicate: false,
    crawledAt: now,
  };
}

// --- Fetch with pagination ---

async function fetchPage(
  token: string,
  query: SearchQuery,
  start: number,
  count: number
): Promise<FTOffer[]> {
  const params = new URLSearchParams();
  const text = [query.q, query.city].filter(Boolean).join(" ").trim();
  if (text) params.set("motsCles", text);
  params.set("range", `${start}-${start + count - 1}`);

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  // 206 = Partial Content is a valid success response from France Travail
  if (!res.ok && res.status !== 206) {
    throw new Error(`FT search failed: ${res.status}`);
  }

  const data = (await res.json()) as FTSearchResponse;
  return data.resultats ?? [];
}

export async function fetchJobsFromFranceTravail(
  query: SearchQuery,
  options: { maxResults?: number } = {}
): Promise<JobOffer[]> {
  const maxResults = options.maxResults ?? 25;
  const token = await getToken();
  const jobs: JobOffer[] = [];
  let start = 0;
  const pageSize = 25;

  while (jobs.length < maxResults) {
    const toFetch = Math.min(pageSize, maxResults - jobs.length);
    const batch = await fetchPage(token, query, start, toFetch);
    if (batch.length === 0) break;
    jobs.push(...batch.map((o, i) => normalizeOffer(o, start + i)));
    if (batch.length < pageSize) break;
    start += pageSize;
  }

  return jobs;
}
