import { NextResponse } from "next/server";

export async function POST() {
  // Future: trigger collectors and persistence workflow.
  return NextResponse.json({
    ok: true,
    message: "Refresh pipeline stub created. Connect collectors next.",
  });
}
