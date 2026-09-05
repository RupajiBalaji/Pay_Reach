import { getAllBankProfiles } from "./db";
import { executePaymentCollection, ExecutionTrace } from "./orchestrator";
import { evaluateDecision } from "./decision-engine";
import { RailMethod } from "./types";

export interface BankBatchStat {
  bankName: string;
  ifscPrefix: string;
  bankType: string;
  total: number;
  successes: number;
  successRate: number;
  u16RejectionsEncountered: number;
  fallbacksTriggered: number;
  winningRails: Record<RailMethod, number>;
}

export interface BatchTestSummary {
  totalProcessed: number;
  overallSuccessRate: number;
  overallSuccessCount: number;
  totalU16Avoided: number;
  totalFallbacksTriggered: number;
  averageLatencyMs: number;
  railDistribution: {
    method: RailMethod;
    name: string;
    count: number;
    percentage: number;
    isReal: boolean;
  }[];
  bankStats: BankBatchStat[];
  sampleTraces: {
    requestId: string;
    bankName: string;
    accountMasked: string;
    winningRail?: string;
    status: string;
    attemptsCount: number;
    u16Hit: boolean;
  }[];
}

const FIRST_NAMES = [
  "Ramesh", "Suresh", "Lakshmi", "Pooja", "Anil", "Sunita", "Deepak",
  "Manju", "Ganesh", "Rajesh", "Kavita", "Mohan", "Rekha", "Santosh",
  "Dinesh", "Savita", "Vijay", "Asha", "Mukesh", "Geeta"
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Devi", "Patel", "Singh", "Yadav", "Verma",
  "Gupta", "Mishra", "Jadhav", "Shinde", "Das", "Nair", "Reddy"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSyntheticAccountNumber(min: number, max: number): string {
  const length = Math.floor(Math.random() * (max - min + 1)) + min;
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
}

export async function runBatchTest(batchSize: number = 50): Promise<BatchTestSummary> {
  const bankProfiles = getAllBankProfiles();
  if (bankProfiles.length === 0) {
    throw new Error("No bank profiles found in database.");
  }

  const traces: ExecutionTrace[] = [];
  let totalU16Avoided = 0;
  let totalFallbacksTriggered = 0;
  let totalLatency = 0;

  const railCounts: Record<RailMethod, number> = {
    aadhaar_otp: 0,
    razorpay_link: 0,
    upi_collect: 0,
    account_ifsc_qr: 0,
  };

  const bankStatsMap: Record<string, BankBatchStat> = {};
  bankProfiles.forEach((b) => {
    bankStatsMap[b.ifsc_prefix] = {
      bankName: b.bank_name,
      ifscPrefix: b.ifsc_prefix,
      bankType: b.bank_type,
      total: 0,
      successes: 0,
      successRate: 0,
      u16RejectionsEncountered: 0,
      fallbacksTriggered: 0,
      winningRails: {
        aadhaar_otp: 0,
        razorpay_link: 0,
        upi_collect: 0,
        account_ifsc_qr: 0,
      },
    };
  });

  // IN-MEMORY BATCH CACHE:
  // To respect Gemini API free-tier rate limits and prevent quota exhaustion during 50+ request batch benchmark runs,
  // we maintain an in-memory cache of the AI decision ranking keyed by bank IFSC prefix within this batch run.
  // Repeated synthetic requests for the same bank reuse the initial Gemini AI ranking instead of making 50 redundant LLM calls.
  const batchAiDecisionCache = new Map<string, Awaited<ReturnType<typeof evaluateDecision>>>();

  // Run synthetic batch
  for (let i = 0; i < batchSize; i++) {
    const bank = getRandomItem(bankProfiles);
    const branchCode = Math.floor(1000 + Math.random() * 9000);
    const ifsc = `${bank.ifsc_prefix}000${branchCode}`.substring(0, 11);
    const acct = generateSyntheticAccountNumber(bank.account_digits_min, bank.account_digits_max);
    const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const name = `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`;
    const amount = Math.floor(100 + Math.random() * 1500);

    // Reuse cached AI ranking if already evaluated for this bank in this batch run
    let precomputedDecision = batchAiDecisionCache.get(bank.ifsc_prefix);
    if (!precomputedDecision) {
      precomputedDecision = await evaluateDecision({
        accountNumber: acct,
        ifsc,
        phoneNumber: phone,
        amount,
      });
      batchAiDecisionCache.set(bank.ifsc_prefix, precomputedDecision);
    }

    const trace = await executePaymentCollection({
      accountNumber: acct,
      ifsc,
      phoneNumber: phone,
      amount,
      customerName: name,
      note: "Batch test transaction",
      precomputedDecision,
    });

    traces.push(trace);
    totalLatency += trace.totalLatencyMs;

    const bStat = bankStatsMap[bank.ifsc_prefix];
    if (bStat) {
      bStat.total += 1;
      if (trace.isSuccess) {
        bStat.successes += 1;
        if (trace.request.winning_rail) {
          railCounts[trace.request.winning_rail] += 1;
          bStat.winningRails[trace.request.winning_rail] += 1;
        }
      }

      // Check U16 encounters
      const hitU16 = trace.attempts.some(
        (a) => a.error_code === "NPCI_U16_RISK_THRESHOLD_EXCEEDED"
      );
      if (hitU16) {
        bStat.u16RejectionsEncountered += 1;
        totalU16Avoided += 1;
      }

      // Fallbacks triggered (attempts > 1)
      if (trace.attempts.length > 1) {
        const fallbacksCount = trace.attempts.length - 1;
        bStat.fallbacksTriggered += fallbacksCount;
        totalFallbacksTriggered += fallbacksCount;
      }
    }
  }

  // Calculate success rates per bank
  const bankStatsList = Object.values(bankStatsMap)
    .filter((b) => b.total > 0)
    .map((b) => ({
      ...b,
      successRate: Math.round((b.successes / b.total) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  const successfulTraces = traces.filter((t) => t.isSuccess);
  const overallSuccessRate = Math.round((successfulTraces.length / batchSize) * 100);

  const railDistribution = [
    {
      method: "aadhaar_otp" as RailMethod,
      name: "Aadhaar-OTP UPI",
      count: railCounts.aadhaar_otp,
      percentage: Math.round((railCounts.aadhaar_otp / (successfulTraces.length || 1)) * 100),
      isReal: false,
    },
    {
      method: "razorpay_link" as RailMethod,
      name: "Razorpay Payment Link",
      count: railCounts.razorpay_link,
      percentage: Math.round((railCounts.razorpay_link / (successfulTraces.length || 1)) * 100),
      isReal: true,
    },
    {
      method: "upi_collect" as RailMethod,
      name: "UPI Collect Request",
      count: railCounts.upi_collect,
      percentage: Math.round((railCounts.upi_collect / (successfulTraces.length || 1)) * 100),
      isReal: false,
    },
    {
      method: "account_ifsc_qr" as RailMethod,
      name: "Account + IFSC QR",
      count: railCounts.account_ifsc_qr,
      percentage: Math.round((railCounts.account_ifsc_qr / (successfulTraces.length || 1)) * 100),
      isReal: false,
    },
  ];

  const sampleTraces = traces.slice(0, 15).map((t) => ({
    requestId: t.request.id,
    bankName: t.bankProfile.bank_name,
    accountMasked: `•••${t.request.account_number.slice(-4)}`,
    winningRail: t.winningResult?.title,
    status: t.request.status,
    attemptsCount: t.attempts.length,
    u16Hit: t.attempts.some((a) => a.error_code === "NPCI_U16_RISK_THRESHOLD_EXCEEDED"),
  }));

  return {
    totalProcessed: batchSize,
    overallSuccessRate,
    overallSuccessCount: successfulTraces.length,
    totalU16Avoided,
    totalFallbacksTriggered,
    averageLatencyMs: Math.round(totalLatency / batchSize),
    railDistribution,
    bankStats: bankStatsList,
    sampleTraces,
  };
}
