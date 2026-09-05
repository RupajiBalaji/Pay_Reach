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
  risk_level: string;
  reason: string;
}

// Rotational Models: starts with high-capacity fast models (gemini-3.5-flash-lite, gemini-3.1-flash-lite), rotating across available Gemini tiers
const ROTATIONAL_MODELS: string[] = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

let currentKeyIndex = 0;
let currentModelIndex = 0;

/**
 * Returns available API keys from environment variables (supports GEMINI_API_KEY or comma-separated GEMINI_API_KEYS)
 */
export function getApiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  if (process.env.GEMINI_API_KEYS) {
    const split = process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean);
    for (const k of split) {
      if (!keys.includes(k)) {
        keys.push(k);
      }
    }
  }

  return keys;
}

/**
 * Calls Google Gemini API with rotational keys and rotational models.
 * If a model returns 404/503 or a key hits quota (429), it automatically fails over to the next key/model.
 */
export async function reasonAboutRails(
  bankProfile: BankRiskProfile,
  context: RequestContext,
  recentAttemptHistory: RailAttempt[] = []
): Promise<RailRanking[]> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is not configured");
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

  const prompt = `You are the AI Decision Engine of PayReach, an intelligent payment-collection routing system in India for card-less and first-time bank account holders (who have Account Number + IFSC but no debit card).

Analyze the bank risk profile, recent transaction history, and current collection request. Rank the 4 available collection rails in order of predicted success.

AVAILABLE RAILS:
1. "aadhaar_otp": Aadhaar-OTP UPI PIN Activation (bypasses debit card; depends on whether the bank switch supports NPCI Aadhaar onboarding).
2. "razorpay_link": Razorpay Smart Payment Link (real universal payment link sent via SMS/WhatsApp with multi-rail fallback).
3. "upi_collect": UPI Collect Request / VPA Push (pushes collect request to customer mobile handle; depends on PSP response and user app approval).
4. "account_ifsc_qr": Account + IFSC QR (generates static account-based QR; severely prone to NPCI Error U16 "Risk threshold exceeded" at Indian bank switches, especially PSUs).

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
- Account Number Length: ${context.accountNumber.length} digits (Expected: ${bankProfile.account_digits_min}-${bankProfile.account_digits_max})
- Amount: ₹${context.amount}
- Phone Number: +91 ******${context.phoneNumber.slice(-4)}

RECENT TRANSACTION ATTEMPTS FOR THIS BANK:
${historySummary}

CRITICAL FORMAT REQUIREMENT:
Return ONLY a JSON array of exactly 4 objects corresponding to the 4 methods above.
Each object must have:
- "method": string (one of: "aadhaar_otp", "razorpay_link", "upi_collect", "account_ifsc_qr")
- "confidence_score": integer between 0 and 100
- "risk_level": string ("LOW", "MODERATE", or "HIGH")
- "reason": string (1-2 sentences specifically analyzing this bank's profile, U16 risk, and recent attempt history. DO NOT use generic boilerplate).`;

  let lastError: Error | null = null;
  const maxAttempts = Math.min(keys.length * ROTATIONAL_MODELS.length, 6);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = keys[(currentKeyIndex + attempt) % keys.length];
    const model = ROTATIONAL_MODELS[(currentModelIndex + attempt) % ROTATIONAL_MODELS.length];

    // Explicit 5-second timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Gemini Rotational Failover] Key ending in ...${key.slice(-6)} model ${model} returned ${response.status}: ${errorText.slice(0, 100)}`);
        // If 404 (deprecated) or 503 (high demand), rotate to next model
        if (response.status === 404 || response.status === 503) {
          currentModelIndex = (currentModelIndex + 1) % ROTATIONAL_MODELS.length;
        }
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText || typeof rawText !== "string") {
        throw new Error("Missing text candidate in Gemini response");
      }

      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as AiRailOutput[];

      if (!Array.isArray(parsed) || parsed.length !== 4) {
        throw new Error(`Expected 4 rail items from Gemini, received ${Array.isArray(parsed) ? parsed.length : "non-array"}`);
      }

      const validMethods = new Set<RailMethod>(["aadhaar_otp", "razorpay_link", "upi_collect", "account_ifsc_qr"]);
      const seen = new Set<string>();

      for (const item of parsed) {
        if (!validMethods.has(item.method)) {
          throw new Error(`Invalid method returned by Gemini: ${item.method}`);
        }
        if (seen.has(item.method)) {
          throw new Error(`Duplicate method returned by Gemini: ${item.method}`);
        }
        seen.add(item.method);
      }

      // Success! Update rotation index for healthy load distribution
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;

      // Sort by confidence score descending
      const sorted = [...parsed].sort((a, b) => {
        const scoreA = a.confidence_score <= 1.0 ? a.confidence_score * 100 : a.confidence_score;
        const scoreB = b.confidence_score <= 1.0 ? b.confidence_score * 100 : b.confidence_score;
        return scoreB - scoreA;
      });

      return sorted.map((item, index) => {
        const normalizedScore = item.confidence_score <= 1.0
          ? Math.round(item.confidence_score * 100)
          : Math.round(item.confidence_score);

        const normalizedRisk = item.risk_level === "MEDIUM"
          ? ("MODERATE" as const)
          : (["LOW", "MODERATE", "HIGH"].includes(item.risk_level)
              ? (item.risk_level as "LOW" | "MODERATE" | "HIGH")
              : normalizedScore >= 80 ? "LOW" : normalizedScore >= 50 ? "MODERATE" : "HIGH");

        return {
          method: item.method,
          name: RAIL_NAMES[item.method] || item.method,
          confidence_score: Math.min(100, Math.max(0, normalizedScore)),
          recommended_rank: index + 1,
          is_real: item.method === "razorpay_link",
          reason: item.reason,
          risk_level: normalizedRisk,
          warning:
            item.method === "account_ifsc_qr" && bankProfile.u16_risk_score >= 0.7
              ? `High U16 rejection frequency (${Math.round(bankProfile.u16_risk_score * 100)}%) on this bank's switch.`
              : undefined,
          engine_source: "ai_reasoned",
        };
      });
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      currentModelIndex = (currentModelIndex + 1) % ROTATIONAL_MODELS.length;
    }
  }

  throw lastError || new Error("All Gemini rotational keys and models failed");
}
