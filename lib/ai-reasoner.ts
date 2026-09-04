import { BankRiskProfile, RailAttempt, RailMethod, RailRanking } from "./types";
import { RequestContext } from "./decision-engine";

const RAIL_NAMES: Record<RailMethod, string> = {
  aadhaar_otp: "Aadhaar-OTP UPI Activation",
  razorpay_link: "Razorpay Smart Payment Link",
  upi_collect: "UPI Collect Request (VPA Push)",
  account_ifsc_qr: "Account + IFSC QR (Last Resort)",
};

interface AiRailOutput {
  method: RailMethod;
  confidence_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH";
  reason: string;
}

export async function reasonAboutRails(
  bankProfile: BankRiskProfile,
  context: RequestContext,
  recentAttemptHistory: RailAttempt[] = []
): Promise<RailRanking[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_key") || apiKey.includes("placeholder")) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // Format history context
  const historySummary = recentAttemptHistory.length > 0
    ? recentAttemptHistory
        .map(
          (a) =>
            `- Rail: ${a.rail_method}, Status: ${a.status}, Latency: ${a.latency_ms}ms${
              a.error_code ? `, Error: ${a.error_code}` : ""
            }${a.error_message ? ` (${a.error_message})` : ""}`
        )
        .join("\n")
    : "No recent live transaction history recorded for this bank.";

  const systemPrompt = `You are the AI Decision Engine of PayReach, an intelligent payment-collection routing system in India for card-less and first-time bank account holders (who have Account Number + IFSC but no debit card).

Your job is to analyze the user's bank risk profile, recent transaction attempts, and current context, then rank the 4 available collection rails in order of predicted success.

The 4 available rails are:
1. "aadhaar_otp": Aadhaar-OTP UPI PIN Activation (bypasses debit card; depends on whether the bank switch supports NPCI Aadhaar onboarding).
2. "razorpay_link": Razorpay Smart Payment Link (real universal payment link sent via SMS/WhatsApp with multi-rail fallback).
3. "upi_collect": UPI Collect Request / VPA Push (pushes collect request to customer mobile handle; depends on PSP response and user app approval).
4. "account_ifsc_qr": Account + IFSC QR (generates static account-based QR; severely prone to NPCI Error U16 "Risk threshold exceeded" at Indian bank switches, especially PSUs).

CRITICAL INSTRUCTIONS:
- You must output ONLY a valid, strict JSON array containing exactly 4 objects corresponding to the 4 methods above.
- Each object must have:
  - "method": string (one of: "aadhaar_otp", "razorpay_link", "upi_collect", "account_ifsc_qr")
  - "confidence_score": integer between 0 and 100
  - "risk_level": string ("LOW", "MODERATE", or "HIGH")
  - "reason": string (1-2 sentences specifically analyzing this bank's profile, U16 risk, and recent attempt history. DO NOT use generic filler text).
- Do not output any markdown code fences, greetings, or explanations outside the JSON array. Output raw JSON array only.`;

  const userPrompt = `Evaluate collection rails for the following card-less payment collection request:

BANK RISK PROFILE:
- Bank Name: ${bankProfile.bank_name}
- IFSC Prefix: ${bankProfile.ifsc_prefix}
- Bank Type: ${bankProfile.bank_type}
- Stored NPCI U16 Rejection Probability on QR: ${(bankProfile.u16_risk_score * 100).toFixed(1)}%
- Aadhaar-OTP UPI Supported on Switch: ${bankProfile.aadhaar_otp_supported ? "YES" : "NO"}
- Aadhaar-OTP Success Rate: ${(bankProfile.aadhaar_otp_success_rate * 100).toFixed(1)}%
- UPI Collect Success Rate: ${(bankProfile.upi_collect_success_rate * 100).toFixed(1)}%
- Payment Link Deliverability: ${(bankProfile.payment_link_success_rate * 100).toFixed(1)}%
- Historical Bank Attempts: ${bankProfile.total_attempts} (Successful: ${bankProfile.successful_attempts})

REQUEST CONTEXT:
- IFSC Code: ${context.ifsc}
- Account Number Length: ${context.accountNumber.length} digits (Bank Expected: ${bankProfile.account_digits_min}-${bankProfile.account_digits_max})
- Amount: ₹${context.amount}
- Phone Number: +91 ******${context.phoneNumber.slice(-4)}

RECENT TRANSACTION ATTEMPTS FOR THIS BANK:
${historySummary}

Rank the 4 rails: aadhaar_otp, razorpay_link, upi_collect, account_ifsc_qr. Output ONLY the JSON array.`;

  // Use AbortController for a responsive 6.5s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text;

    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("Anthropic response missing expected text content");
    }

    // Strip markdown code fences if present (```json ... ```)
    const cleanedJson = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson) as AiRailOutput[];

    if (!Array.isArray(parsed) || parsed.length !== 4) {
      throw new Error(`Expected 4 rail items from AI, got ${Array.isArray(parsed) ? parsed.length : "non-array"}`);
    }

    const validMethods = new Set<RailMethod>(["aadhaar_otp", "razorpay_link", "upi_collect", "account_ifsc_qr"]);
    const seen = new Set<string>();

    for (const item of parsed) {
      if (!validMethods.has(item.method)) {
        throw new Error(`Invalid method returned by AI: ${item.method}`);
      }
      if (seen.has(item.method)) {
        throw new Error(`Duplicate method returned by AI: ${item.method}`);
      }
      seen.add(item.method);
    }

    // Sort by confidence score descending
    const sorted = [...parsed].sort((a, b) => b.confidence_score - a.confidence_score);

    return sorted.map((item, index) => ({
      method: item.method,
      name: RAIL_NAMES[item.method] || item.method,
      confidence_score: Math.min(100, Math.max(0, Math.round(item.confidence_score))),
      recommended_rank: index + 1,
      is_real: item.method === "razorpay_link",
      reason: item.reason,
      risk_level: item.risk_level || (item.confidence_score >= 80 ? "LOW" : item.confidence_score >= 50 ? "MODERATE" : "HIGH"),
      warning:
        item.method === "account_ifsc_qr" && bankProfile.u16_risk_score >= 0.7
          ? `High U16 rejection frequency (${Math.round(bankProfile.u16_risk_score * 100)}%) on this bank's switch.`
          : undefined,
      engine_source: "ai_reasoned",
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
