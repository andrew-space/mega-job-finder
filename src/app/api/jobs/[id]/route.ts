import { NextResponse } from "next/server";
import { mockJobs } from "@/lib/mock-jobs";
import { jobCache } from "@/app/api/jobs/route";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;

  // Check live cache first, then fall back to mock
  const job = jobCache.get(id) ?? mockJobs.find((item) => item.id === id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ data: job });
}
