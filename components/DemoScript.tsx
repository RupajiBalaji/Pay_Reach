"use client";

import React, { useState } from "react";
import { Mic, CheckCircle2, Copy, Check } from "lucide-react";

interface ScriptStep {
  stepNumber: number;
  cue: string;
  say: string;
  uiAction: string;
}

const DEMO_STEPS: ScriptStep[] = [
  {
    stepNumber: 1,
    cue: "The Problem Hook",
    say: '"Here\'s the problem — I hit this myself: I have an account number and IFSC but no debit card, so I can\'t generate a payment QR the normal way."',
    uiAction: "Point to the problem statement banner on the Collection Agent tab.",
  },
  {
    stepNumber: 2,
    cue: "The Hidden Failure Gap",
    say: '"Tools that do \'account+IFSC to QR\' already exist, but they silently fail — banks reject them under NPCI error U16 more and more often. That\'s the gap."',
    uiAction: "Click the \'SBI Jan Dhan (High U16 Risk)\' preset to load a card-less account with 85% U16 rejection.",
  },
  {
    stepNumber: 3,
    cue: "The AI Decision Layer",
    say: '"Instead of guessing, PayReach ranks every legitimate collection method for this specific bank, and recommends the safest one first."',
    uiAction: "Show the Pre-Ranked Strategy list showing confidence scores (e.g. 98% for Razorpay link vs 15% for Account QR).",
  },
  {
    stepNumber: 4,
    cue: "Live Fallback Execution",
    say: '"Watch this: I trigger a live request. When high-risk rails or timeouts hit, PayReach catches the error and automatically fails over in real time until funds can be collected — here generating a real Razorpay payment link."',
    uiAction: 'Click "Initiate AI Smart Collection" and watch the stepper run and generate the live payment link.',
  },
  {
    stepNumber: 5,
    cue: "Explainable Audit Trail",
    say: '"Every decision is explainable — this isn\'t a black box. Look at the audit trail: we know exactly why each rail was ranked, how long it took, and why the fallback kicked in."',
    uiAction: "Scroll through the Audit Trail stepper and expand a technical details payload.",
  },
  {
    stepNumber: 6,
    cue: "Empirical Proof at Scale",
    say: '"Across 50 synthetic accounts spanning 15+ banks, here\'s our real success rate, broken down by bank — and this risk model updates itself as more attempts come in."',
    uiAction: 'Switch to the "Batch Simulator & Analytics" tab and click "Run Batch Test (50)" to show the Recharts dashboard.',
  },
  {
    stepNumber: 7,
    cue: "The Broader Impact",
    say: '"This started as a personal pain point, but it maps directly onto Jan Dhan and rural account holders who are the most likely to be card-less and least served by existing tools."',
    uiAction: "Conclude presentation with the architecture summary.",
  },
];

export function DemoScript() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Mic className="w-3.5 h-3.5" />
          Judge Presentation Guide
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          90-Second Hackathon Demo Script
        </h3>
        <p className="text-sm text-slate-300">
          Follow these 7 precise cues during your demo presentation. Each cue aligns with a specific visual moment in the PayReach UI.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_STEPS.map((step, idx) => (
          <div
            key={step.stepNumber}
            className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-600/30">
                  {step.stepNumber}
                </span>
                <span className="text-sm font-semibold text-white tracking-wide">
                  {step.cue}
                </span>
              </div>

              <button
                onClick={() => copyText(step.say, idx)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors font-mono"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Speech
                  </>
                )}
              </button>
            </div>

            <blockquote className="text-sm text-blue-200/90 italic pl-4 border-l-2 border-blue-500/50 py-1">
              {step.say}
            </blockquote>

            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">UI Action:</span>
              <span>{step.uiAction}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
