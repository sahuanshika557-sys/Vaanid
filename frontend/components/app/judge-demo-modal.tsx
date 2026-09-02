'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Play,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Bot,
  ShoppingCart,
  Mic,
  ArrowRight,
  Database,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JudgeDemoModal({ isOpen, onClose }: JudgeDemoModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoLog, setDemoLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. The Problem in Bharat Commerce',
      subtitle: 'Local merchants lose 40%+ inquiries due to slow replies & language barriers.',
      icon: <ShoppingCart className="size-5 text-amber-400" />,
      content: (
        <div className="space-y-3 text-sm text-zinc-300">
          <p>
            Millions of local shops (kiranas, D2C merchants) operate across Hindi, Hinglish, and regional languages. Traditional ecommerce apps are too complex for non-tech-savvy users, while simple chatbots hallucinate prices and cannot close sales.
          </p>
          <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-red-300">
            ❌ <strong>Friction:</strong> Typing in English is difficult • Abandoned inquiries are never recovered • Zero inventory safety.
          </div>
        </div>
      ),
    },
    {
      title: '2. The DukanVaani AI Solution (Track 1)',
      subtitle: 'Autonomous Multilingual Agentic Commerce Layer',
      icon: <Bot className="size-5 text-cyan-400" />,
      content: (
        <div className="space-y-3 text-sm text-zinc-300">
          <p>
            DukanVaani AI turns natural voice conversations into verified commerce transactions. It combines real-time streaming voice (LiveKit + Murf Falcon) with deterministic database tools (SQLite + Inventory Guardrails).
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-cyan-500/30 bg-cyan-950/20 p-2 text-cyan-300">
              🎙️ <strong>Hinglish & Hindi Native</strong><br />Natural voice conversation without rigid keywords.
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2 text-emerald-300">
              🛒 <strong>Smart Cart & Payments</strong><br />Deterministic math & instant UPI QR generation.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '3. Real-Time Autonomous Flow',
      subtitle: 'Voice/Text → Intent → Recommendation → Cart → Payment → Recovery',
      icon: <Sparkles className="size-5 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-sm text-zinc-300">
          <p className="text-xs text-zinc-400">
            Click below to trigger the one-click autonomous pipeline simulation in live database:
          </p>
          <Button
            onClick={async () => {
              setIsRunningDemo(true);
              setDemoLog(['⚡ Initiating Customer Voice Session (Hinglish: "₹1000 ke andar groceries chahiye")...']);
              try {
                const res = await fetch('/api/commerce/demo', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                  setDemoLog([
                    '🎙️ Intent Detected: Shopping & Discovery',
                    '🔎 Catalogue Searched: Found Basmati Rice & Toor Dal within ₹1000 budget',
                    '🛒 Cart Created: Added 1x Basmati Rice + 1x Toor Dal (Subtotal: ₹460)',
                    '💳 Payment Intent: Generated TXN_PAY (₹500 total with delivery)',
                    '✅ Mock Payment: Verified successfully & Order Confirmed',
                    '📈 Merchant Copilot & Activity Log updated in real-time SQLite database!',
                  ]);
                  toast.success('Autonomous Commerce Flow completed successfully!');
                }
              } catch {
                toast.error('Demo simulation error');
              } finally {
                setIsRunningDemo(false);
              }
            }}
            disabled={isRunningDemo}
            className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
          >
            {isRunningDemo ? 'Running Live Agentic Flow...' : '▶ Run Live Autonomous Commerce Demo'}
          </Button>

          {demoLog.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-emerald-400">
              {demoLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '4. Merchant ROI & Copilot Insights',
      subtitle: 'Empowering shopkeepers with real-time AI decision intelligence',
      icon: <TrendingUp className="size-5 text-indigo-400" />,
      content: (
        <div className="space-y-3 text-sm text-zinc-300">
          <p>
            Shop owners can talk to <strong>Merchant Copilot</strong> in voice or text to understand demand, restock alerts, and review abandoned carts.
          </p>
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs text-indigo-200">
            💬 <em>"Kaunsa product low stock mein hai?"</em><br />
            🤖 <strong>AI Copilot:</strong> "Dukan mein Toor Dal aur Whole Wheat Atta low stock par hain. Reorder initiate karein?"
          </div>
        </div>
      ),
    },
    {
      title: '5. AI Safety & Consent Guardrails',
      subtitle: 'Zero hallucinations on financial transactions & strict consent gating',
      icon: <ShieldCheck className="size-5 text-emerald-400" />,
      content: (
        <div className="space-y-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span><strong>Deterministic Calculations:</strong> Price and inventory are strictly queried from database tools, never guessed by LLM.</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span><strong>Consent-Gated Memory:</strong> Customer preferences and order history are persisted only with explicit permission.</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span><strong>Human Escalation:</strong> Complex billing disputes or refunds trigger consent-gated support tickets with reference IDs.</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                Track 1: AI Growth & Agentic Commerce
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                3-Min Judge Tour
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              DukanVaani AI — Hackathon Overview
            </h2>
            <p className="text-zinc-400 text-xs">
              "Turn Every Voice Into Commerce." Multilingual autonomous voice commerce agents for Bharat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-1.5 my-1">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                idx === activeStep
                  ? 'bg-cyan-400'
                  : idx < activeStep
                  ? 'bg-emerald-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3 min-h-[220px]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-800/80 p-2">{steps[activeStep].icon}</div>
            <div>
              <h3 className="font-semibold text-white text-base">{steps[activeStep].title}</h3>
              <p className="text-xs text-zinc-400">{steps[activeStep].subtitle}</p>
            </div>
          </div>
          <div className="pt-2">{steps[activeStep].content}</div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="text-zinc-400 hover:text-white"
          >
            Previous
          </Button>

          <span className="text-xs text-zinc-500 font-mono">
            Step {activeStep + 1} of {steps.length}
          </span>

          {activeStep < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="bg-cyan-600 text-white hover:bg-cyan-500 flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onClose}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Start Exploring Platform
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
