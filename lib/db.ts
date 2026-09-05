import fs from "fs";
import path from "path";
import { BankRiskProfile, PaymentRequest, RailAttempt, AuditEvent } from "./types";

interface DbSchema {
  bank_risk_profiles: BankRiskProfile[];
  requests: PaymentRequest[];
  attempts: RailAttempt[];
  audit_log: AuditEvent[];
}

// Detect Vercel / serverless environment for writable storage
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "payreach.json");
const SEED_FILE = path.join(process.cwd(), "data", "seed.json");

export const SEED_BANK_PROFILES: BankRiskProfile[] = [
  {
    ifsc_prefix: "SBIN",
    bank_name: "State Bank of India",
    bank_type: "PSU",
    u16_risk_score: 0.85, // 85% risk of U16 failure on acct+ifsc QR
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.82,
    upi_collect_success_rate: 0.76,
    payment_link_success_rate: 0.98,
    total_attempts: 140,
    successful_attempts: 118,
    account_digits_min: 11,
    account_digits_max: 11,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "PUNB",
    bank_name: "Punjab National Bank",
    bank_type: "PSU",
    u16_risk_score: 0.88,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.75,
    upi_collect_success_rate: 0.72,
    payment_link_success_rate: 0.97,
    total_attempts: 95,
    successful_attempts: 74,
    account_digits_min: 16,
    account_digits_max: 16,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "BARB",
    bank_name: "Bank of Baroda",
    bank_type: "PSU",
    u16_risk_score: 0.80,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.78,
    upi_collect_success_rate: 0.75,
    payment_link_success_rate: 0.97,
    total_attempts: 80,
    successful_attempts: 65,
    account_digits_min: 14,
    account_digits_max: 14,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "CNRB",
    bank_name: "Canara Bank",
    bank_type: "PSU",
    u16_risk_score: 0.78,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.79,
    upi_collect_success_rate: 0.74,
    payment_link_success_rate: 0.97,
    total_attempts: 70,
    successful_attempts: 58,
    account_digits_min: 13,
    account_digits_max: 13,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "UBIN",
    bank_name: "Union Bank of India",
    bank_type: "PSU",
    u16_risk_score: 0.82,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.76,
    upi_collect_success_rate: 0.72,
    payment_link_success_rate: 0.97,
    total_attempts: 60,
    successful_attempts: 47,
    account_digits_min: 15,
    account_digits_max: 15,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "CBIN",
    bank_name: "Central Bank of India",
    bank_type: "PSU",
    u16_risk_score: 0.89,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.70,
    upi_collect_success_rate: 0.68,
    payment_link_success_rate: 0.96,
    total_attempts: 45,
    successful_attempts: 33,
    account_digits_min: 10,
    account_digits_max: 10,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "BKID",
    bank_name: "Bank of India",
    bank_type: "PSU",
    u16_risk_score: 0.84,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.74,
    upi_collect_success_rate: 0.71,
    payment_link_success_rate: 0.96,
    total_attempts: 50,
    successful_attempts: 39,
    account_digits_min: 15,
    account_digits_max: 15,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "IOBA",
    bank_name: "Indian Overseas Bank",
    bank_type: "PSU",
    u16_risk_score: 0.86,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.72,
    upi_collect_success_rate: 0.70,
    payment_link_success_rate: 0.96,
    total_attempts: 40,
    successful_attempts: 30,
    account_digits_min: 15,
    account_digits_max: 15,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "IDIB",
    bank_name: "Indian Bank",
    bank_type: "PSU",
    u16_risk_score: 0.81,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.77,
    upi_collect_success_rate: 0.73,
    payment_link_success_rate: 0.96,
    total_attempts: 48,
    successful_attempts: 38,
    account_digits_min: 9,
    account_digits_max: 17,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "HDFC",
    bank_name: "HDFC Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.60,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.89,
    upi_collect_success_rate: 0.91,
    payment_link_success_rate: 0.99,
    total_attempts: 120,
    successful_attempts: 112,
    account_digits_min: 14,
    account_digits_max: 14,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "ICIC",
    bank_name: "ICICI Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.58,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.88,
    upi_collect_success_rate: 0.92,
    payment_link_success_rate: 0.99,
    total_attempts: 115,
    successful_attempts: 108,
    account_digits_min: 12,
    account_digits_max: 12,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "UTIB",
    bank_name: "Axis Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.62,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.86,
    upi_collect_success_rate: 0.88,
    payment_link_success_rate: 0.98,
    total_attempts: 90,
    successful_attempts: 82,
    account_digits_min: 15,
    account_digits_max: 15,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "KKBK",
    bank_name: "Kotak Mahindra Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.55,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.88,
    upi_collect_success_rate: 0.89,
    payment_link_success_rate: 0.99,
    total_attempts: 75,
    successful_attempts: 70,
    account_digits_min: 10,
    account_digits_max: 14,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "INDB",
    bank_name: "IndusInd Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.64,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.84,
    upi_collect_success_rate: 0.86,
    payment_link_success_rate: 0.98,
    total_attempts: 50,
    successful_attempts: 45,
    account_digits_min: 12,
    account_digits_max: 14,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "YESB",
    bank_name: "Yes Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.52,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.85,
    upi_collect_success_rate: 0.87,
    payment_link_success_rate: 0.98,
    total_attempts: 45,
    successful_attempts: 41,
    account_digits_min: 15,
    account_digits_max: 15,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "IDFB",
    bank_name: "IDFC First Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.48,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.89,
    upi_collect_success_rate: 0.90,
    payment_link_success_rate: 0.99,
    total_attempts: 55,
    successful_attempts: 52,
    account_digits_min: 11,
    account_digits_max: 11,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "PYTM",
    bank_name: "Paytm Payments Bank",
    bank_type: "PAYMENT_BANK",
    u16_risk_score: 0.40,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.92,
    upi_collect_success_rate: 0.93,
    payment_link_success_rate: 0.99,
    total_attempts: 85,
    successful_attempts: 81,
    account_digits_min: 12,
    account_digits_max: 12,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "AIRP",
    bank_name: "Airtel Payments Bank",
    bank_type: "PAYMENT_BANK",
    u16_risk_score: 0.42,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.90,
    upi_collect_success_rate: 0.91,
    payment_link_success_rate: 0.98,
    total_attempts: 65,
    successful_attempts: 61,
    account_digits_min: 10,
    account_digits_max: 10,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "IPOS",
    bank_name: "India Post Payments Bank",
    bank_type: "PAYMENT_BANK",
    u16_risk_score: 0.72,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.82,
    upi_collect_success_rate: 0.77,
    payment_link_success_rate: 0.97,
    total_attempts: 50,
    successful_attempts: 42,
    account_digits_min: 12,
    account_digits_max: 12,
    updated_at: new Date().toISOString(),
  },
  {
    ifsc_prefix: "FDRL",
    bank_name: "Federal Bank",
    bank_type: "PRIVATE",
    u16_risk_score: 0.56,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.87,
    upi_collect_success_rate: 0.88,
    payment_link_success_rate: 0.98,
    total_attempts: 40,
    successful_attempts: 37,
    account_digits_min: 14,
    account_digits_max: 14,
    updated_at: new Date().toISOString(),
  }
];

let memoryCache: DbSchema | null = null;

function loadSeedData(): DbSchema {
  try {
    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, "utf-8");
      const parsed = JSON.parse(raw) as DbSchema;
      if (parsed.bank_risk_profiles && parsed.bank_risk_profiles.length > 0) {
        return {
          bank_risk_profiles: parsed.bank_risk_profiles,
          requests: parsed.requests || [],
          attempts: parsed.attempts || [],
          audit_log: parsed.audit_log || [],
        };
      }
    }
  } catch (err) {
    console.warn("[DB] Failed reading seed.json, falling back to SEED_BANK_PROFILES", err);
  }

  return {
    bank_risk_profiles: SEED_BANK_PROFILES,
    requests: [],
    attempts: [],
    audit_log: [],
  };
}

function ensureDb(): DbSchema {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = loadSeedData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      } catch (e) {
        console.warn("[DB] Could not write initial DB_FILE to disk, operating with in-memory state:", e);
      }
      memoryCache = initialData;
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DbSchema;
    if (!parsed.bank_risk_profiles || parsed.bank_risk_profiles.length === 0) {
      parsed.bank_risk_profiles = SEED_BANK_PROFILES;
    }
    if (!parsed.requests) parsed.requests = [];
    if (!parsed.attempts) parsed.attempts = [];
    if (!parsed.audit_log) parsed.audit_log = [];

    memoryCache = parsed;
    return parsed;
  } catch (err) {
    console.warn("[DB] Error loading DB_FILE, loading seed data:", err);
    const initialData = loadSeedData();
    memoryCache = initialData;
    return initialData;
  }
}

function saveDb(data: DbSchema): void {
  memoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn("[DB] File persistence failed or read-only (safe in serverless environments):", err);
  }
}

// Bank Profiles
export function getAllBankProfiles(): BankRiskProfile[] {
  const db = ensureDb();
  return db.bank_risk_profiles;
}

export function getBankProfile(ifscPrefix: string): BankRiskProfile | undefined {
  const db = ensureDb();
  const upper = ifscPrefix.toUpperCase();
  return db.bank_risk_profiles.find((p) => p.ifsc_prefix === upper);
}

export function updateBankProfile(
  ifscPrefix: string,
  updates: Partial<BankRiskProfile>
): BankRiskProfile | undefined {
  const db = ensureDb();
  const upper = ifscPrefix.toUpperCase();
  const index = db.bank_risk_profiles.findIndex((p) => p.ifsc_prefix === upper);
  if (index === -1) return undefined;

  const existing = db.bank_risk_profiles[index];
  const updated: BankRiskProfile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  db.bank_risk_profiles[index] = updated;
  saveDb(db);
  return updated;
}

// Payment Requests
export function createPaymentRequest(request: PaymentRequest): PaymentRequest {
  const db = ensureDb();
  db.requests.unshift(request);
  saveDb(db);
  return request;
}

export function getPaymentRequest(id: string): PaymentRequest | undefined {
  const db = ensureDb();
  return db.requests.find((r) => r.id === id);
}

export function updatePaymentRequest(
  id: string,
  updates: Partial<PaymentRequest>
): PaymentRequest | undefined {
  const db = ensureDb();
  const index = db.requests.findIndex((r) => r.id === id);
  if (index === -1) return undefined;

  const existing = db.requests[index];
  const updated: PaymentRequest = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  db.requests[index] = updated;
  saveDb(db);
  return updated;
}

export function getRecentRequests(limit: number = 20): PaymentRequest[] {
  const db = ensureDb();
  return db.requests.slice(0, limit);
}

// Rail Attempts
export function createRailAttempt(attempt: RailAttempt): RailAttempt {
  const db = ensureDb();
  db.attempts.push(attempt);
  saveDb(db);
  return attempt;
}

export function getAttemptsByRequestId(requestId: string): RailAttempt[] {
  const db = ensureDb();
  return db.attempts.filter((a) => a.request_id === requestId);
}

// Audit Log
export function createAuditEvent(event: AuditEvent): AuditEvent {
  const db = ensureDb();
  db.audit_log.push(event);
  saveDb(db);
  return event;
}

export function getAuditLogByRequestId(requestId: string): AuditEvent[] {
  const db = ensureDb();
  return db.audit_log
    .filter((e) => e.request_id === requestId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getRecentAttemptsForBank(ifscPrefix: string, limit: number = 10): RailAttempt[] {
  const db = ensureDb();
  const upper = ifscPrefix.toUpperCase();
  const matchingRequestIds = new Set(
    db.requests.filter((r) => r.ifsc.startsWith(upper)).map((r) => r.id)
  );
  return db.attempts
    .filter((a) => matchingRequestIds.has(a.request_id))
    .slice(-limit);
}

// Reset / Re-seed
export function resetDatabase(): void {
  const data: DbSchema = {
    bank_risk_profiles: SEED_BANK_PROFILES,
    requests: [],
    attempts: [],
    audit_log: [],
  };
  saveDb(data);
}
