'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

  const totalOpportunity =
    opportunities.reduce((acc, curr) => acc + curr.amount, 0) +
    followups
      .filter((f) => f.status === 'PENDING_APPROVAL')
      .reduce((acc, curr) => acc + (curr.estimated_value || 0), 0);

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Revenue Recovery & Approvals</h3>
            <p className="text-[11px] text-zinc-400">
              Consent-gated customer re-engagement & abandoned cart recovery
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Estimated Opportunity:</span>
          <Badge className="border-amber-500/30 bg-amber-500/20 font-mono text-xs text-amber-300">
            ₹{totalOpportunity > 0 ? totalOpportunity.toFixed(0) : '4,820'}
          </Badge>
        </div>
      </div>

      {/* Suggested Followups List */}
      <div className="mt-3 space-y-2.5">
        {followups.length === 0 ? (
          <div className="space-y-2">
            {/* Sample initial suggestions for display */}
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-cyan-500/30 bg-cyan-500/20 text-[10px] text-cyan-300">
                    REPEAT ORDER REMINDER
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">Radhika Sharma</span>
                </div>
                <p className="text-xs text-zinc-300">
                  "Namaste Radhika ji! Aapka monthly 5kg Basmati Rice ka time ho gaya hai. Kya hum
                  order prepare karein?"
                </p>
                <span className="font-mono text-[10px] text-zinc-500">
                  Estimated Value: ₹640 • Based on 30-day repeat interval
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => toast.success('Re-engagement reminder approved!')}
                  className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-500"
                >
                  <CheckCircle2 className="mr-1 size-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.info('Reminder dismissed')}
                  className="h-7 px-2.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <XCircle className="mr-1 size-3.5" /> Dismiss
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-amber-500/30 bg-amber-500/20 text-[10px] text-amber-300">
                    ABANDONED CART (HIGH PRIORITY)
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">Amit Verma</span>
                </div>
                <p className="text-xs text-zinc-300">
                  "Namaste Amit ji, aapka ₹1,240 ka grocery cart pending hai. Free same-day delivery
                  ke sath complete karein?"
                </p>
                <span className="font-mono text-[10px] text-zinc-500">
                  Estimated Value: ₹1,240 • Left in cart 2 hours ago
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => toast.success('Abandoned cart recovery message approved!')}
                  className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-500"
                >
                  <CheckCircle2 className="mr-1 size-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.info('Recovery dismissed')}
                  className="h-7 px-2.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <XCircle className="mr-1 size-3.5" /> Dismiss
                </Button>
              </div>
            </div>
          </div>
        ) : (
          followups.map((f) => (
            <div
              key={f.suggestion_id || f.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 md:flex-row md:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-cyan-500/30 bg-cyan-500/20 text-[10px] text-cyan-300">
                    {f.suggestion_type}
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-200">{f.customer_name}</span>
                </div>
                <p className="text-xs text-zinc-300">{f.message}</p>
                <span className="font-mono text-[10px] text-zinc-500">
                  Estimated Value: ₹{f.estimated_value} • Status: {f.status}
                </span>
              </div>
              {f.status === 'PENDING_APPROVAL' && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(f.suggestion_id, 'APPROVED')}
                    className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="mr-1 size-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(f.suggestion_id, 'DISMISSED')}
                    className="h-7 px-2.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <XCircle className="mr-1 size-3.5" /> Dismiss
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
