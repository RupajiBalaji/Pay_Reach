import {
  createPaymentRequest,
  updatePaymentRequest,
  createRailAttempt,
  createAuditEvent,
  getBankProfile,
  updateBankProfile,
} from "./db";
import { evaluateDecision } from "./decision-engine";
import { attemptRail } from "./rails";
import {
  AuditEvent,
  BankRiskProfile,
  PaymentRequest,
  RailAttempt,
  RailExecutionResult,
  RailMethod,
} from "./types";
import { validatePaymentInput } from "./validation";

export interface ExecutionTrace {
  request: PaymentRequest;
  bankProfile: BankRiskProfile;
  attempts: RailAttempt[];
  auditTrail: AuditEvent[];
  winningResult?: RailExecutionResult;
  isSuccess: boolean;
  totalLatencyMs: number;
}

export async function executePaymentCollection(params: {
  accountNumber: string;
  ifsc: string;
  phoneNumber: string;
  amount: number;
  customerName?: string;
  note?: string;
}): Promise<ExecutionTrace> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Validation
  const validation = validatePaymentInput(params);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  const prefix = params.ifsc.substring(0, 4).toUpperCase();
  const initialProfile = getBankProfile(prefix) || {
    ifsc_prefix: prefix,
    bank_name: `${prefix} Bank`,
    bank_type: "PSU" as const,
    u16_risk_score: 0.75,
    aadhaar_otp_supported: true,
    aadhaar_otp_success_rate: 0.70,
    upi_collect_success_rate: 0.75,
    payment_link_success_rate: 0.96,
    total_attempts: 0,
    successful_attempts: 0,
    account_digits_min: 9,
    account_digits_max: 18,
    updated_at: new Date().toISOString(),
  };

  // 2. Create Payment Request Record
  const newRequest: PaymentRequest = {
    id: requestId,
    account_number: params.accountNumber,
    ifsc: params.ifsc.toUpperCase(),
    phone_number: params.phoneNumber,
    amount: Number(params.amount),
    customer_name: params.customerName || "Customer",
    note: params.note || "Collection",
    bank_name: initialProfile.bank_name,
    status: "PROCESSING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  createPaymentRequest(newRequest);

  // Log validation audit event
  createAuditEvent({
    id: `aud_${Date.now()}_1`,
    request_id: requestId,
    stage: "VALIDATION",
    title: "Input & Bank Identification Verified",
    details: `IFSC ${params.ifsc} mapped to ${initialProfile.bank_name} (${initialProfile.bank_type}). Account length and phone number verified.`,
    metadata: { validation },
    timestamp: new Date().toISOString(),
  });

  // 3. AI Decision Engine: Rank Collection Methods
  const decision = evaluateDecision({
    accountNumber: params.accountNumber,
    ifsc: params.ifsc,
    phoneNumber: params.phoneNumber,
    amount: params.amount,
  });

  createAuditEvent({
    id: `aud_${Date.now()}_2`,
    request_id: requestId,
    stage: "RANKING",
    title: "AI Decision Engine Evaluated Rails",
    details: `Ranked 4 available payment rails based on learned historical risk for ${initialProfile.bank_name}. Top recommendation: ${decision.topRecommendation.name} (${decision.topRecommendation.confidence_score}% confidence).`,
    metadata: { rankings: decision.rankings },
    timestamp: new Date().toISOString(),
  });

  const attempts: RailAttempt[] = [];
  const auditTrail: AuditEvent[] = [];
  let winningResult: RailExecutionResult | undefined = undefined;
  let isSuccess = false;

  // 4. Cascade execution across ranked rails
  for (let i = 0; i < decision.rankings.length; i++) {
    const ranking = decision.rankings[i];
    const railMethod: RailMethod = ranking.method;
    const attemptStartTime = Date.now();

    createAuditEvent({
      id: `aud_${Date.now()}_att_${i}`,
      request_id: requestId,
      stage: "EXECUTION_ATTEMPT",
      rail_method: railMethod,
      title: `Executing Rank #${ranking.recommended_rank}: ${ranking.name}`,
      details: `Attempting ${ranking.name} (${ranking.is_real ? "REAL INTEGRATION" : "SIMULATED RAIL"}). Confidence: ${ranking.confidence_score}%. Reason: ${ranking.reason}`,
      timestamp: new Date().toISOString(),
    });

    // Execute rail attempt
    const result = await attemptRail(railMethod, newRequest, initialProfile);
    const attemptLatency = Date.now() - attemptStartTime;

    const attemptRecord: RailAttempt = {
      id: `att_${Date.now()}_${i}`,
      request_id: requestId,
      rail_method: railMethod,
      rank_position: ranking.recommended_rank,
      status: result.success ? "SUCCESS" : "FAILED",
      is_real: result.isReal,
      attempt_timestamp: new Date().toISOString(),
      latency_ms: attemptLatency,
      response_payload: result.data || null,
      error_code: result.errorCode || null,
      error_message: result.success ? null : result.message,
    };
    createRailAttempt(attemptRecord);
    attempts.push(attemptRecord);

    createAuditEvent({
      id: `aud_${Date.now()}_res_${i}`,
      request_id: requestId,
      stage: "EXECUTION_RESULT",
      rail_method: railMethod,
      title: `${ranking.name} ${result.success ? "Succeeded" : "Failed"}`,
      details: result.message,
      metadata: {
        success: result.success,
        errorCode: result.errorCode,
        latencyMs: attemptLatency,
        isReal: result.isReal,
      },
      timestamp: new Date().toISOString(),
    });

    // Adaptive Learning update on Bank Profile
    const outcomeVal = result.success ? 1.0 : 0.0;
    const updatedAttempts = initialProfile.total_attempts + 1;
    const updatedSuccess = initialProfile.successful_attempts + (result.success ? 1 : 0);

    const profileUpdates: Partial<BankRiskProfile> = {
      total_attempts: updatedAttempts,
      successful_attempts: updatedSuccess,
    };

    if (railMethod === "account_ifsc_qr") {
      // If QR failed under U16, slightly raise U16 risk; if succeeded, slightly lower
      const currentRisk = initialProfile.u16_risk_score;
      const newRisk = result.success
        ? Math.max(0.1, currentRisk * 0.95)
        : Math.min(0.98, currentRisk * 0.9 + 0.1);
      profileUpdates.u16_risk_score = parseFloat(newRisk.toFixed(3));
    } else if (railMethod === "aadhaar_otp") {
      const currentRate = initialProfile.aadhaar_otp_success_rate;
      profileUpdates.aadhaar_otp_success_rate = parseFloat(
        (currentRate * 0.8 + outcomeVal * 0.2).toFixed(3)
      );
    } else if (railMethod === "upi_collect") {
      const currentRate = initialProfile.upi_collect_success_rate;
      profileUpdates.upi_collect_success_rate = parseFloat(
        (currentRate * 0.8 + outcomeVal * 0.2).toFixed(3)
      );
    }

    updateBankProfile(prefix, profileUpdates);

    createAuditEvent({
      id: `aud_${Date.now()}_mod_${i}`,
      request_id: requestId,
      stage: "MODEL_UPDATE",
      rail_method: railMethod,
      title: "Bank Risk Model Updated (Bayesian Step)",
      details: `Incorporated outcome (${result.success ? "SUCCESS" : "FAILURE"}) into ${initialProfile.bank_name} risk model. Updated sample size: ${updatedAttempts}.`,
      metadata: profileUpdates,
      timestamp: new Date().toISOString(),
    });

    if (result.success) {
      winningResult = result;
      isSuccess = true;

      updatePaymentRequest(requestId, {
        status: "COMPLETED",
        winning_rail: railMethod,
      });

      createAuditEvent({
        id: `aud_${Date.now()}_win`,
        request_id: requestId,
        stage: "FINAL_OUTCOME",
        rail_method: railMethod,
        title: "Payment Collection Route Established",
        details: `Successfully established collection rail via ${ranking.name}. Total pipeline time: ${Date.now() - startTime}ms.`,
        timestamp: new Date().toISOString(),
      });
      break;
    } else {
      // Check if there is a next rail to fallback to
      const nextRanking = decision.rankings[i + 1];
      if (nextRanking) {
        createAuditEvent({
          id: `aud_${Date.now()}_fall_${i}`,
          request_id: requestId,
          stage: "FALLBACK_TRIGGERED",
          rail_method: railMethod,
          title: `Automated Fallback Triggered: Moving to Rank #${nextRanking.recommended_rank}`,
          details: `${ranking.name} failed with ${result.errorCode || "error"}. AI engine automatically failing over to ${nextRanking.name} (${nextRanking.confidence_score}% confidence).`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  if (!isSuccess) {
    updatePaymentRequest(requestId, {
      status: "FAILED",
    });

    createAuditEvent({
      id: `aud_${Date.now()}_fail_all`,
      request_id: requestId,
      stage: "FINAL_OUTCOME",
      title: "All Collection Rails Exhausted",
      details: "All available collection methods for this bank could not be completed. Customer intervention advised.",
      timestamp: new Date().toISOString(),
    });
  }

  // Fetch updated request and bank profile
  const updatedReq = { ...newRequest, status: isSuccess ? ("COMPLETED" as const) : ("FAILED" as const), winning_rail: winningResult?.method };
  const finalProfile = getBankProfile(prefix) || initialProfile;

  return {
    request: updatedReq,
    bankProfile: finalProfile,
    attempts,
    auditTrail,
    winningResult,
    isSuccess,
    totalLatencyMs: Date.now() - startTime,
  };
}
