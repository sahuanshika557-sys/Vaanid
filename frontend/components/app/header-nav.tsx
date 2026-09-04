'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  ChevronRight,
  Globe,
  Headphones,
  Home,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { JudgeDemoModal } from '@/components/app/judge-demo-modal';
import { useLanguage } from '@/components/app/language-context';
import { MerchantCopilotModal } from '@/components/app/merchant-copilot-modal';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/shadcn/utils';

interface HeaderNavProps {
  currentBreadcrumb?: string;
}

export function HeaderNav({ currentBreadcrumb }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [judgeTourOpen, setJudgeTourOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1 && pathname !== '/') {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes('#')) {
      const targetId = href.split('#')[1];
      if (pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: t('navOverview'), icon: Home, active: pathname === '/' },
    { href: '/#commerce', label: 'AI Commerce', icon: Zap, active: false },
    { href: '/#recovery', label: 'Revenue Recovery', icon: TrendingUp, active: false },
    { href: '/#activity', label: 'Activity Stream', icon: Activity, active: false },
    {
      href: '/analytics',
      label: t('navAnalytics'),
      icon: BarChart3,
      active: pathname === '/analytics',
    },
    {
      href: '/support',
      label: t('navEscalations'),
      icon: Headphones,
      active: pathname === '/support',
    },
  ];

  return (
    <>
      <header className="border-border/40 bg-background/90 fixed top-0 left-0 z-50 flex w-full flex-col border-b backdrop-blur-2xl">
        <div className="flex h-16 w-full items-center justify-between px-3 md:px-6">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 via-emerald-500/20 to-teal-600/10 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30 transition-transform duration-300 group-hover:scale-105">
                <Store className="size-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground text-xs font-bold tracking-tight sm:text-sm md:text-base">
                    {t('brandName')}
                  </span>
                  <span className="py-0.2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 text-[9px] font-bold text-cyan-400">
                    DEMO MODE
                  </span>
                </div>
                <span className="text-muted-foreground text-[10px] font-medium sm:text-[11px]">
                  {t('brandSubtitle')}
                </span>
              </div>
            </Link>

            {/* Back Button (Visible on all internal subpages) */}
            {pathname !== '/' && (
              <button
                onClick={handleBack}
                aria-label="Go back to previous page"
                className="ml-1 inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                <ArrowLeft className="size-3.5" />
                <span>{t('backBtn')}</span>
              </button>
            )}
          </div>

          {/* Navigation Links (Visible on md screens 768px and wider) */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all',
                    link.active
                      ? 'bg-emerald-500/15 font-bold text-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Merchant Copilot Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-bold text-indigo-400 shadow-xs transition-all hover:bg-indigo-500/20"
            >
              <Bot className="size-3.5" />
              <span>Merchant Copilot</span>
            </button>

            {/* Hackathon Judge Tour Button */}
            <button
              onClick={() => setJudgeTourOpen(true)}
              className="flex animate-pulse items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-sm ring-1 ring-cyan-500/30 transition-all hover:bg-cyan-500/25"
            >
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>Judge Tour (3 Min)</span>
            </button>
          </nav>

          {/* Right Controls: Language Toggle, Theme Toggle, Mobile Hamburger */}
          <div className="flex items-center gap-2">
            {/* Bilingual EN | हिंदी Toggle */}
            <button
              onClick={toggleLang}
              aria-label="Toggle language between English and Hindi"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 shadow-xs transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <Globe className="size-3.5" />
              <span>{lang === 'en' ? 'EN | हिंदी' : 'हिंदी | EN'}</span>
            </button>

            <ThemeToggle className="size-8 rounded-xl" />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="text-muted-foreground hover:bg-muted rounded-xl border p-1.5 md:hidden"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Breadcrumb Sub-bar for Internal Pages */}
        {pathname !== '/' && (
          <div className="border-border/30 bg-muted/30 text-muted-foreground flex items-center justify-between border-t px-4 py-1 text-xs md:px-8">
            <div className="flex items-center gap-1.5">
              <Link href="/" className="font-medium hover:text-emerald-500">
                {t('dashboardBreadcrumb')}
              </Link>
              <ChevronRight className="text-muted-foreground/60 size-3" />
              <span className="text-foreground font-semibold">
                {currentBreadcrumb ||
                  (pathname === '/analytics' ? t('navAnalytics') : t('navEscalations'))}
              </span>
            </div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 font-medium underline underline-offset-2 hover:text-emerald-500"
            >
              <ArrowLeft className="size-3" />
              <span>{t('backBtn')}</span>
            </button>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-border/40 bg-background/95 space-y-2 border-b p-4 backdrop-blur-2xl md:hidden">
            {pathname !== '/' && (
              <button
                onClick={() => {
                  handleBack();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-500"
              >
                <ArrowLeft className="size-4" />
                <span>{t('backBtn')}</span>
              </button>
            )}

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold transition-all',
                    link.active
                      ? 'bg-emerald-500/15 font-bold text-emerald-500'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                setSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-muted-foreground hover:bg-muted flex w-full items-center gap-3 rounded-xl p-2.5 text-sm font-semibold"
            >
              <Settings className="size-4" />
              <span>{t('navSettings')}</span>
            </button>
          </div>
        )}
      </header>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border/60 bg-card w-full max-w-md space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-foreground flex items-center gap-2 font-bold">
                <Settings className="size-4 text-emerald-500" />
                <span>{t('navSettings')}</span>
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span>Interface Language / इंटरफ़ेस भाषा</span>
                <button
                  onClick={toggleLang}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-500"
                >
                  {lang === 'en' ? 'English' : 'हिंदी (Devanagari)'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span>Voice Pipeline Engine</span>
                <span className="font-mono font-semibold text-emerald-500">
                  Murf Falcon + LiveKit
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span>Speech-to-Text Model</span>
                <span className="font-mono font-semibold text-emerald-500">
                  Deepgram Nova-3 Multi
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span>Database Engine</span>
                <span className="font-mono font-semibold text-emerald-500">
                  SQLite (local_commerce.db)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Hackathon Modals */}
      <JudgeDemoModal isOpen={judgeTourOpen} onClose={() => setJudgeTourOpen(false)} />
      <MerchantCopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </>
  );
}
