'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/app/language-context';
import { OutboundCard } from '@/components/app/outbound-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';
import { getOrCreateCustomerId } from '@/lib/utils';
import { CATALOGUE_ITEMS, type ProductItem } from '@/lib/product-images';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Headphones,
  Mic,
  Package,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

function LocalCommerceAvatar({ isConnecting }: { isConnecting: boolean }) {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Ambient Pulsing Glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute size-36 rounded-full bg-emerald-500/20 blur-md"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute size-28 rounded-full bg-teal-500/20 ring-1 ring-emerald-500/30"
      />

      {isConnecting && (
        <div className="animate-spin absolute size-32 rounded-full border-2 border-dashed border-emerald-400/70" />
      )}

      {/* Main Avatar Circle */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative flex size-24 items-center justify-center rounded-full bg-linear-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-400/30"
      >
        <Mic className="size-10 transition-transform duration-300" />
      </motion.div>
    </div>
  );
}

function OrganicWaveform() {
  const barHeights = [
    14, 22, 10, 30, 18, 38, 26, 12, 34, 20, 42, 28, 16, 36, 22, 14, 32, 18, 24, 10, 28, 16, 20, 12,
  ];

  return (
    <div className="flex h-12 items-center justify-center gap-1 px-4">
      {barHeights.map((height, i) => (
        <motion.span
          key={i}
          animate={{ height: [`${height}px`, `${Math.min(48, height * 1.5)}px`, `${height}px`] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: (i % 6) * 0.15 }}
          className="w-1.5 rounded-full bg-emerald-500/80"
        />
      ))}
    </div>
  );
}

// Counter component for animated real metrics
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1000;
    const incrementTime = 30;
    const steps = Math.ceil(duration / incrementTime);
    const stepValue = (end - start) / steps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  isConnecting?: boolean;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  isConnecting = false,
  ref,
  className,
  ...props
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const { lang, t } = useLanguage();
  const [customerId, setCustomerId] = useState<string>('');
  const [summaryData, setSummaryData] = useState<{
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    success_rate: number;
  } | null>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [escalationData, setEscalationData] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    setCustomerId(getOrCreateCustomerId());

    // Fetch REAL DATA from database APIs
    const fetchRealDashboardData = async () => {
      try {
        setLoadingMetrics(true);
        const [sumRes, callsRes, escRes] = await Promise.all([
          fetch('/api/analytics/summary').then((r) => r.json()).catch(() => null),
          fetch('/api/analytics/calls?limit=5').then((r) => r.json()).catch(() => null),
          fetch('/api/escalations').then((r) => r.json()).catch(() => null),
        ]);

        if (sumRes && sumRes.success) {
          setSummaryData({
            total_calls: sumRes.total_calls || 0,
            successful_calls: sumRes.successful_calls || 0,
            failed_calls: sumRes.failed_calls || 0,
            success_rate: sumRes.success_rate || 0,
          });
        }

        if (callsRes && callsRes.success && Array.isArray(callsRes.calls)) {
          setRecentCalls(callsRes.calls);
        }

        if (escRes && escRes.success && Array.isArray(escRes.escalations)) {
          setEscalationData(escRes.escalations);
        }
      } catch (err) {
        console.warn('Dashboard real data fetch error:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchRealDashboardData();
  }, []);

  return (
    <div
      ref={ref}
      id="home"
      className={cn(
        'relative flex min-h-svh w-full flex-col items-center justify-between px-4 pt-8 pb-16 sm:px-6 md:px-8',
        className
      )}
      {...props}
    >
      {/* Ambient Radial Background Glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -z-10 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-10 right-10 -z-10 size-[500px] rounded-full bg-teal-500/10 blur-[130px]" />

      <main className="flex w-full max-w-7xl flex-col items-center space-y-16">
        {/* =================================================================== */}
        {/* 1. HERO SECTION */}
        {/* =================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-4xl flex-col items-center text-center space-y-6 pt-4"
        >
          {/* Status Badges Header */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-500 backdrop-blur-md">
              <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
              <span>{t('liveIndicator')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>{t('murfBadge')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 backdrop-blur-md">
              <Activity className="size-3.5" />
              <span>{t('livekitBadge')}</span>
            </div>
          </div>

          <h1 className="text-foreground text-3xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {lang === 'en' ? (
              <>
                Your Local Commerce{' '}
                <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  Voice Assistant
                </span>
              </>
            ) : (
              <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            )}
          </h1>

          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-normal text-balance sm:text-base">
            {t('heroSubtitle')}
          </p>

          {/* Customer Memory Badge */}
          {customerId && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>
                {lang === 'en'
                  ? `Persistent Memory Active • ID: ${customerId}`
                  : `स्थायी मेमोरी सक्रिय • ID: ${customerId}`}
              </span>
            </div>
          )}
        </motion.section>

        {/* =================================================================== */}
        {/* 2. MAIN REAL METRICS CARDS */}
        {/* =================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card 1: Total Calls */}
          <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {t('totalCalls')}
              </span>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <PhoneCall className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-foreground font-mono text-3xl font-extrabold">
                {loadingMetrics ? '...' : <AnimatedCounter value={summaryData?.total_calls || 0} />}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                <TrendingUp className="size-3" />
                Live DB
              </span>
            </div>
          </div>

          {/* Card 2: Successful Calls */}
          <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {t('successfulCalls')}
              </span>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-foreground font-mono text-3xl font-extrabold text-teal-400">
                {loadingMetrics ? '...' : <AnimatedCounter value={summaryData?.successful_calls || 0} />}
              </span>
              <span className="text-muted-foreground text-xs font-medium">Verified</span>
            </div>
          </div>

          {/* Card 3: Failed Calls */}
          <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {t('failedCalls')}
              </span>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                <XCircle className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-foreground font-mono text-3xl font-extrabold text-rose-400">
                {loadingMetrics ? '...' : <AnimatedCounter value={summaryData?.failed_calls || 0} />}
              </span>
              <span className="text-muted-foreground text-xs font-medium">Categorized</span>
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {t('successRate')}
              </span>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-foreground font-mono text-3xl font-extrabold text-emerald-400">
                {loadingMetrics ? '...' : <AnimatedCounter value={summaryData?.success_rate || 0} suffix="%" />}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                Target &gt;90%
              </span>
            </div>
          </div>
        </motion.section>

        {/* =================================================================== */}
        {/* 3. VOICE ASSISTANT CENTRAL HUB CARD */}
        {/* =================================================================== */}
        <motion.section
          id="assistant-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-border/60 bg-card/90 relative w-full max-w-xl overflow-hidden rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/40"
        >
          {/* Glowing Top Gradient Bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="flex flex-col items-center text-center">
            <LocalCommerceAvatar isConnecting={isConnecting} />

            {/* Agent State Badge */}
            <div
              className={cn(
                'mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-300',
                isConnecting
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  isConnecting ? 'animate-spin bg-amber-400' : 'animate-pulse bg-emerald-400'
                )}
              />
              <span>{isConnecting ? t('agentConnecting') : t('agentReady')}</span>
            </div>

            <h2 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t('voiceCardTitle')}
            </h2>

            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed sm:text-sm">
              {isConnecting
                ? t('agentConnecting')
                : lang === 'en'
                  ? 'Start a natural voice conversation in English, Hindi, or Hinglish.'
                  : 'अंग्रेजी, हिंदी या हिंग्लिश में स्वाभाविक आवाज़ में बातचीत शुरू करें।'}
            </p>

            {/* Organic Waveform Component */}
            <div className="my-6 w-full">
              <OrganicWaveform />
            </div>

            {/* Primary Action Button */}
            <Button
              size="lg"
              onClick={onStartCall}
              disabled={isConnecting}
              aria-label={isConnecting ? t('agentConnecting') : t('startVoiceCall')}
              className="mt-2 w-full rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 py-6 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-75 sm:w-84"
              suppressHydrationWarning
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('agentConnecting')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Mic className="size-5" />
                  {t('startVoiceCall')}
                </span>
              )}
            </Button>
          </div>
        </motion.section>

        {/* =================================================================== */}
        {/* 4. QUICK ACTIONS PANEL */}
        {/* =================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full space-y-4 text-left"
        >
          <h3 className="text-foreground text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            <span>{t('quickActionsTitle')}</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={onStartCall}
              className="group border-border/60 bg-card/80 flex items-center justify-between rounded-2xl border p-4 text-left shadow-md transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Mic className="size-5" />
                </div>
                <div>
                  <h4 className="text-foreground text-sm font-semibold">{t('actionStartCall')}</h4>
                  <p className="text-muted-foreground text-[11px]">Browser WebRTC</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
            </button>

            <a
              href="#outbound-call"
              className="group border-border/60 bg-card/80 flex items-center justify-between rounded-2xl border p-4 text-left shadow-md transition-all hover:border-teal-500/40 hover:bg-teal-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                  <PhoneCall className="size-5" />
                </div>
                <div>
                  <h4 className="text-foreground text-sm font-semibold">{t('actionOutboundCall')}</h4>
                  <p className="text-muted-foreground text-[11px]">SIP Linphone Trunk</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-teal-400" />
            </a>

            <Link
              href="/support"
              className="group border-border/60 bg-card/80 flex items-center justify-between rounded-2xl border p-4 text-left shadow-md transition-all hover:border-amber-500/40 hover:bg-amber-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <h4 className="text-foreground text-sm font-semibold">{t('actionEscalate')}</h4>
                  <p className="text-muted-foreground text-[11px]">Consent Tickets (/support)</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
            </Link>

            <Link
              href="/analytics"
              className="group border-border/60 bg-card/80 flex items-center justify-between rounded-2xl border p-4 text-left shadow-md transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h4 className="text-foreground text-sm font-semibold">{t('actionViewAnalytics')}</h4>
                  <p className="text-muted-foreground text-[11px]">Full Metrics (/analytics)</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
            </Link>
          </div>
        </motion.section>

        {/* =================================================================== */}
        {/* 4.5. FEATURED PRODUCT CATALOGUE GRID (ITEM IMAGES & ANIMATIONS) */}
        {/* =================================================================== */}
        <motion.section
          id="catalogue"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="border-border/60 bg-card/80 w-full rounded-3xl border p-6 shadow-xl backdrop-blur-xl space-y-6 text-left"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h3 className="text-foreground text-xl font-bold tracking-tight">
                  {lang === 'en' ? 'Local Store Product Catalogue' : 'स्थानीय स्टोर उत्पाद कैटलॉग'}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {lang === 'en'
                    ? 'Explore real items, live stock levels, and unit pricing available for voice query'
                    : 'वॉइस पूछताछ के लिए उपलब्ध उत्पाद, लाइव स्टॉक और कीमतें देखें'}
                </p>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['ALL', 'Groceries', 'Fruits', 'Vegetables', 'Snacks'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'rounded-full px-3 py-1 font-semibold transition-all duration-200',
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATALOGUE_ITEMS.filter(
              (item) => selectedCategory === 'ALL' || item.category === selectedCategory
            ).map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="group border-border/50 bg-background/60 relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/40 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Item Image with Animated Zoom */}
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-emerald-500/20 bg-muted/40">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-mono font-bold text-white drop-shadow-md">
                      {item.unit}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {item.category}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          item.stock > 5
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.stock > 0
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                        )}
                      >
                        {item.stock > 5 ? 'In Stock' : item.stock > 0 ? `Low (${item.stock})` : 'Out of Stock'}
                      </span>
                    </div>

                    <h4 className="text-foreground font-bold text-sm leading-tight group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </h4>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-emerald-400 font-mono text-base font-extrabold">
                        ₹{item.price}
                      </span>
                      <span className="text-muted-foreground text-[11px]">{item.seller}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* =================================================================== */}
        {/* 5. DAY 6 OUTBOUND SIP TELEPHONY CARD */}
        {/* =================================================================== */}
        <section id="outbound-call" className="w-full">
          <OutboundCard />
        </section>

        {/* =================================================================== */}
        {/* 6. RECENT CONVERSATIONS TABLE (REAL DATABASE CALLS) */}
        {/* =================================================================== */}
        <motion.section
          id="conversations"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-border/60 bg-card/80 w-full rounded-3xl border p-6 shadow-xl backdrop-blur-xl space-y-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Activity className="size-5" />
              </div>
              <div>
                <h3 className="text-foreground text-lg font-bold">{t('recentConversations')}</h3>
                <p className="text-muted-foreground text-xs">Real-time call events from SQLite database</p>
              </div>
            </div>

            <Link
              href="/analytics#calls"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <span>{t('viewAllConversations')}</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-border/50 text-muted-foreground border-b uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-3">{t('colCustomer')}</th>
                  <th className="py-3 px-3">{t('colIntent')}</th>
                  <th className="py-3 px-3">{t('colLanguage')}</th>
                  <th className="py-3 px-3">{t('colAgent')}</th>
                  <th className="py-3 px-3">{t('colOutcome')}</th>
                  <th className="py-3 px-3">{t('colTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('noConversations')}
                    </td>
                  </tr>
                ) : (
                  recentCalls.map((call, idx) => (
                    <tr key={call.call_id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-foreground flex items-center gap-2">
                        <User className="size-3.5 text-emerald-500" />
                        <span>{call.customer_name || 'Radhika Sharma'}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                          {call.intent || 'PRODUCT_ENQUIRY'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground">{call.language || 'Hinglish'}</td>
                      <td className="py-3.5 px-3 font-mono text-muted-foreground">
                        {call.agent_type === 'SPECIALIST' ? 'Returns Specialist' : 'Main Agent'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                            call.outcome === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          )}
                        >
                          {call.outcome || 'SUCCESS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {call.started_at ? new Date(call.started_at).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* =================================================================== */}
        {/* 7. SPECIALIST AGENTS & HUMAN ESCALATION SECTIONS */}
        {/* =================================================================== */}
        <section id="agents" className="w-full grid grid-cols-1 gap-6 md:grid-cols-2 text-left">
          {/* Main Commerce Agent Card */}
          <div className="border-border/60 bg-card/80 rounded-3xl border p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Bot className="size-6" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">{t('mainAgentTitle')}</h3>
                  <p className="text-muted-foreground text-xs">Anisha — Primary Assistant</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                {t('agentOnline')}
              </span>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Handles product discovery, catalogue lookups, price estimation, stock availability, and estimated subtotals.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between border-b pb-2 text-muted-foreground">
                <span>Scope:</span>
                <span className="text-foreground font-medium">Catalogue & Store Info</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Supported Languages:</span>
                <span className="text-emerald-400 font-semibold">English • Hindi • Hinglish</span>
              </div>
            </div>
          </div>

          {/* Returns & Refunds Specialist Card */}
          <div className="border-border/60 bg-card/80 rounded-3xl border p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                  <Package className="size-6" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">{t('specialistAgentTitle')}</h3>
                  <p className="text-muted-foreground text-xs">Day 9 Context-Preserving Handoff</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-bold text-teal-400">
                {t('agentOnline')}
              </span>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Handles return requests, refund status checks, return eligibility verification, and damaged product reports.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between border-b pb-2 text-muted-foreground">
                <span>Scope:</span>
                <span className="text-foreground font-medium">Returns, Refunds & Disputes</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Handoff Target:</span>
                <span className="text-teal-400 font-semibold">Returns Specialist Agent</span>
              </div>
            </div>
          </div>
        </section>

        {/* Human Escalation Overview Section */}
        <section id="escalation-overview" className="w-full border-border/60 bg-card/80 rounded-3xl border p-6 shadow-xl backdrop-blur-xl text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Headphones className="size-6" />
              </div>
              <div>
                <h3 className="text-foreground font-bold">{t('navEscalations')}</h3>
                <p className="text-muted-foreground text-xs">Consent-Gated Support Tickets (SQLite DB)</p>
              </div>
            </div>

            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
            >
              <span>Manage Tickets (/support)</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border-border/40 bg-muted/20 rounded-2xl border p-4 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('openRequests')}</span>
              <span className="font-mono text-xl font-bold text-amber-400">
                {escalationData.filter((e) => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length}
              </span>
            </div>

            <div className="border-border/40 bg-muted/20 rounded-2xl border p-4 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('inProgress')}</span>
              <span className="font-mono text-xl font-bold text-sky-400">
                {escalationData.filter((e) => e.status === 'IN_PROGRESS').length}
              </span>
            </div>

            <div className="border-border/40 bg-muted/20 rounded-2xl border p-4 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('resolved')}</span>
              <span className="font-mono text-xl font-bold text-emerald-400">
                {escalationData.filter((e) => e.status === 'RESOLVED').length}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full pt-16 text-center text-xs text-muted-foreground space-y-1">
        <p>
          Powered by <span className="text-foreground font-semibold">Murf Falcon TTS</span> &{' '}
          <span className="text-foreground font-semibold">LiveKit Agents</span>
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          Local Commerce Voice AI Platform • Radhika Sharma
        </p>
      </footer>
    </div>
  );
};
