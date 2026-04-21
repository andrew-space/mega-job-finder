import { NextResponse } from "next/server";
import {
  detectSourceFromCareersUrl,
} from "@/lib/sources/detect-source";
import {
  listCompanySources,
  registerCompanySource,
} from "@/server/company-sources";
import { setRefreshSourceStats } from "@/server/refresh-jobs";
import { syncAllActiveCompanySources } from "@/server/sync-company-sources";

function getProvidedToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const headerToken = request.headers.get("x-ops-token");
  if (headerToken) return headerToken.trim();
  return null;
}

function isAuthorized(request: Request): boolean {
  const configuredToken = process.env.ADMIN_OPS_TOKEN;
  const providedToken = getProvidedToken(request);

  if (!configuredToken || !providedToken) return false;
  return configuredToken === providedToken;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const detect = url.searchParams.get("detect");
  if (detect) {
    try {
      const detected = detectSourceFromCareersUrl(detect);
      return NextResponse.json({ ok: true, detected });
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid careers URL" }, { status: 400 });
    }
  }

  try {
    const activeOnly = url.searchParams.get("activeOnly") === "1";
    const sources = await listCompanySources({ activeOnly });
    return NextResponse.json({ ok: true, sources });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to list sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const action = String(body.action ?? "register");

  if (action === "sync") {
    try {
      const result = await syncAllActiveCompanySources({
        limit: typeof body.limit === "number" ? body.limit : 50,
      });
      setRefreshSourceStats(
        result.stats.map((stat) => ({
          sourceType: stat.sourceType,
          fetched: stat.fetched,
          inserted: stat.inserted,
          updated: stat.updated,
          failed: stat.failed,
          error: stat.error,
        }))
      );
      return NextResponse.json({ ok: true, result });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Sync failed" },
        { status: 500 }
      );
    }
  }

  if (action === "sync-preview") {
    const sourceType = String(body.sourceType ?? "custom");
    const sourceIdentifier = String(body.sourceIdentifier ?? "preview");
    const companyName = String(body.companyName ?? "Preview Company");

    try {
      const { getCollectorForSource } = await import("@/lib/collectors");
      const collector = getCollectorForSource(sourceType as "francetravail" | "greenhouse" | "lever" | "custom");
      const jobs = await collector.collect({
        sourceType: sourceType as "francetravail" | "greenhouse" | "lever" | "custom",
        sourceIdentifier,
        companyName,
      }, {
        limit: typeof body.limit === "number" ? body.limit : 5,
      });

      return NextResponse.json({ ok: true, fetched: jobs.length });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Sync preview failed" },
        { status: 500 }
      );
    }
  }

  const companyName = String(body.companyName ?? "").trim();
  const careersUrl = String(body.careersUrl ?? "").trim();
  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

  if (!companyName || !careersUrl) {
    return NextResponse.json(
      { ok: false, error: "companyName and careersUrl are required" },
      { status: 400 }
    );
  }

  try {
    const source = await registerCompanySource({ companyName, careersUrl, isActive });
    return NextResponse.json({ ok: true, source }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to register source" },
      { status: 500 }
    );
  }
}
