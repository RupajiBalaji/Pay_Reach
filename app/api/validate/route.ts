import { NextRequest, NextResponse } from "next/server";
import { validatePaymentInput } from "@/lib/validation";
import { getBankProfile } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountNumber, ifsc, phoneNumber, amount } = body;

    const validation = validatePaymentInput({
      accountNumber,
      ifsc,
      phoneNumber,
      amount,
    });

    let bankProfile = null;
    if (validation.ifsc.valid && validation.ifsc.prefix) {
      bankProfile = getBankProfile(validation.ifsc.prefix);
    }

    return NextResponse.json({
      success: validation.isValid,
      validation,
      bankProfile: bankProfile || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error during validation",
      },
      { status: 500 }
    );
  }
}
