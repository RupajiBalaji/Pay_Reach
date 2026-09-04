import { NextRequest, NextResponse } from "next/server";
import { executePaymentCollection } from "@/lib/orchestrator";
import { getAuditLogByRequestId } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountNumber, ifsc, phoneNumber, amount, customerName, note } = body;

    if (!accountNumber || !ifsc || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Account number, IFSC, and phone number are required." },
        { status: 400 }
      );
    }

    const trace = await executePaymentCollection({
      accountNumber,
      ifsc,
      phoneNumber,
      amount: Number(amount) || 500,
      customerName,
      note,
    });

    const fullAuditTrail = getAuditLogByRequestId(trace.request.id);

    return NextResponse.json({
      success: true,
      data: {
        ...trace,
        auditTrail: fullAuditTrail,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error executing collection pipeline",
      },
      { status: 500 }
    );
  }
}
