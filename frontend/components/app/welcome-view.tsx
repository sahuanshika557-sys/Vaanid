import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

function AnishaAvatar() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      <div className="absolute size-24 animate-ping rounded-full bg-indigo-500/20 duration-1000" />
      <div className="absolute size-20 rounded-full bg-indigo-500/10" />
      <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/30">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-8"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </div>
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
  return (
    <div
      ref={ref}
      className={cn('flex min-h-svh flex-col items-center justify-between p-6 py-12', className)}
      {...props}
    >
      <div />
      <section className="bg-background flex w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <AnishaAvatar />

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span>English • Hindi • Hinglish</span>
        </div>

        <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Anisha — AI Voice Assistant
        </h1>

        <p className="text-muted-foreground max-w-prose pt-2 text-sm leading-relaxed font-normal">
          Your customer support assistant for Murf AI voice services. Ready to assist with product
          features, TTS capabilities, and technical guidance.
        </p>

        <Button
          size="lg"
          onClick={onStartCall}
          disabled={isConnecting}
          aria-label={isConnecting ? 'Connecting you to Anisha' : startButtonText}
          className="mt-8 w-full max-w-xs rounded-full font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:scale-105 sm:w-64"
          suppressHydrationWarning
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Connecting to Anisha...
            </span>
          ) : (
            startButtonText
          )}
        </Button>
      </section>

      <footer className="pt-8 text-center">
        <p className="text-muted-foreground max-w-prose text-xs leading-5 font-normal text-pretty md:text-sm">
          Powered by <span className="text-foreground font-semibold">Murf Falcon TTS</span> &{' '}
          <span className="text-foreground font-semibold">LiveKit Agents</span>
        </p>
      </footer>
    </div>
  );
};
