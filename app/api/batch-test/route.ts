import { NextRequest, NextResponse } from "next/server";
import { runBatchTest } from "@/lib/batch-tester";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Number(body.count) || 50;

    // Cap batch size between 10 and 100 to balance speed and statistical depth
    const safeCount = Math.min(Math.max(count, 10), 100);

    const results = await runBatchTest(safeCount);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error executing batch test",
      },
      { status: 500 }
    );
  }
}
