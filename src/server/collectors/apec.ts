import { createHash } from "node:crypto";
import type { JobOffer, SearchQuery } from "@/lib/job-types";

const APEC_SEARCH_URL =
  process.env.APEC_SEARCH_URL ??
  "https://api.apec.fr/api-v1/jobs-query-language/search";

// --- Raw APEC types (all optional — API may evolve) ---

type ApecOffer = {
  numAnnonce?: string | number;
  intitule?: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string; codePostal?: string };
  natureContrat?: { libelle?: string } | string;
  typeContrat?: { libelle?: string } | string;
  texteAnnonce?: string;
  description?: string;
  datePublication?: string;
  urlDetailOffre?: string;
  salaire?: { libelle?: string } | string;
  competencesDeBase?: Array<{ libelle?: string }>;
  competences?: Array<{ libelle?: string }>;
  modeTravail?: { libelle?: string } | string;
  experienceLibelle?: string;
  experience?: { libelle?: string };
};

type ApecSearchResponse = {
  listeAnnonces?: ApecOffer[];
  totalCount?: number;
};

// --- Normalisation helpers ---

function toContractType(raw: ApecOffer): JobOffer["contractType"] {
  const label = (
    typeof raw.natureContrat === "object"
      ? raw.natureContrat?.libelle
      : raw.natureContrat ?? typeof raw.typeContrat === "object"
      ? (raw.typeContrat as { libelle?: string })?.libelle
      : (raw.typeContrat as string | undefined)
  )?.toLowerCase() ?? "";

  if (label.includes("altern") || label.includes("contrat pro")) return "Alternance";
  if (label.includes("stage")) return "Stage";
  if (label.includes("interim") || label.includes("intérim")) return "Interim";
  if (label.includes("freelance") || label.includes("libéral")) return "Freelance";
  if (label.includes("cdd")) return "CDD";
  return "CDI";
}

function toRemoteMode(raw: ApecOffer): JobOffer["remote"] {
  const label = (
    typeof raw.modeTravail === "object"
      ? raw.modeTravail?.libelle
      : raw.modeTravail
  )?.toLowerCase() ?? "";

  if (label.includes("télétravail total") || label.includes("full") || label.includes("100%")) return "full";
  if (label.includes("hybride") || label.includes("partiel")) return "partial";
  return "none";
}

function toExperienceLevel(raw: ApecOffer): JobOffer["experienceLevel"] {
  const label = (
    typeof raw.experience === "object"
      ? raw.experience?.libelle
      : raw.experienceLibelle
  )?.toLowerCase() ?? "";

  if (label.includes("junior") || label.includes("débutant") || label.includes("0") || label.includes("1 an")) return "junior";
  if (label.includes("senior") || label.includes("confirm") || label.includes("expert")) return "senior";
  return "mid";
}

function parseSalary(raw: ApecOffer): JobOffer["salary"] | undefined {
  const libelle = typeof raw.salaire === "object" ? raw.salaire?.libelle : raw.salaire;
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
  return `apec-${hash}`;
}

function normalizeOffer(raw: ApecOffer, idx: number): JobOffer {
  const now = new Date().toISOString();
  const sourceId = String(raw.numAnnonce ?? `idx-${idx}`);
  const title = raw.intitule ?? "Offre APEC";
  const company = raw.entreprise?.nom ?? "Entreprise non renseignée";
  const cityRaw = raw.lieuTravail?.libelle ?? "France";
  const city = cityRaw.replace(/^\d{5}\s*-\s*/, "").trim();
  const postalCode = raw.lieuTravail?.codePostal;
  const description = raw.texteAnnonce ?? raw.description ?? "Description non disponible";

  const rawSkills = (raw.competencesDeBase ?? raw.competences ?? [])
    .map((c) => c.libelle)
    .filter((s): s is string => Boolean(s))
    .slice(0, 8);

  return {
    id: makeId(sourceId, title, company),
    sourceId,
    source: "apec",
    title,
    company,
    location: {
      city,
      department: postalCode?.slice(0, 2) ?? "00",
      region: inferRegion(postalCode),
      coords: { lat: 0, lng: 0 },
    },
    contractType: toContractType(raw),
    salary: parseSalary(raw),
    remote: toRemoteMode(raw),
    experienceLevel: toExperienceLevel(raw),
    sector: "",
    description,
    skills: rawSkills,
    publishedAt: raw.datePublication ?? now,
    applyUrl:
      raw.urlDetailOffre ??
      `https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/${sourceId}`,
    isDuplicate: false,
    crawledAt: now,
  };
}

// --- Main export ---

export async function fetchJobsFromApec(
  query: SearchQuery,
  options: { maxResults?: number } = {}
): Promise<JobOffer[]> {
  const apiKey = process.env.APEC_API_KEY;
  if (!apiKey) return []; // silently skip when credentials not configured

  const maxResults = options.maxResults ?? 25;
  const jobs: JobOffer[] = [];
  let debut = 0;
  const pageSize = 25;

  while (jobs.length < maxResults) {
    const toFetch = Math.min(pageSize, maxResults - jobs.length);

    const body: Record<string, unknown> = { nbParPage: toFetch, debut };
    const text = [query.q, query.city].filter(Boolean).join(" ").trim();
    if (text) body.query = text;

    const res = await fetch(APEC_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gravitee-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`APEC search failed: ${res.status}`);

    const data = (await res.json()) as ApecSearchResponse;
    const batch = data.listeAnnonces ?? [];
    if (batch.length === 0) break;

    jobs.push(...batch.map((o, i) => normalizeOffer(o, debut + i)));
    if (batch.length < pageSize) break;
    debut += pageSize;
  }

  return jobs;
}
