import { NextResponse } from "next/server";
import type { ContractType } from "@/lib/job-types";
import {
  mapRefreshError,
  runRefreshWithMonitoring,
  type RefreshPayload,
} from "@/server/refresh-jobs";

export async function POST(request: Request) {
  let payload: RefreshPayload = {};

  try {
    payload = (await request.json()) as RefreshPayload;
  } catch {
    payload = {};
  }

  try {
    return NextResponse.json(await runRefreshWithMonitoring(payload, "manual-post"));
  } catch (error) {
    console.error("Refresh pipeline failed:", error);
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const payload: RefreshPayload = {
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    maxResults: searchParams.get("maxResults") ? Number(searchParams.get("maxResults")) : undefined,
    contractType: (searchParams.get("contractType") ?? undefined) as ContractType | undefined,
  };

  try {
    return NextResponse.json(await runRefreshWithMonitoring(payload, "cron-get"));
  } catch (error) {
    console.error("Refresh pipeline failed:", error);
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
