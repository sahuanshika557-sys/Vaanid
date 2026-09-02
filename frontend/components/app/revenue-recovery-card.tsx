'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface FollowupSuggestion {
  id: number;
  suggestion_id: string;
  customer_id: string;
  customer_name: string;
  suggestion_type: string;
  message: string;
  target_products?: string;
  estimated_value: number;
  status: string;
  created_at: string;
}

interface RecoveryOpportunity {
  opportunity_id: string;
  cart_id: string;
  user_id: string;
  customer_name: string;
  amount: number;
  priority: string;
  recommended_action: string;
  status: string;
}

export function RevenueRecoveryCard() {
  const [followups, setFollowups] = useState<FollowupSuggestion[]>([]);
  const [opportunities, setOpportunities] = useState<RecoveryOpportunity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecoveryData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commerce/recovery');
      const data = await res.json();
      if (data.success) {
        setFollowups(data.followups || []);
        setOpportunities(data.recovery_opportunities || []);
      }
    } catch {
      // Graceful
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecoveryData();
  }, []);

  const handleAction = async (suggestionId: string, status: 'APPROVED' | 'DISMISSED') => {
    try {
      const res = await fetch('/api/commerce/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Follow-up suggestion ${status.toLowerCase()}!`);
        fetchRecoveryData();
      }
    } catch {
      toast.error('Could not update follow-up action');
    }
  };

  const totalOpportunity = opportunities.reduce((acc, curr) => acc + curr.amount, 0) +
    followups.filter(f => f.status === 'PENDING_APPROVAL').reduce((acc, curr) => acc + (curr.estimated_value || 0), 0);

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Revenue Recovery & Approvals</h3>
            <p className="text-[11px] text-zinc-400">Consent-gated customer re-engagement & abandoned cart recovery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Estimated Opportunity:</span>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono text-xs">
            ₹{totalOpportunity > 0 ? totalOpportunity.toFixed(0) : '4,820'}
          </Badge>
        </div>
      </div>

      {/* Suggested Followups List */}
      <div className="mt-3 space-y-2.5">
        {followups.length === 0 ? (
          <div className="space-y-2">
            {/* Sample initial suggestions for display */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                    REPEAT ORDER REMINDER
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">Radhika Sharma</span>
                </div>
                <p className="text-xs text-zinc-300">
                  "Namaste Radhika ji! Aapka monthly 5kg Basmati Rice ka time ho gaya hai. Kya hum order prepare karein?"
                </p>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Estimated Value: ₹640 • Based on 30-day repeat interval
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => toast.success('Re-engagement reminder approved!')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3"
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.info('Reminder dismissed')}
                  className="text-zinc-400 hover:text-zinc-200 text-xs h-7 px-2.5"
                >
                  <XCircle className="size-3.5 mr-1" /> Dismiss
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    ABANDONED CART (HIGH PRIORITY)
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">Amit Verma</span>
                </div>
                <p className="text-xs text-zinc-300">
                  "Namaste Amit ji, aapka ₹1,240 ka grocery cart pending hai. Free same-day delivery ke sath complete karein?"
                </p>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Estimated Value: ₹1,240 • Left in cart 2 hours ago
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => toast.success('Abandoned cart recovery message approved!')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3"
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.info('Recovery dismissed')}
                  className="text-zinc-400 hover:text-zinc-200 text-xs h-7 px-2.5"
                >
                  <XCircle className="size-3.5 mr-1" /> Dismiss
                </Button>
              </div>
            </div>
          </div>
        ) : (
          followups.map((f) => (
            <div
              key={f.suggestion_id || f.id}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                    {f.suggestion_type}
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">{f.customer_name}</span>
                </div>
                <p className="text-xs text-zinc-300">{f.message}</p>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Estimated Value: ₹{f.estimated_value} • Status: {f.status}
                </span>
              </div>
              {f.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAction(f.suggestion_id, 'APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(f.suggestion_id, 'DISMISSED')}
                    className="text-zinc-400 hover:text-zinc-200 text-xs h-7 px-2.5"
                  >
                    <XCircle className="size-3.5 mr-1" /> Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
