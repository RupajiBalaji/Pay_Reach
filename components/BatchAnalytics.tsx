"use client";

import React, { useState } from "react";
import { BatchTestSummary } from "@/lib/batch-tester";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  Play,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Zap,
  TrendingUp,
  Building2,
  ShieldCheck,
  RefreshCw,
  Info
} from "lucide-react";

interface BatchAnalyticsProps {
  initialData?: BatchTestSummary | null;
}

export function BatchAnalytics({ initialData }: BatchAnalyticsProps) {
  const [data, setData] = useState<BatchTestSummary | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [batchCount, setBatchCount] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const handleRunBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/batch-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: batchCount }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to complete batch test.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error during batch test.");
    } finally {
      setLoading(false);
    }
  };

  const chartColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

  return (
    <div className="space-y-8">
      {/* Action Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-3.5 h-3.5" />
              Empirical AI Benchmark & Adaptive Learning
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Multi-Bank Batch Simulation Engine
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Simulates card-less account holders across 18+ major Indian banks. Evaluates how the AI decision layer circumvents NPCI U16 errors and measures automated fallback efficiency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
              disabled={loading}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 Requests</option>
              <option value={50}>50 Requests</option>
              <option value={100}>100 Requests</option>
            </select>

            <button
              onClick={handleRunBatch}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Simulating Batch...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Batch Test ({batchCount})
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Success */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Overall Collection Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {data.overallSuccessRate}%
              </div>
              <p className="text-[11px] text-slate-400">
                {data.overallSuccessCount} of {data.totalProcessed} transactions succeeded
              </p>
            </div>

            {/* U16 Avoidance */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>U16 Failures Avoided</span>
                <AlertOctagon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                {data.totalU16Avoided}
              </div>
              <p className="text-[11px] text-slate-400">
                Silent switch rejections caught & rescued
              </p>
            </div>

            {/* Fallbacks Triggered */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Automated Fallbacks</span>
                <RotateCcw className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-blue-400">
                {data.totalFallbacksTriggered}
              </div>
              <p className="text-[11px] text-slate-400">
                Seamless failovers without user drop-off
              </p>
            </div>

            {/* Real Integration (Razorpay) Wins */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Razorpay Link Deliverability</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-400">
                {data.railDistribution.find((r) => r.method === "razorpay_link")?.percentage || 0}%
              </div>
              <p className="text-[11px] text-slate-400">
                {data.railDistribution.find((r) => r.method === "razorpay_link")?.count || 0} real fallback payments established
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bank-wise Success Rate Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">
                    Collection Success Rate by Bank
                  </h3>
                  <p className="text-xs text-slate-400">
                    Demonstrates resilience across both high-risk PSU banks and Private banks
                  </p>
                </div>
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.bankStats.slice(0, 10).map((b) => ({
                      name: b.ifscPrefix,
                      fullName: b.bankName,
                      rate: b.successRate,
                      total: b.total,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      interval={0}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg shadow-xl text-xs">
                              <div className="font-bold text-white mb-1">{item.fullName}</div>
                              <div className="text-blue-400">Success Rate: {item.rate}%</div>
                              <div className="text-slate-400">Sample Size: {item.total} tests</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {data.bankStats.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.successRate > 80 ? "#10b981" : entry.successRate > 60 ? "#3b82f6" : "#f59e0b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Winning Rail Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">Winning Rail Breakdown</h3>
                  <p className="text-xs text-slate-400">Which method successfully closed the transaction</p>
                </div>
                <Zap className="w-5 h-5 text-amber-400" />
              </div>

              <div className="space-y-4 pt-2">
                {data.railDistribution.map((rail) => (
                  <div key={rail.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        {rail.name}
                        {rail.isReal && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            REAL
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {rail.count} ({rail.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rail.method === "razorpay_link"
                            ? "bg-emerald-500"
                            : rail.method === "aadhaar_otp"
                            ? "bg-blue-500"
                            : rail.method === "upi_collect"
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${rail.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  Note how <span className="text-emerald-400 font-medium">Razorpay Payment Links</span> and <span className="text-blue-400 font-medium">Aadhaar-OTP</span> capture the majority of card-less users, rescuing transactions from U16 rejection.
                </p>
              </div>
            </div>
          </div>

          {/* Sample Synthetic Batch Transactions */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="font-semibold text-white text-base">
              Sample Synthetic Transactions Log (First 15)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Bank</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Winning Rail</th>
                    <th className="py-3 px-4">U16 Encountered</th>
                    <th className="py-3 px-4">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.sampleTraces.map((trace) => (
                    <tr key={trace.requestId} className="hover:bg-slate-850/50">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{trace.requestId}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{trace.bankName}</td>
                      <td className="py-2.5 px-4 font-mono">{trace.accountMasked}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trace.status === "COMPLETED" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {trace.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {trace.winningRail || "None (Exhausted)"}
                      </td>
                      <td className="py-2.5 px-4">
                        {trace.u16Hit ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            U16 Bypassed
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{trace.attemptsCount} step(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Batch Data Generated Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Click the "Run Batch Test" button above to execute a live simulation of 50 card-less bank accounts across all seeded Indian banks.
          </p>
          <button
            onClick={handleRunBatch}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Run 50-Request Benchmark
          </button>
        </div>
      )}
    </div>
  );
}
