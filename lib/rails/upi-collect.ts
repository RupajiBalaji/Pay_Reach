/**
 * ============================================================================
 * SIMULATED RAIL: UPI Collect Request (VPA Pull)
 * ============================================================================
 * This rail is SIMULATED for the hackathon prototype.
 *
 * In production, this dispatches an NPCI UPI Collect / Intent request via
 * a bank PSP or payment aggregator, presenting a payment prompt on the
 * payer's UPI mobile application.
 *
 * Outcome probability is weighted by bank_risk_profiles.upi_collect_success_rate.
 * ============================================================================
 */

import { BankRiskProfile, PaymentRequest, RailExecutionResult } from "../types";
import { RailAdapter } from "./types";

export class UpiCollectRail implements RailAdapter {
  readonly method = "upi_collect" as const;
  readonly name = "UPI Collect Request";
  readonly isSimulated = true;

  async execute(
    request: PaymentRequest,
    bankProfile: BankRiskProfile
  ): Promise<RailExecutionResult> {
    // Artificial latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    const roll = Math.random();
    const threshold = bankProfile.upi_collect_success_rate;

    if (roll <= threshold) {
      return {
        method: this.method,
        success: true,
        isReal: false,
        title: "UPI Collect Request Dispatched",
        message: `Collect notification of ₹${request.amount} pushed to UPI handles linked to +91 ${request.phone_number}. Authorization awaiting customer PIN.`,
        data: {
          referenceId: `UPI-COL-${Date.now()}`,
          vpa: `${request.phone_number}@okaxis`,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      };
    } else {
      const isTimeout = Math.random() > 0.5;
      return {
        method: this.method,
        success: false,
        isReal: false,
        title: isTimeout ? "Collect Request Expired" : "Payer PSP Declined Collect",
        message: isTimeout
          ? `Collect request timed out after waiting for customer acceptance on ${bankProfile.bank_name}.`
          : `Customer PSP bank rejected collect request under NPCI Error U29 (Payer PSP service unavailable or mandate rejected).`,
        errorCode: isTimeout ? "NPCI_COLLECT_TIMEOUT" : "NPCI_PSP_U29",
      };
    }
  }
}

export const upiCollectRail = new UpiCollectRail();
