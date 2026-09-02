'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  Clock,
  HelpCircle,
  Package,
  ShoppingCart,
  CreditCard,
  Search,
  Sparkles,
  Bot,
  RefreshCw,
} from 'lucide-react';

interface CommerceEvent {
  id: number;
  event_id: string;
  event_type: string;
  user_id?: string;
  agent_name?: string;
  title: string;
  details?: string;
  timestamp: string;
}

interface AgentAction {
  id: number;
  action_id: string;
  timestamp: string;
  agent_name: string;
  action_type: string;
  tool_name?: string;
  input_params?: string;
  output_result?: string;
  status: string;
  decision_reason?: string;
}

export function AgentActivityTimeline() {
  const [events, setEvents] = useState<CommerceEvent[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commerce/events?limit=8');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setActions(data.actions || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 8000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT_RECOMMENDED':
        return <Sparkles className="size-3.5 text-cyan-400" />;
      case 'CART_UPDATED':
      case 'CART_CLEARED':
        return <ShoppingCart className="size-3.5 text-emerald-400" />;
      case 'PAYMENT_INTENT_CREATED':
        return <CreditCard className="size-3.5 text-amber-400" />;
      case 'PRODUCT_LOOKUP':
        return <Search className="size-3.5 text-indigo-400" />;
      default:
        return <Bot className="size-3.5 text-cyan-400" />;
    }
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live AI Agent Activity</h3>
            <p className="text-[11px] text-zinc-400">Autonomous multi-agent execution timeline</p>
          </div>
        </div>
        <button
          onClick={fetchActivity}
          disabled={loading}
          className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Events Timeline */}
      <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No recent agent events. Initiate a voice or text interaction to view live actions!
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.event_id || evt.id}
              className="flex items-start gap-2.5 rounded-lg border border-zinc-900 bg-zinc-900/40 p-2.5 transition-all duration-200 hover:border-zinc-800 hover:bg-zinc-900/70"
            >
              <div className="mt-0.5 rounded-md bg-zinc-800 p-1.5">{getEventIcon(evt.event_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200 truncate">{evt.title}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                {evt.details && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{evt.details}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 py-0 px-1.5">
                    {evt.agent_name || 'Agent'}
                  </Badge>
                  <span className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-2.5" /> Verified Action
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Explanation Highlight */}
      {actions.length > 0 && actions[0].decision_reason && (
        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
            <HelpCircle className="size-3.5 text-cyan-400" />
            <span>Why this action? (AI Decision Explanation)</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
            {actions[0].decision_reason}
          </p>
        </div>
      )}
    </Card>
  );
}
