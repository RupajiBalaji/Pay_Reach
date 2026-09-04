"use client";

import React, { useState, useEffect } from "react";
import { ValidationResult, RailRanking, BankRiskProfile, RailExecutionResult, AuditEvent, RailAttempt } from "@/lib/types";
import { 
  Building2, 
  CreditCard, 
  Phone, 
  IndianRupee, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  ExternalLink,
  Loader2,
  ChevronRight,
  Info
} from "lucide-react";
import { AuditTrail } from "./AuditTrail";

interface PresetAccount {
  label: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  phone: string;
  amount: number;
  highlight: string;
}

const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    label: "SBI Jan Dhan (High U16 Risk)",
    bankName: "State Bank of India",
    accountNumber: "38920194821",
    ifsc: "SBIN0001234",
    phone: "9876543210",
    amount: 500,
    highlight: "85% U16 rejection on QR -> forces smart fallback",
  },
  {
    label: "PNB Rural Account",
    bankName: "Punjab National Bank",
    accountNumber: "1234567890123456",
    ifsc: "PUNB0123456",
    phone: "9123456780",
    amount: 750,
    highlight: "88% U16 rejection on QR -> Aadhaar OTP / Razorpay win",
  },
  {
    label: "HDFC First-Time User",
    bankName: "HDFC Bank",
    accountNumber: "50100439281723",
    ifsc: "HDFC0000001",
    phone: "9988776655",
    amount: 1200,
    highlight: "Moderate risk -> multi-rail resilience",
  },
  {
    label: "Canara Bank Cardless",
    bankName: "Canara Bank",
    accountNumber: "0123456789012",
    ifsc: "CNRB0001234",
    phone: "9765432109",
    amount: 400,
    highlight: "PSU bank with high Aadhaar-OTP availability",
  }
];

export function CollectionForm() {
  const [accountNumber, setAccountNumber] = useState("38920194821");
  const [ifsc, setIfsc] = useState("SBIN0001234");
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [amount, setAmount] = useState<number | string>(500);
  const [customerName, setCustomerName] = useState("Ramesh Kumar");

  // Validation State
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [bankProfile, setBankProfile] = useState<BankRiskProfile | null>(null);

  // Decision State
  const [rankings, setRankings] = useState<RailRanking[]>([]);
  const [decisionSummary, setDecisionSummary] = useState<string>("");

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    attempts: RailAttempt[];
    auditTrail: AuditEvent[];
    winningResult?: RailExecutionResult;
    isSuccess: boolean;
    totalLatencyMs: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate and evaluate decision on input change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!ifsc || ifsc.length < 4) return;

      try {
        const valRes = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber, ifsc, phoneNumber, amount }),
        });
        const valData = await valRes.json();
        setValidation(valData.validation);
        setBankProfile(valData.bankProfile);

        if (valData.validation?.ifsc?.valid) {
          const decRes = await fetch("/api/decision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountNumber, ifsc, phoneNumber, amount }),
          });
          const decData = await decRes.json();
          if (decData.success) {
            setRankings(decData.data.rankings);
            setDecisionSummary(decData.data.explanationSummary);
          }
        }
      } catch (err) {
        console.error("Live validation error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [accountNumber, ifsc, phoneNumber, amount]);

  const handleApplyPreset = (preset: PresetAccount) => {
    setAccountNumber(preset.accountNumber);
    setIfsc(preset.ifsc);
    setPhoneNumber(preset.phone);
    setAmount(preset.amount);
    setExecutionResult(null);
    setErrorMessage(null);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/collect/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber,
          ifsc,
          phoneNumber,
          amount: Number(amount),
          customerName,
          note: "PayReach collection demo",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionResult({
          attempts: data.data.attempts,
          auditTrail: data.data.auditTrail,
          winningResult: data.data.winningResult,
          isSuccess: data.data.isSuccess,
          totalLatencyMs: data.data.totalLatencyMs,
        });
      } else {
        setErrorMessage(data.error || "Failed to execute payment collection.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error during collection");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Preset Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Demo Presets (Test High U16 Risk vs Resilient Banks)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_ACCOUNTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`p-3 rounded-xl text-left border transition-all ${
                ifsc === p.ifsc
                  ? "bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="font-semibold text-xs text-white truncate">{p.label}</div>
              <div className="text-[11px] text-blue-400 font-mono mt-0.5">{p.ifsc}</div>
              <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.highlight}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleExecute}
            className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5"
          >
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Card-less Collection Request
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter card-less bank details. PayReach's decision agent handles validation and rail ranking automatically.
              </p>
            </div>

            {/* IFSC Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>IFSC Code</span>
                {validation?.ifsc.valid && (
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bankProfile?.bank_name}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  required
                />
              </div>
              {validation && !validation.ifsc.valid && (
                <p className="text-[11px] text-rose-400">{validation.ifsc.message}</p>
              )}
            </div>

            {/* Account Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Bank Account Number</span>
                {bankProfile && (
                  <span className="text-slate-400 text-[11px]">
                    Expected: {bankProfile.account_digits_min === bankProfile.account_digits_max 
                      ? `${bankProfile.account_digits_min} digits` 
                      : `${bankProfile.account_digits_min}-${bankProfile.account_digits_max} digits`}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 38920194821"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {validation && !validation.accountNumber.valid && (
                <p className="text-[11px] text-rose-400">{validation.accountNumber.message}</p>
              )}
            </div>

            {/* Phone & Amount Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  min={1}
                  max={100000}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Bank Risk Snapshot */}
            {bankProfile && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {bankProfile.bank_name} Risk Profile
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {bankProfile.bank_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>U16 QR Risk:</span>
                    <span className={bankProfile.u16_risk_score >= 0.7 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {Math.round(bankProfile.u16_risk_score * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Aadhaar Ready:</span>
                    <span className={bankProfile.aadhaar_otp_supported ? "text-emerald-400" : "text-rose-400"}>
                      {bankProfile.aadhaar_otp_supported ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isExecuting || !validation?.isValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing AI Decision & Fallback...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Initiate AI Smart Collection
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Pre-Execution Decision Ranking OR Post-Execution Audit Trail (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Post-execution Audit Trail */}
          {executionResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Explainable Decision Audit Trail
                </h3>
                <button
                  onClick={() => setExecutionResult(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  View Pre-Rank Strategy
                </button>
              </div>

              <AuditTrail
                auditTrail={executionResult.auditTrail}
                attempts={executionResult.attempts}
                winningResult={executionResult.winningResult}
                isSuccess={executionResult.isSuccess}
                totalLatencyMs={executionResult.totalLatencyMs}
              />
            </div>
          ) : (
            /* Pre-execution Ranked Decision Preview */
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Decision Engine: Pre-Ranked Strategy
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Active Risk Model
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  PayReach scores every collection rail based on stored bank failure profiles, ordering them before execution starts.
                </p>
              </div>

              {rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((rail) => (
                    <div
                      key={rail.method}
                      className={`p-4 rounded-xl border transition-all ${
                        rail.recommended_rank === 1
                          ? "bg-blue-950/20 border-blue-500/40"
                          : "bg-slate-950/60 border-slate-850"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              rail.recommended_rank === 1
                                ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {rail.recommended_rank}
                          </span>

                          <span className="font-semibold text-sm text-white">{rail.name}</span>

                          {rail.is_real ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              REAL RAZORPAY API
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              SIMULATED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Predicted Success:</span>
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              rail.confidence_score >= 80
                                ? "bg-emerald-500/10 text-emerald-400"
                                : rail.confidence_score >= 50
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {rail.confidence_score}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {rail.reason}
                      </p>

                      {rail.warning && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{rail.warning}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      Click <strong className="text-white">"Initiate AI Smart Collection"</strong> to watch the agent attempt Rank #1, automatically catch any NPCI U16 rejections, and fall back sequentially until funds are secured.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-850 text-slate-500 text-xs">
                  Enter valid account number and IFSC to calculate decision ranking.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
