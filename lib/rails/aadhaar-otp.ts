/**
 * ============================================================================
 * SIMULATED RAIL: Aadhaar-OTP UPI Activation
 * ============================================================================
 * This rail is SIMULATED for the hackathon prototype.
 *
 * In production, this interacts with NPCI / UIDAI Aadhaar-OTP set-UPI-PIN API
 * allowing customers without a debit card to set their UPI PIN using an
 * OTP sent to their Aadhaar-registered mobile number.
 *
 * Outcome probability is weighted by bank_risk_profiles.aadhaar_otp_success_rate.
 * ============================================================================
 */

import { BankRiskProfile, PaymentRequest, RailExecutionResult } from "../types";
import { RailAdapter } from "./types";

export class AadhaarOtpRail implements RailAdapter {
  readonly method = "aadhaar_otp" as const;
  readonly name = "Aadhaar-OTP UPI Activation";
  readonly isSimulated = true;

  async execute(
    request: PaymentRequest,
    bankProfile: BankRiskProfile
  ): Promise<RailExecutionResult> {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!bankProfile.aadhaar_otp_supported) {
      return {
        method: this.method,
        success: false,
        isReal: false,
        title: "Aadhaar-OTP Onboarding Unavailable",
        message: `${bankProfile.bank_name} has not yet activated Aadhaar-OTP UPI onboarding on the NPCI switch.`,
        errorCode: "NPCI_AADHAAR_NOT_ENABLED",
      };
    }

    // Weighted simulation based on stored bank profile
    const roll = Math.random();
    const threshold = bankProfile.aadhaar_otp_success_rate;

    if (roll <= threshold) {
      const maskedPhone = `+91 ******${request.phone_number.slice(-4)}`;
      return {
        method: this.method,
        success: true,
        isReal: false,
        title: "Aadhaar-OTP PIN Ready",
        message: `Aadhaar-OTP session initiated successfully. OTP challenge dispatched to ${maskedPhone}. User can authenticate UPI PIN without debit card.`,
        data: {
          referenceId: `AADH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vpa: `${request.phone_number}@upi`,
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
      };
    } else {
      return {
        method: this.method,
        success: false,
        isReal: false,
        title: "Aadhaar Seeding Failure",
        message: `UIDAI-Bank link verification timed out. Bank ${bankProfile.bank_name} reported mobile number mismatch between core banking (CBS) and Aadhaar records.`,
        errorCode: "UIDAI_MOBILE_MISMATCH",
      };
    }
  }
}

export const aadhaarOtpRail = new AadhaarOtpRail();
