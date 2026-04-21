import { NextResponse } from "next/server";
import { mockJobs } from "@/lib/mock-jobs";
import { jobCache } from "@/app/api/jobs/route";
import { getJobByIdFromDb } from "@/server/jobs-store";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;

  let dbJob = null;

  try {
    dbJob = await getJobByIdFromDb(id);
  } catch (error) {
    console.error("Job detail DB lookup failed, falling back to cache/mock:", error);
  }

  // DB first for persistence, then process cache, then mock fallback
  const job = dbJob ?? jobCache.get(id) ?? mockJobs.find((item) => item.id === id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ data: job });
}
