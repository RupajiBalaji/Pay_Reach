/**
 * ============================================================================
 * SIMULATED RAIL: Account + IFSC QR Code (Last Resort / U16 Prone)
 * ============================================================================
 * This rail is SIMULATED for the hackathon prototype.
 *
 * It formats a standard NPCI account-based UPI string:
 *   upi://pay?pa=<acct>@<ifsc>.ifsc.npci&pn=PayReach...
 *
 * Problem: Indian banks increasingly reject this format at the switch
 * under NPCI Error code U16 ("Risk threshold exceeded" / "Account level restriction"),
 * leaving card-less users stranded with non-working QRs.
 *
 * Outcome probability is weighted by bank_risk_profiles.u16_risk_score.
 * ============================================================================
 */

import { BankRiskProfile, PaymentRequest, RailExecutionResult } from "../types";
import { RailAdapter } from "./types";

export class AccountIfscQrRail implements RailAdapter {
  readonly method = "account_ifsc_qr" as const;
  readonly name = "Account + IFSC QR Code";
  readonly isSimulated = true;

  async execute(
    request: PaymentRequest,
    bankProfile: BankRiskProfile
  ): Promise<RailExecutionResult> {
    // Artificial latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    // NPCI account-based VPA format
    const virtualVpa = `${request.account_number}@${request.ifsc}.ifsc.npci`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(virtualVpa)}&pn=${encodeURIComponent(
      request.customer_name || "PayReach User"
    )}&am=${request.amount}&cu=INR&tn=${encodeURIComponent(request.note || "PayReach Collection")}`;

    // Weighted simulation based on stored bank U16 risk score
    const roll = Math.random();
    const rejectionThreshold = bankProfile.u16_risk_score;

    if (roll < rejectionThreshold) {
      // Failed under NPCI Error U16
      return {
        method: this.method,
        success: false,
        isReal: false,
        title: "NPCI Error U16: Switch Restriction",
        message: `Transaction declined by ${bankProfile.bank_name} core switch with NPCI Error code U16 ("Risk threshold exceeded / Card-less account restriction"). Account+IFSC QR is blocked for this account type.`,
        errorCode: "NPCI_U16_RISK_THRESHOLD_EXCEEDED",
        data: {
          vpa: virtualVpa,
          qrString: upiUri,
        },
      };
    } else {
      return {
        method: this.method,
        success: true,
        isReal: false,
        title: "Account+IFSC QR Generated",
        message: `Account+IFSC QR generated. Note: Payment switch clearance succeeded, but caution advised due to ${Math.round(
          bankProfile.u16_risk_score * 100
        )}% historical U16 failure rate on this bank.`,
        data: {
          vpa: virtualVpa,
          qrString: upiUri,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
            upiUri
          )}`,
          expiresAt: new Date(Date.now() + 900000).toISOString(),
        },
      };
    }
  }
}

export const accountIfscQrRail = new AccountIfscQrRail();
