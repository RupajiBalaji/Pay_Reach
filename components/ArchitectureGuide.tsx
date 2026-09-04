"use client";

import React from "react";
import { ShieldCheck, Cpu, Database, Network, ArrowDown, Layers, Terminal } from "lucide-react";

export function ArchitectureGuide() {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          PayReach Architecture & Component Isolation
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          PayReach is built with strict boundary segregation between the <strong className="text-emerald-400">real payment gateway integration</strong> (Razorpay Test-Mode Payment Links API) and <strong className="text-purple-400">simulated bank payment rails</strong> (Aadhaar-OTP, UPI Collect, Account+IFSC QR). All simulated components implement a shared <code className="text-blue-300 font-mono text-xs">RailAdapter</code> interface in <code className="text-blue-300 font-mono text-xs">/lib/rails/</code> so production bank APIs can be plugged in without modifying the AI decision layer.
        </p>

        {/* ASCII Flow Diagram */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre className="leading-snug">{`User Input (Account No, IFSC, Phone, Amount)
       │
       ▼
┌─────────────────────────────────┐
│ 1. Validation Layer             │  → Regex IFSC format, Bank directory lookup,
└─────────────────────────────────┘     Account digit sanity per bank
       │
       ▼
┌─────────────────────────────────┐
│ 2. AI Decision Engine           │  → Ranks rails based on learned historical
│    (Bank Risk Profile Model)    │     success rates & U16 rejection score
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 3. Automated Rail Execution     │
│    • Aadhaar-OTP UPI            │  (SIMULATED — weighted by bank readiness)
│    • UPI Collect Push           │  (SIMULATED — weighted by PSP acceptance)
│    • Razorpay Payment Link      │  (REAL — Razorpay Test Mode API /v1/payment_links)
│    • Account+IFSC QR            │  (SIMULATED — high risk NPCI U16 rejection)
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 4. Explainable Audit Logger     │  → Logs every decision, attempt, & failure reason
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 5. Bayesian Model Update        │  → P(success) updated: old * 0.8 + outcome * 0.2
└─────────────────────────────────┘`}</pre>
        </div>
      </div>

      {/* Real vs Simulated Matrix Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Real vs. Simulated Isolation Matrix
        </h3>
        <p className="text-xs text-slate-400">
          Clear, honest disclosure of real production-grade integrations versus mock bank rails.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Production Swap Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="hover:bg-slate-850/40">
                <td className="py-3 px-4 font-semibold text-white">Razorpay Payment Links</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    REAL INTEGRATION
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">/lib/rails/razorpay.ts</td>
                <td className="py-3 px-4 text-slate-300">
                  Fully operational live call to <code className="text-blue-400">/v1/payment_links</code> via Basic Auth.
                </td>
              </tr>
              <tr className="hover:bg-slate-850/40">
                <td className="py-3 px-4 font-semibold text-white">Aadhaar-OTP UPI Activation</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    SIMULATED
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">/lib/rails/aadhaar-otp.ts</td>
                <td className="py-3 px-4 text-slate-300">
                  Implements <code className="text-blue-400">RailAdapter</code>; ready to swap with NPCI direct set-pin spec.
                </td>
              </tr>
              <tr className="hover:bg-slate-850/40">
                <td className="py-3 px-4 font-semibold text-white">UPI Collect Request</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    SIMULATED
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">/lib/rails/upi-collect.ts</td>
                <td className="py-3 px-4 text-slate-300">
                  Can be swapped with bank PSP intent or Razorpay UPI Collect API.
                </td>
              </tr>
              <tr className="hover:bg-slate-850/40">
                <td className="py-3 px-4 font-semibold text-white">Account+IFSC QR Generator</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    SIMULATED
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">/lib/rails/account-ifsc-qr.ts</td>
                <td className="py-3 px-4 text-slate-300">
                  Generates real UPI QR URI; bank switch U16 rejection is modeled realistically.
                </td>
              </tr>
              <tr className="hover:bg-slate-850/40">
                <td className="py-3 px-4 font-semibold text-white">AI Decision Engine & Risk Model</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    LIVE LOGIC
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">/lib/decision-engine.ts</td>
                <td className="py-3 px-4 text-slate-300">
                  Reads real persisted bank profiles, ranks rails dynamically, and updates via Bayesian learning.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
