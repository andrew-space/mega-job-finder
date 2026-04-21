import { NextResponse } from "next/server";
import type { ContractType } from "@/lib/job-types";
import {
  getRefreshStatusSnapshot,
  mapRefreshError,
  runRefreshWithMonitoring,
  type RefreshPayload,
} from "@/server/refresh-jobs";

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

  const status = await getRefreshStatusSnapshot();
  return NextResponse.json({ ok: true, status });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: RefreshPayload = {};

  try {
    payload = (await request.json()) as RefreshPayload;
  } catch {
    payload = {};
  }

  const normalizedPayload: RefreshPayload = {
    q: payload.q,
    city: payload.city,
    maxResults: payload.maxResults,
    contractType: payload.contractType as ContractType | undefined,
  };

  try {
    const result = await runRefreshWithMonitoring(normalizedPayload, "ops-manual-trigger");
    const status = await getRefreshStatusSnapshot();
    return NextResponse.json({ ok: true, result, status });
  } catch (error) {
    const debug = mapRefreshError(error);
    return NextResponse.json(
      {
        ok: false,
        error: "Refresh failed",
        debug,
      },
      { status: 500 }
    );
  }
}