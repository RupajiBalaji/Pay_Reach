"use client";

import React, { useState } from "react";
import { CollectionForm } from "@/components/CollectionForm";
import { BatchAnalytics } from "@/components/BatchAnalytics";
import { 
  Sparkles, 
  BarChart3, 
  ShieldCheck, 
  AlertCircle
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"agent" | "batch">("agent");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">


      {/* Main Header */}
      <header className="border-b border-slate-850 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Pay<span className="text-blue-500">Reach</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0 AI Agent
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("agent")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "agent"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Collection</span> Agent
            </button>

            <button
              onClick={() => setActiveTab("batch")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "batch"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Batch</span> Benchmark
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Problem Statement */}
      <section className="bg-gradient-to-b from-slate-900/60 to-transparent border-b border-slate-850 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              AI Payment Collection for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Card-less Bank Users</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Crores of Jan Dhan, rural, and first-time bank users in India possess an account number and IFSC but <strong>no physical debit card</strong>. Conventional "account+IFSC to QR" tools quietly fail under NPCI error <strong>U16</strong> ("Risk threshold exceeded").
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">The Problem</div>
                <div className="text-slate-400">NPCI U16 silent rejection on cardless QR generation.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">The AI Decision Layer</div>
                <div className="text-slate-400">Ranks every legitimate collection path per bank risk model.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Real Integration</div>
                <div className="text-slate-400">Razorpay Test-Mode Payment Links API (/v1/payment_links).</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "agent" && <CollectionForm />}
        {activeTab === "batch" && <BatchAnalytics />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            PayReach — Razorpay Buildathon Open Track. All mock bank rails isolated behind <code className="text-slate-400">/lib/rails/</code>.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Next.js 14 • SQLite/JSON Store • Recharts • Razorpay API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
