import { BankRiskProfile, RailMethod, RailRanking } from "./types";
import { getBankProfile, getRecentAttemptsForBank } from "./db";
import { reasonAboutRails } from "./ai-reasoner";

export interface RequestContext {
  accountNumber: string;
  ifsc: string;
  phoneNumber: string;
  amount: number;
}

/**
 * Deterministic fallback scoring algorithm based on stored bank risk metrics.
 * Used whenever ANTHROPIC_API_KEY is unset or the LLM call times out/fails.
 */
export function rankCollectionMethodsDeterministic(
  bankProfile: BankRiskProfile | undefined,
  context: RequestContext
): RailRanking[] {
  const profile: BankRiskProfile = bankProfile || {
    ifsc_prefix: context.ifsc.substring(0, 4).toUpperCase(),
    bank_name: `${context.ifsc.substring(0, 4).toUpperCase()} Bank`,
    bank_type: "PSU",
    u16_risk_score: 0.75,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.70,
    upi_collect_success_rate: 0.75,
    payment_link_success_rate: 0.96,
    total_attempts: 10,
    successful_attempts: 7,
    account_digits_min: 9,
    account_digits_max: 18,
    updated_at: new Date().toISOString(),
  };

  const rankings: RailRanking[] = [];

  // 1. Aadhaar-OTP UPI activation check
  if (profile.aadhaar_otp_supported) {
    const aadhaarScore = Math.round(profile.aadhaar_otp_success_rate * 100);
    rankings.push({
      method: "aadhaar_otp",
      name: "Aadhaar-OTP UPI Activation",
      confidence_score: aadhaarScore,
      recommended_rank: 0,
      is_real: false,
      risk_level: aadhaarScore >= 75 ? "LOW" : "MODERATE",
      reason: `Aadhaar-OTP UPI onboarding supported at ${profile.bank_name} (${aadhaarScore}% success). Bypasses debit card requirement and avoids QR payment rejection entirely.`,
      engine_source: "rule_based",
    });
  } else {
    rankings.push({
      method: "aadhaar_otp",
      name: "Aadhaar-OTP UPI Activation",
      confidence_score: 20,
      recommended_rank: 0,
      is_real: false,
      risk_level: "HIGH",
      reason: `Aadhaar-OTP UPI onboarding is not yet enabled on NPCI rails for ${profile.bank_name}.`,
      warning: "Bank rail currently disabled on NPCI directory.",
      engine_source: "rule_based",
    });
  }

  // 2. Razorpay Payment Link (Real integration)
  const razorpayScore = Math.round(profile.payment_link_success_rate * 100);
  rankings.push({
    method: "razorpay_link",
    name: "Razorpay Smart Payment Link",
    confidence_score: razorpayScore,
    recommended_rank: 0,
    is_real: true,
    risk_level: "LOW",
    reason: `Universal payment link via Razorpay (${razorpayScore}% deliverability). Delivers branded checkout with auto-retry and multi-rail support (NetBanking, Wallets, UPI).`,
    engine_source: "rule_based",
  });

  // 3. UPI Collect Request
  const collectScore = Math.round(profile.upi_collect_success_rate * 100);
  rankings.push({
    method: "upi_collect",
    name: "UPI Collect Request (VPA Push)",
    confidence_score: collectScore,
    recommended_rank: 0,
    is_real: false,
    risk_level: collectScore >= 80 ? "LOW" : "MODERATE",
    reason: `Direct VPA pull request to customer's linked mobile number (${collectScore}% response rate). Depends on user accepting payment notification within mandate window.`,
    engine_source: "rule_based",
  });

  // 4. Account + IFSC QR (Flagged High-Risk)
  const qrSuccessRate = Math.max(5, Math.round((1 - profile.u16_risk_score) * 100));
  const u16RejectionPct = Math.round(profile.u16_risk_score * 100);
  rankings.push({
    method: "account_ifsc_qr",
    name: "Account + IFSC QR (Last Resort)",
    confidence_score: qrSuccessRate,
    recommended_rank: 0,
    is_real: false,
    risk_level: "HIGH",
    reason: `Account+IFSC QR faces ${u16RejectionPct}% NPCI U16 rejection rate at ${profile.bank_name} ("Risk threshold exceeded"). High risk of silent in-store failure; used only as fallback.`,
    warning: `High U16 rejection frequency (${u16RejectionPct}%) on this bank's switch.`,
    engine_source: "rule_based",
  });

  // Sort by confidence score descending
  rankings.sort((a, b) => b.confidence_score - a.confidence_score);

  // Assign 1-indexed rank
  return rankings.map((item, index) => ({
    ...item,
    recommended_rank: index + 1,
  }));
}

/**
 * Main ranking function: attempts real LLM reasoning via Anthropic Claude first.
 * If Claude is unavailable or fails, gracefully cascades to deterministic rule-based ranking.
 */
export async function rankCollectionMethods(
  bankProfile: BankRiskProfile | undefined,
  context: RequestContext
): Promise<RailRanking[]> {
  const profile: BankRiskProfile = bankProfile || {
    ifsc_prefix: context.ifsc.substring(0, 4).toUpperCase(),
    bank_name: `${context.ifsc.substring(0, 4).toUpperCase()} Bank`,
    bank_type: "PSU",
    u16_risk_score: 0.75,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.70,
    upi_collect_success_rate: 0.75,
    payment_link_success_rate: 0.96,
    total_attempts: 10,
    successful_attempts: 7,
    account_digits_min: 9,
    account_digits_max: 18,
    updated_at: new Date().toISOString(),
  };

  try {
    const recentHistory = getRecentAttemptsForBank(profile.ifsc_prefix, 5);
    const aiRankings = await reasonAboutRails(profile, context, recentHistory);
    return aiRankings;
  } catch (err) {
    console.info(
      `[AI Reasoner] Fallback to deterministic model: ${
        err instanceof Error ? err.message : "API unavailable"
      }`
    );
    return rankCollectionMethodsDeterministic(profile, context);
  }
}

export async function evaluateDecision(context: RequestContext) {
  const prefix = context.ifsc.substring(0, 4).toUpperCase();
  const bankProfile = getBankProfile(prefix);
  const rankings = await rankCollectionMethods(bankProfile, context);
  const isAiReasoned = rankings.some((r) => r.engine_source === "ai_reasoned");

  return {
    bankProfile,
    rankings,
    topRecommendation: rankings[0],
    isAiReasoned,
    explanationSummary: isAiReasoned
      ? `Claude Sonnet evaluated ${bankProfile?.bank_name || prefix} risk profile & history: Recommends ${rankings[0].name} (${rankings[0].confidence_score}% confidence). Remaining rails queued for smart fallback.`
      : `Selected ${rankings[0].name} as primary rail for ${bankProfile?.bank_name || prefix} with ${rankings[0].confidence_score}% predicted success (Rule-based model). Remaining rails queued for automated fallback.`,
  };
}
