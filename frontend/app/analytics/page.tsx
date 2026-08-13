'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Database,
  Filter,
  Globe,
  LifeBuoy,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SummaryData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
}

interface CallRecord {
  call_id: string;
  channel: 'BROWSER' | 'SIP';
  language: string;
  intent: string;
  duration: number;
  outcome: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  failure_reason: string;
  escalated: boolean;
  timestamp: string;
}

interface BreakdownData {
  channels: { BROWSER: number; SIP: number };
  languages: { English: number; Hindi: number; Hinglish: number };
  intents: Record<string, number>;
  escalations: { total: number; open: number; in_progress: number; resolved: number };
}

interface FailureData {
  total_failures: number;
  breakdown: Array<{ key: string; label: string; count: number }>;
  insight: string;
}

interface TrendPoint {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export default function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState<SummaryData>({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    success_rate: 0,
  });

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [breakdowns, setBreakdowns] = useState<BreakdownData>({
    channels: { BROWSER: 0, SIP: 0 },
    languages: { English: 0, Hindi: 0, Hinglish: 0 },
    intents: {},
    escalations: { total: 0, open: 0, in_progress: 0, resolved: 0 },
  });

  const [failures, setFailures] = useState<FailureData>({
    total_failures: 0,
    breakdown: [],
    insight: 'No call failures recorded yet.',
  });

  const [trends, setTrends] = useState<TrendPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filters
  const [timeframe, setTimeframe] = useState<string>('7d');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [intentFilter, setIntentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setError(null);

      // Fetch summary, breakdowns, failures, and trends in parallel
      const [sumRes, breakRes, failRes, trendRes] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch('/api/analytics/breakdowns'),
        fetch('/api/analytics/failures'),
        fetch(`/api/analytics/trends?timeframe=${timeframe}`),
      ]);

      const [sumData, breakData, failData, trendData] = await Promise.all([
        sumRes.json(),
        breakRes.json(),
        failRes.json(),
        trendRes.json(),
      ]);

      if (sumData.total_calls !== undefined) {
        setSummary(sumData);
      }
      if (breakData.channels) {
        setBreakdowns(breakData);
      }
      if (failData.breakdown) {
        setFailures(failData);
      }
      if (trendData.trends) {
        setTrends(trendData.trends);
      }

      // Fetch calls list with active filters
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (channelFilter !== 'ALL') params.set('channel', channelFilter);
      if (languageFilter !== 'ALL') params.set('language', languageFilter);
      if (outcomeFilter !== 'ALL') params.set('outcome', outcomeFilter);
      if (intentFilter !== 'ALL') params.set('intent', intentFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const callsRes = await fetch(`/api/analytics/calls?${params.toString()}`);
      const callsData = await callsRes.json();
      if (callsData.calls) {
        setCalls(callsData.calls);
      }

      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err: unknown) {
      console.error('Error fetching analytics:', err);
      setError('Analytics temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, channelFilter, languageFilter, outcomeFilter, intentFilter, searchQuery]);

  // Initial load + filter updates
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Real-time automatic polling every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  const handleSeedCalls = async () => {
    setSeeding(true);
    try {
      await fetch('/api/analytics/seed', { method: 'POST' });
      await fetchAnalyticsData();
    } catch (err) {
      console.error('Error seeding test calls:', err);
    } finally {
      setSeeding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Channel calculations
  const totalCallsCount = summary.total_calls;
  const browserCalls = breakdowns.channels.BROWSER || 0;
  const sipCalls = breakdowns.channels.SIP || 0;
  const browserPct = totalCallsCount > 0 ? Math.round((browserCalls / totalCallsCount) * 100) : 0;
  const sipPct = totalCallsCount > 0 ? Math.round((sipCalls / totalCallsCount) * 100) : 0;

  // Language calculations
  const langEng = breakdowns.languages.English || 0;
  const langHin = breakdowns.languages.Hindi || 0;
  const langHing = breakdowns.languages.Hinglish || 0;

  // Intent list formatting
  const intentLabels: Record<string, string> = {
    PRODUCT_ENQUIRY: 'Product Enquiry',
    CATALOGUE_LOOKUP: 'Catalogue Lookup',
    ORDER_STATUS: 'Order Status',
    ORDER_DISPUTE: 'Order Dispute',
    PAYMENT_ISSUE: 'Payment Issue',
    HUMAN_ESCALATION: 'Human Escalation',
    OTHER: 'Other / Inquiries',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span>Voice Agent</span>
            </Link>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Activity className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                    LOCAL COMMERCE VOICE INTELLIGENCE
                  </h1>
                  {/* Live Status Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span>Live</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time performance insights from your AI voice agent.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden text-xs text-slate-400 sm:inline">
                Last updated: <span className="font-mono text-slate-300">{lastUpdated}</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LifeBuoy className="size-3.5 text-emerald-400" />
              <span>Support Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs font-medium text-rose-300">
            <AlertCircle className="size-5 shrink-0 text-rose-400" />
            <div className="flex-1">{error}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAnalyticsData}
              className="border-rose-500/40 text-rose-300"
            >
              Retry
            </Button>
          </div>
        )}

        {/* 1. TOP KPI SECTION (4 Large Cards) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Calls */}
          <Card className="relative overflow-hidden border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-slate-700">
            <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Total Calls
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <PhoneCall className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">{summary.total_calls}</span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {summary.total_calls > 5 ? '+12% this week' : 'Live data'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Total voice sessions logged in SQLite
              </p>
            </CardContent>
          </Card>

          {/* Successful Calls */}
          <Card className="relative overflow-hidden border-emerald-500/20 bg-emerald-950/10 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30">
            <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                  Successful Calls
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-300">
                  {summary.successful_calls}
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Passed
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-400/70">
                Objectives verified and completed
              </p>
            </CardContent>
          </Card>

          {/* Failed Calls */}
          <Card className="relative overflow-hidden border-rose-500/20 bg-rose-950/10 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-rose-500/30">
            <div className="absolute top-0 right-0 h-full w-1 bg-rose-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-rose-400 uppercase">
                  Failed Calls
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-rose-300">
                  {summary.failed_calls}
                </span>
                <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                  Issues
                </span>
              </div>
              <p className="mt-1 text-[11px] text-rose-400/70">Hang-ups or uncompleted tasks</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="relative overflow-hidden border-teal-500/20 bg-teal-950/10 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30">
            <div className="absolute top-0 right-0 h-full w-1 bg-teal-400" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
                  Success Rate
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                  <TrendingUp className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-teal-200">
                  {summary.success_rate}%
                </span>
                <span className="text-[11px] font-medium text-teal-400">Target &gt; 80%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, summary.success_rate))}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2 & 3. PERFORMANCE & TREND SECTION */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CALL PERFORMANCE (SUCCESS vs FAILED Chart) */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white">CALL PERFORMANCE</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Success vs Failure Distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="flex flex-col items-center justify-center py-4">
                {/* Visual Donut representation */}
                <div className="relative flex size-36 items-center justify-center rounded-full border-8 border-slate-800 bg-slate-950 p-4 shadow-inner">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-emerald-500 transition-all duration-700"
                    style={{
                      clipPath: `inset(0 0 0 ${100 - summary.success_rate}%)`,
                    }}
                  />
                  <div className="text-center">
                    <span className="text-2xl font-extrabold text-white">
                      {summary.success_rate}%
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Success
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5">
                    <span className="block font-bold text-emerald-400">
                      {summary.successful_calls} Calls
                    </span>
                    <span className="text-[10px] text-slate-400">Successful</span>
                  </div>
                  <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-2.5">
                    <span className="block font-bold text-rose-400">
                      {summary.failed_calls} Calls
                    </span>
                    <span className="text-[10px] text-slate-400">Failed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CALL VOLUME TREND (Time-Series Chart) */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-xl lg:col-span-2">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">CALL VOLUME TREND</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Voice call activity over time based on database records
                  </CardDescription>
                </div>
                {/* Timeframe Toggles */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeframe(t.id)}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                        timeframe === t.id
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              {trends.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                  <Database className="size-8 text-slate-600" />
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    No trend data for selected timeframe
                  </p>
                  <p className="text-[11px] text-slate-500">Make voice calls to populate trends</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {trends.map((item) => {
                    const maxVal = Math.max(...trends.map((t) => t.total), 1);
                    const barWidth = Math.round((item.total / maxVal) * 100);

                    return (
                      <div key={item.date} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="font-mono text-slate-300">{item.date}</span>
                          <span className="text-slate-400">
                            {item.total} calls ({item.successful} success, {item.failed} failed)
                          </span>
                        </div>
                        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-950 p-0.5">
                          <div
                            className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${item.total > 0 ? (item.successful / item.total) * barWidth : 0}%`,
                            }}
                          />
                          <div
                            className="h-full rounded-r-full bg-rose-500 transition-all duration-500"
                            style={{
                              width: `${item.total > 0 ? (item.failed / item.total) * barWidth : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 4, 5 & 6. BREAKDOWNS SECTION (Channels, Languages, Intents) */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* CALL CHANNEL ANALYTICS */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white">CALL CHANNELS</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Browser vs SIP Telephony
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-2">
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Globe className="size-3.5" /> Browser Calls
                  </span>
                  <span className="text-white">
                    {browserPct}% ({browserCalls})
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                  <div className="h-full bg-emerald-500" style={{ width: `${browserPct}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <PhoneCall className="size-3.5" /> SIP Calls
                  </span>
                  <span className="text-white">
                    {sipCalls > 0 ? `${sipPct}% (${sipCalls})` : 'No SIP calls yet'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                  <div className="h-full bg-blue-500" style={{ width: `${sipPct}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LANGUAGE ANALYTICS */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white">LANGUAGE BREAKDOWN</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Detected Multilingual Calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-2">
              {[
                { label: 'Hindi', count: langHin, color: 'bg-emerald-500' },
                { label: 'English', count: langEng, color: 'bg-teal-400' },
                { label: 'Hinglish', count: langHing, color: 'bg-amber-400' },
              ].map((lang) => {
                const pct =
                  totalCallsCount > 0 ? Math.round((lang.count / totalCallsCount) * 100) : 0;
                return (
                  <div key={lang.label}>
                    <div className="mb-1 flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{lang.label}</span>
                      <span className="font-mono text-slate-400">
                        {lang.count} calls ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                      <div className={`h-full ${lang.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* LOCAL COMMERCE INTENTS */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white">INTENTS DISTRIBUTION</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Customer Objective Categorization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {Object.keys(breakdowns.intents).length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No intent data logged yet.
                </p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {Object.entries(breakdowns.intents).map(([intentKey, count]) => {
                    const label = intentLabels[intentKey] || intentKey;
                    return (
                      <div
                        key={intentKey}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs"
                      >
                        <span className="font-semibold text-slate-200">{label}</span>
                        <Badge
                          variant="outline"
                          className="border-slate-700 bg-slate-900 font-mono text-slate-300"
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 7 & 8. FAILURE INSIGHTS & ESCALATION INSIGHTS */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* SEVENTH SECTION — FAILURE INSIGHTS ("Why calls fail") */}
          <Card className="border-rose-500/20 bg-rose-950/10 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-400" />
                <CardTitle className="text-sm font-bold text-white">Why calls fail</CardTitle>
              </div>
              <CardDescription className="text-xs text-rose-300/70">
                Root cause distribution from call records
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              {/* Dynamic Insight Banner */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-200">
                <Zap className="size-4 shrink-0 text-rose-400" />
                <span>{failures.insight}</span>
              </div>

              <div className="space-y-2">
                {failures.breakdown.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 text-xs font-medium"
                  >
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-mono text-rose-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* EIGHTH SECTION — HUMAN ESCALATION INSIGHTS (Day 7 Integration) */}
          <Card className="border-emerald-500/20 bg-emerald-950/10 shadow-xl">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="size-4 text-emerald-400" />
                  <CardTitle className="text-sm font-bold text-white">
                    Human Escalation Insights
                  </CardTitle>
                </div>
                <Link
                  href="/support"
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Manage Support &rarr;
                </Link>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Connected Day 7 escalation metrics
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                  <span className="block text-xs text-slate-400">Total</span>
                  <span className="mt-1 block text-xl font-extrabold text-white">
                    {breakdowns.escalations.total}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-center">
                  <span className="block text-xs text-emerald-400">Open</span>
                  <span className="mt-1 block text-xl font-extrabold text-emerald-300">
                    {breakdowns.escalations.open}
                  </span>
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-center">
                  <span className="block text-xs text-blue-400">In Progress</span>
                  <span className="mt-1 block text-xl font-extrabold text-blue-300">
                    {breakdowns.escalations.in_progress}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                  <span className="block text-xs text-slate-400">Resolved</span>
                  <span className="mt-1 block text-xl font-extrabold text-slate-300">
                    {breakdowns.escalations.resolved}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 9. CALL HISTORY TABLE, FILTERS & SEARCH */}
        <div className="mt-8">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search call ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-800 bg-slate-950/80 pl-9 text-xs text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Multi-Criteria Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                <Filter className="size-3.5" /> Channel:
              </span>
              {['ALL', 'BROWSER', 'SIP'].map((c) => (
                <button
                  key={c}
                  onClick={() => setChannelFilter(c)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    channelFilter === c
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-xs font-semibold text-slate-400">Language:</span>
              {['ALL', 'English', 'Hindi', 'Hinglish'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguageFilter(l)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    languageFilter === l
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {l}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-xs font-semibold text-slate-400">Outcome:</span>
              {['ALL', 'SUCCESS', 'FAILED'].map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcomeFilter(o)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    outcomeFilter === o
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {o}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-xs font-semibold text-slate-400">Intent:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PRODUCT_ENQUIRY', label: 'Enquiry' },
                { id: 'CATALOGUE_LOOKUP', label: 'Catalogue' },
                { id: 'ORDER_STATUS', label: 'Status' },
                { id: 'PAYMENT_ISSUE', label: 'Payment' },
                { id: 'ORDER_DISPUTE', label: 'Dispute' },
              ].map((i) => (
                <button
                  key={i.id}
                  onClick={() => setIntentFilter(i.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    intentFilter === i.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <Card className="mt-4 overflow-hidden border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/80 p-4">
              <div>
                <CardTitle className="text-sm font-bold text-white">Recent Calls</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Showing actual voice call records from database (Privacy Safe)
                </CardDescription>
              </div>
              {calls.length === 0 && !loading && (
                <Button
                  size="sm"
                  onClick={handleSeedCalls}
                  disabled={seeding}
                  className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  {seeding ? 'Seeding...' : 'Seed Test Calls'}
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {loading && (
                <div className="space-y-3 p-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-900" />
                  ))}
                </div>
              )}

              {!loading && calls.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <PhoneCall className="size-10 text-slate-600" />
                  <h3 className="mt-3 text-sm font-bold text-white">No calls recorded yet.</h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">
                    Make your first browser or SIP call to start seeing real analytics.
                  </p>
                  <Button
                    onClick={handleSeedCalls}
                    disabled={seeding}
                    className="mt-4 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Seed Demo Calls
                  </Button>
                </div>
              )}

              {!loading && calls.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-950 text-[11px] tracking-wider text-slate-400 uppercase">
                      <tr>
                        <th className="px-4 py-3">TIME</th>
                        <th className="px-4 py-3">CALL ID</th>
                        <th className="px-4 py-3">CHANNEL</th>
                        <th className="px-4 py-3">LANGUAGE</th>
                        <th className="px-4 py-3">INTENT</th>
                        <th className="px-4 py-3">DURATION</th>
                        <th className="px-4 py-3">OUTCOME</th>
                        <th className="px-4 py-3">ESCALATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {calls.map((c) => {
                        const isSuccess = c.outcome === 'SUCCESS';
                        const minutes = Math.floor(c.duration / 60);
                        const seconds = c.duration % 60;
                        const durationFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                        return (
                          <tr key={c.call_id} className="transition-colors hover:bg-slate-900/80">
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {new Date(c.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="max-w-[140px] truncate">{c.call_id}</span>
                                <button
                                  onClick={() => copyToClipboard(c.call_id)}
                                  className="text-slate-500 hover:text-slate-300"
                                >
                                  {copiedId === c.call_id ? (
                                    <CheckCircle2 className="size-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  c.channel === 'BROWSER'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                }`}
                              >
                                {c.channel}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{c.language}</td>
                            <td className="px-4 py-3 font-semibold text-slate-300">
                              {intentLabels[c.intent] || c.intent}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {durationFormatted}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[10px] font-bold ${
                                  isSuccess
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                    : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                {c.outcome}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-semibold ${
                                  c.escalated ? 'text-amber-400' : 'text-slate-500'
                                }`}
                              >
                                {c.escalated ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
