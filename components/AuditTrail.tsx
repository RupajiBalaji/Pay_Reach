"use client";

import React, { useState } from "react";
import { AuditEvent, RailAttempt, RailExecutionResult } from "@/lib/types";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  QrCode,
  Zap,
  RotateCcw
} from "lucide-react";

interface AuditTrailProps {
  auditTrail: AuditEvent[];
  attempts: RailAttempt[];
  winningResult?: RailExecutionResult;
  isSuccess: boolean;
  totalLatencyMs?: number;
}

export function AuditTrail({
  auditTrail,
  attempts,
  winningResult,
  isSuccess,
  totalLatencyMs,
}: AuditTrailProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStageIcon = (stage: AuditEvent["stage"], railMethod?: string | null) => {
    switch (stage) {
      case "VALIDATION":
        return <ShieldCheck className="w-5 h-5 text-blue-400" />;
      case "RANKING":
        return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      case "EXECUTION_ATTEMPT":
        return <Zap className="w-5 h-5 text-amber-400" />;
      case "EXECUTION_RESULT":
        return <Clock className="w-5 h-5 text-cyan-400" />;
      case "FALLBACK_TRIGGERED":
        return <RotateCcw className="w-5 h-5 text-orange-400" />;
      case "MODEL_UPDATE":
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case "FINAL_OUTCOME":
        return isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-400" />
        );
      default:
        return <ArrowRight className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStageBadge = (stage: AuditEvent["stage"]) => {
    switch (stage) {
      case "VALIDATION":
        return "bg-blue-950/60 text-blue-300 border-blue-800/40";
      case "RANKING":
        return "bg-purple-950/60 text-purple-300 border-purple-800/40";
      case "EXECUTION_ATTEMPT":
        return "bg-amber-950/60 text-amber-300 border-amber-800/40";
      case "EXECUTION_RESULT":
        return "bg-cyan-950/60 text-cyan-300 border-cyan-800/40";
      case "FALLBACK_TRIGGERED":
        return "bg-orange-950/60 text-orange-300 border-orange-800/40";
      case "MODEL_UPDATE":
        return "bg-indigo-950/60 text-indigo-300 border-indigo-800/40";
      case "FINAL_OUTCOME":
        return isSuccess
          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
          : "bg-rose-950/60 text-rose-300 border-rose-800/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className={`p-4 rounded-xl border ${
        isSuccess 
          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200" 
          : "bg-rose-950/20 border-rose-500/30 text-rose-200"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">
                {isSuccess ? "Payment Collection Established" : "Collection Route Exhausted"}
              </h3>
              <p className="text-sm opacity-90">
                {isSuccess && winningResult 
                  ? `Winning Rail: ${winningResult.title} (${winningResult.isReal ? "REAL Razorpay Gateway" : "Simulated Rail"})`
                  : "All ranked paths failed bank risk clearance."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {totalLatencyMs !== undefined && (
              <span className="px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-slate-300">
                Execution: {totalLatencyMs}ms
              </span>
            )}
            <span className="px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-slate-300">
              Attempts: {attempts.length}
            </span>
          </div>
        </div>

        {/* Winning result call-to-action */}
        {isSuccess && winningResult?.data && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center gap-4">
            {winningResult.data.paymentUrl && (
              <a
                href={winningResult.data.paymentUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all shadow-lg shadow-blue-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                Open Live Razorpay Test Link
              </a>
            )}

            {winningResult.data.qrImageUrl && (
              <div className="flex items-center gap-3 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <img
                  src={winningResult.data.qrImageUrl as string}
                  alt="UPI QR Code"
                  className="w-16 h-16 rounded bg-white p-1"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">UPI QR Code</div>
                  <div className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                    {winningResult.data.vpa as string}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vertical Timeline Stepper */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {auditTrail.map((event, index) => {
          const isExpanded = expandedItems[event.id] || false;
          const attemptMatch = attempts.find((a) => a.rail_method === event.rail_method);

          return (
            <div key={event.id || index} className="relative group">
              {/* Stepper Node Icon */}
              <div className="absolute -left-6 sm:-left-8 top-1 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border border-slate-700 shadow-md group-hover:border-blue-500 transition-colors">
                {getStageIcon(event.stage, event.rail_method)}
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getStageBadge(event.stage)}`}>
                      {event.stage.replace(/_/g, " ")}
                    </span>

                    {event.rail_method && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        event.rail_method === "razorpay_link"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}>
                        {event.rail_method === "razorpay_link" ? "REAL GATEWAY" : "SIMULATED RAIL"}
                      </span>
                    )}

                    {event.stage === "RANKING" && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${
                        event.metadata?.isAiReasoned
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {event.metadata?.isAiReasoned ? "AI-reasoned" : "Rule-based fallback"}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <h4 className="font-semibold text-white text-sm sm:text-base mt-1">
                  {event.title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {event.details}
                </p>

                {/* Optional Metadata view */}
                {event.metadata && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleExpand(event.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide Technical Details" : "Inspect Decision Payload"}
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-850 max-h-56">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
