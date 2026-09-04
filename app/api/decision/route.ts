import { NextRequest, NextResponse } from "next/server";
import { evaluateDecision } from "@/lib/decision-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountNumber, ifsc, phoneNumber, amount } = body;

    if (!ifsc) {
      return NextResponse.json(
        { success: false, error: "IFSC code is required to compute decision ranking." },
        { status: 400 }
      );
    }

    const decision = evaluateDecision({
      accountNumber: accountNumber || "0000000000",
      ifsc,
      phoneNumber: phoneNumber || "9876543210",
      amount: Number(amount) || 500,
    });

    return NextResponse.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error computing decision engine ranking",
      },
      { status: 500 }
    );
  }
}
