export type RailMethod = 
  | "aadhaar_otp"
  | "upi_collect"
  | "razorpay_link"
  | "account_ifsc_qr";

export type RailStatus = "PENDING" | "EXECUTING" | "SUCCESS" | "FAILED" | "SKIPPED";

export interface BankRiskProfile {
  ifsc_prefix: string;
  bank_name: string;
  bank_type: "PSU" | "PRIVATE" | "PAYMENT_BANK" | "RRB";
  u16_risk_score: number; // 0.0 - 1.0 (higher means higher probability of U16 rejection)
  aadhaar_otp_supported: boolean;
  aadhaar_otp_success_rate: number; // 0.0 - 1.0
  upi_collect_success_rate: number; // 0.0 - 1.0
  payment_link_success_rate: number; // 0.0 - 1.0
  total_attempts: number;
  successful_attempts: number;
  account_digits_min: number;
  account_digits_max: number;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  account_number: string;
  ifsc: string;
  phone_number: string;
  amount: number;
  customer_name?: string;
  note?: string;
  bank_name?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  winning_rail?: RailMethod;
  created_at: string;
  updated_at: string;
}

export interface RailRanking {
  method: RailMethod;
  name: string;
  confidence_score: number; // 0 - 100%
  recommended_rank: number;
  is_real: boolean;
  reason: string;
  risk_level: "LOW" | "MODERATE" | "HIGH";
  warning?: string;
  engine_source?: "ai_reasoned" | "rule_based";
}

export interface RailAttempt {
  id: string;
  request_id: string;
  rail_method: RailMethod;
  rank_position: number;
  status: RailStatus;
  is_real: boolean;
  attempt_timestamp: string;
  latency_ms: number;
  response_payload?: Record<string, unknown> | null;
  error_code?: string | null;
  error_message?: string | null;
}

export interface AuditEvent {
  id: string;
  request_id: string;
  stage: "VALIDATION" | "RANKING" | "EXECUTION_ATTEMPT" | "EXECUTION_RESULT" | "FALLBACK_TRIGGERED" | "FINAL_OUTCOME" | "MODEL_UPDATE";
  rail_method?: RailMethod | null;
  title: string;
  details: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export interface RailExecutionResult {
  method: RailMethod;
  success: boolean;
  isReal: boolean;
  title: string;
  message: string;
  errorCode?: string;
  data?: {
    paymentUrl?: string;
    qrString?: string;
    qrImageUrl?: string;
    vpa?: string;
    referenceId?: string;
    expiresAt?: string;
    [key: string]: unknown;
  };
}

export interface ValidationResult {
  isValid: boolean;
  ifsc: {
    valid: boolean;
    prefix?: string;
    bankName?: string;
    message?: string;
  };
  accountNumber: {
    valid: boolean;
    length?: number;
    expectedRange?: [number, number];
    message?: string;
  };
  phoneNumber: {
    valid: boolean;
    message?: string;
  };
  amount: {
    valid: boolean;
    message?: string;
  };
  errors: string[];
}
