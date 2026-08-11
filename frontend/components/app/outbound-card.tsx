'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/shadcn/utils';

export type OutboundCallState =
  | 'READY'
  | 'DIALING'
  | 'RINGING'
  | 'CONNECTED'
  | 'SPEAKING'
  | 'CALL_ENDED'
  | 'FAILED';

interface OutboundCardProps {
  className?: string;
}

export function OutboundCard({ className }: OutboundCardProps) {
  const [callState, setCallState] = useState<OutboundCallState>('READY');
  const [destination, setDestination] = useState<string>('ramesh');
  const simulatedOrder = {
    id: 'ORD_RAMESH_101',
    product: 'Basmati Rice (2x)',
    status: 'PENDING',
    total: '₹640.00',
  };

  const getStatusBadge = (state: OutboundCallState) => {
    switch (state) {
      case 'READY':
        return {
          label: 'Ready to call',
          color:
            'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer',
        };
      case 'DIALING':
        return {
          label: 'Calling...',
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse cursor-pointer',
        };
      case 'RINGING':
        return {
          label: 'Ringing...',
          color: 'bg-sky-500/10 text-sky-500 border-sky-500/30 animate-bounce cursor-pointer',
        };
      case 'CONNECTED':
        return {
          label: 'Connected',
          color: 'bg-teal-500/10 text-teal-500 border-teal-500/30 cursor-pointer',
        };
      case 'SPEAKING':
        return {
          label: 'Agent speaking',
          color:
            'bg-indigo-500/10 text-indigo-500 border-indigo-500/30 animate-pulse cursor-pointer',
        };
      case 'CALL_ENDED':
        return {
          label: 'Call ended',
          color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30 cursor-pointer',
        };
      case 'FAILED':
        return {
          label: 'Unable to connect',
          color: 'bg-rose-500/10 text-rose-500 border-rose-500/30 cursor-pointer',
        };
    }
  };

  const handleSimulateOutboundFlow = () => {
    if (
      callState === 'DIALING' ||
      callState === 'RINGING' ||
      callState === 'CONNECTED' ||
      callState === 'SPEAKING'
    ) {
      setCallState('CALL_ENDED');
      return;
    }

    setCallState('DIALING');
    setTimeout(() => setCallState('RINGING'), 1500);
    setTimeout(() => setCallState('CONNECTED'), 3500);
    setTimeout(() => setCallState('SPEAKING'), 5000);
  };

  const statusInfo = getStatusBadge(callState);

  return (
    <div
      className={cn(
        'border-border/60 bg-card/80 relative w-full overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 sm:p-8',
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-teal-500 via-emerald-400 to-cyan-500" />

      <div className="flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0L19.5 4.5M9.75 14.25v4.5m0-4.5H5.25m4.5 0L4.5 19.5"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-foreground text-lg font-bold tracking-tight">
                Outbound SIP Telephony
              </h3>
              <p className="text-muted-foreground text-xs">
                LiveKit SIP Trunk + Linphone Order Status Call
              </p>
            </div>
          </div>

          <div
            onClick={handleSimulateOutboundFlow}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulateOutboundFlow()}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-300',
              statusInfo.color
            )}
          >
            <span className="size-2 animate-ping rounded-full bg-current" />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Verified Order Info Panel */}
        <div className="border-border/40 bg-muted/20 space-y-2 rounded-2xl border p-4 text-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-foreground font-medium">Verified Order Status (SQLite DB)</span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              {simulatedOrder.id}
            </span>
          </div>
          <div className="text-muted-foreground grid grid-cols-2 gap-2 pt-1">
            <div>
              Customer: <strong className="text-foreground font-semibold">Ramesh</strong>
            </div>
            <div>
              Status: <strong className="font-bold text-amber-500">{simulatedOrder.status}</strong>
            </div>
            <div>
              Product:{' '}
              <strong className="text-foreground font-semibold">{simulatedOrder.product}</strong>
            </div>
            <div>
              Estimated Total:{' '}
              <strong className="font-bold text-emerald-500">{simulatedOrder.total}</strong>
            </div>
          </div>
        </div>

        {/* Linphone SIP Address Input */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">
            Linphone SIP Destination Username
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                sip:
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="linphone_username"
                disabled={
                  callState !== 'READY' && callState !== 'CALL_ENDED' && callState !== 'FAILED'
                }
                className="bg-background/60 border-border text-foreground w-full rounded-xl border py-2.5 pr-32 pl-10 font-mono text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
              <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[11px]">
                @sip.linphone.org
              </span>
            </div>
          </div>
        </div>

        {/* Command Helper Banner */}
        <div className="text-muted-foreground space-y-1 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400">
            <span>💻 Trigger via CLI Dial Script:</span>
          </p>
          <code className="block overflow-x-auto rounded-lg bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 select-all">
            uv run python src/telephony/outbound/dial.py --to {destination || 'YOUR_USERNAME'}
          </code>
        </div>
      </div>
    </div>
  );
}
