import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';
import { getOrCreateCustomerId } from '@/lib/utils';

function LocalCommerceAvatar({ isConnecting }: { isConnecting: boolean }) {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Outer ambient pulsing rings */}
      <div
        className={cn(
          'absolute size-32 rounded-full bg-emerald-500/10 transition-all duration-700',
          isConnecting ? 'animate-ping duration-1000' : 'animate-pulse'
        )}
      />
      <div className="absolute size-24 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30" />

      {/* Rotating outer accent ring when connecting */}
      {isConnecting && (
        <div className="animate-ring-rotate absolute size-28 rounded-full border-2 border-dashed border-emerald-400/60" />
      )}

      {/* Main Avatar Circle */}
      <div className="relative flex size-20 items-center justify-center rounded-full bg-linear-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-xl ring-2 shadow-emerald-500/25 ring-emerald-400/40">
        <svg
          className="size-10 transition-transform duration-300 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      </div>
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
        <span
          key={i}
          className="w-1.5 rounded-full bg-emerald-500/80 transition-all duration-300"
          style={{
            height: `${height}px`,
            animation: `wave-bounce 1.4s ease-in-out infinite`,
            animationDelay: `${(i % 6) * 0.18}s`,
          }}
        />
      ))}
    </div>
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
  const [customerId, setCustomerId] = useState<string>('');

  useEffect(() => {
    setCustomerId(getOrCreateCustomerId());
  }, []);

  return (
    <div
      ref={ref}
      id="home"
      className={cn(
        'relative flex min-h-svh w-full flex-col items-center justify-between px-4 pt-20 pb-12 sm:px-6 md:px-8',
        className
      )}
      {...props}
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <main className="flex w-full max-w-5xl flex-col items-center justify-center space-y-16 text-center">
        {/* Hero Section */}
        <section className="flex max-w-3xl flex-col items-center space-y-4 pt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-500 backdrop-blur-md">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span>LOCAL COMMERCE AI VOICE ASSISTANT</span>
          </div>

          <h1 className="text-foreground text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
            Your local shopping assistant,{' '}
            <span className="bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-300 bg-clip-text text-transparent">
              just one conversation away.
            </span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-normal text-balance sm:text-base">
            Ask about products, local shop information, prices, and available services using natural
            voice in English, Hindi, or Hinglish.
          </p>

          {/* Customer Memory Badge */}
          {customerId && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <svg
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>Persistent Memory Active • ID: {customerId}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#assistant-card"
              className="text-xs font-medium text-emerald-500 underline underline-offset-4 hover:text-emerald-400"
            >
              Skip to assistant ↓
            </a>
          </div>
        </section>

        {/* AI Voice Assistant Card (Central Interactive Hub) */}
        <section
          id="assistant-card"
          className="border-border/60 bg-card/80 relative w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 sm:p-8"
        >
          {/* Card Accent Top Bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="flex flex-col items-center text-center">
            <LocalCommerceAvatar isConnecting={isConnecting} />

            {/* Agent State Badge */}
            <div
              className={cn(
                'mb-2 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-300',
                isConnecting
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  isConnecting ? 'animate-spin bg-amber-400' : 'animate-pulse bg-emerald-400'
                )}
              />
              <span>{isConnecting ? 'Connecting...' : 'Ready to help'}</span>
            </div>

            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              Anisha — Local Assistant
            </h2>

            <p className="text-muted-foreground mt-1 text-xs leading-relaxed sm:text-sm">
              {isConnecting
                ? 'Getting your voice assistant ready...'
                : 'Start a conversation with your local commerce assistant.'}
            </p>

            {/* Organic Audio Waveform */}
            <div className="my-6 w-full">
              <OrganicWaveform />
            </div>

            {/* Primary Action Button */}
            <Button
              size="lg"
              onClick={onStartCall}
              disabled={isConnecting}
              aria-label={isConnecting ? 'Connecting to voice assistant' : startButtonText}
              className="mt-2 w-full rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 py-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-75 sm:w-80"
              suppressHydrationWarning
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting to Voice Assistant...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
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
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                  {startButtonText}
                </span>
              )}
            </Button>
          </div>
        </section>

        {/* What I Can Help With (Local Commerce Capabilities Grid) */}
        <section id="capabilities" className="w-full space-y-6 pt-4 text-left">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              What I Can Help With
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Voice-first assistance for your local shopping & business needs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group border-border/60 bg-card/60 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-500 transition-transform group-hover:scale-110">
                🛍️
              </div>
              <h3 className="text-foreground text-base font-semibold">Product Questions</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Ask about products, service offerings, and local store availability.
              </p>
            </div>

            <div className="group border-border/60 bg-card/60 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-xl text-teal-500 transition-transform group-hover:scale-110">
                🏪
              </div>
              <h3 className="text-foreground text-base font-semibold">Shop Information</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Get store location, operating hours, phone contact, and local business details.
              </p>
            </div>

            <div className="group border-border/60 bg-card/60 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-500 transition-transform group-hover:scale-110">
                📦
              </div>
              <h3 className="text-foreground text-base font-semibold">Order Assistance</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Get guidance on your orders whenever store order information is available.
              </p>
            </div>

            <div className="group border-border/60 bg-card/60 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-xl text-teal-500 transition-transform group-hover:scale-110">
                💬
              </div>
              <h3 className="text-foreground text-base font-semibold">Customer Support</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Get guided to human support when requests require staff authorization.
              </p>
            </div>
          </div>

          <p className="text-muted-foreground/70 text-center text-xs italic">
            * Informational UI cards. Stock, prices, and orders depend on connected store data.
          </p>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full space-y-6 pt-4 text-center">
          <div>
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Simple 3-step voice interaction with zero hassle
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-border/40 bg-muted/20 flex flex-col items-center rounded-2xl border p-6 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-sm font-bold text-emerald-500">
                1
              </div>
              <h3 className="text-foreground text-sm font-semibold">Start Assistant</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Click &quot;Start Voice Assistant&quot; and allow microphone access in your browser.
              </p>
            </div>

            <div className="border-border/40 bg-muted/20 flex flex-col items-center rounded-2xl border p-6 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-sm font-bold text-emerald-500">
                2
              </div>
              <h3 className="text-foreground text-sm font-semibold">Speak Naturally</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Ask your question naturally in English, Hindi, or Hinglish.
              </p>
            </div>

            <div className="border-border/40 bg-muted/20 flex flex-col items-center rounded-2xl border p-6 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-sm font-bold text-emerald-500">
                3
              </div>
              <h3 className="text-foreground text-sm font-semibold">Get Voice Answers</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Receive instant, helpful spoken responses from Anisha with live transcript feedback.
              </p>
            </div>
          </div>
        </section>

        {/* Guardrails & Trust Section */}
        <section
          id="reliability"
          className="border-border/60 bg-muted/30 w-full rounded-3xl border p-6 text-left sm:p-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
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
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-foreground text-lg font-bold">
                Designed for Reliable Local Assistance
              </h3>
              <p className="text-muted-foreground text-xs">
                Built with Day 2 AI guardrails and transparent system boundaries
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-emerald-500">✓</span>
              <span className="text-foreground/90">
                Uses verified store and product information
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-emerald-500">✓</span>
              <span className="text-foreground/90">
                Never invents order details or false promises
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-emerald-500">✓</span>
              <span className="text-foreground/90">
                Never falsely claims payments or refunds processed
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-emerald-500">✓</span>
              <span className="text-foreground/90">Guides users to human support when needed</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-12 text-center">
        <p className="text-muted-foreground text-xs font-normal">
          Powered by <span className="text-foreground font-semibold">Murf Falcon TTS</span> &{' '}
          <span className="text-foreground font-semibold">LiveKit Agents</span>
        </p>
      </footer>
    </div>
  );
};
