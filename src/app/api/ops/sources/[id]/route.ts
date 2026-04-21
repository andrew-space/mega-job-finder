import { NextResponse } from "next/server";
import { getCompanySourceById, updateCompanySource } from "@/server/company-sources";

type Context = {
  params: Promise<{ id: string }>;
};

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

export async function GET(request: Request, context: Context) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const source = await getCompanySourceById(id);
    if (!source) {
      return NextResponse.json({ ok: false, error: "Source not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, source });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load source" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const source = await updateCompanySource(id, {
      companyName: typeof body.companyName === "string" ? body.companyName : undefined,
      careersUrl: typeof body.careersUrl === "string" ? body.careersUrl : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });

    return NextResponse.json({ ok: true, source });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update source" },
      { status: 500 }
    );
  }
}
