import { NextResponse } from "next/server";
import { getAllBankProfiles, resetDatabase } from "@/lib/db";

export async function GET() {
  try {
    const profiles = getAllBankProfiles();
    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bank profiles",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === "reset") {
      resetDatabase();
      return NextResponse.json({
        success: true,
        message: "Database reset to initial seeded bank risk profiles.",
      });
    }
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reset bank profiles",
      },
      { status: 500 }
    );
  }
}
