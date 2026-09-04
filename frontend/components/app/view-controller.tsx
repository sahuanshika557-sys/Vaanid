'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { ConnectionState } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { Button } from '@/components/ui/button';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.4, ease: 'linear' },
};

function CallEndedView({ onRestart }: { onRestart: () => Promise<void> | void }) {
  const [restarting, setRestarting] = useState(false);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-xl ring-8 ring-emerald-500/5">
        <svg
          className="size-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        <span>Session Completed</span>
      </div>
      <h2 className="text-foreground text-2xl font-extrabold tracking-tight md:text-3xl">
        Conversation ended
      </h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
        Need anything else? You can start a new voice session with Anisha anytime.
      </p>
      <Button
        size="lg"
        disabled={restarting}
        onClick={async () => {
          if (restarting) return;
          setRestarting(true);
          try {
            await onRestart();
          } finally {
            setRestarting(false);
          }
        }}
        className="mt-8 cursor-pointer rounded-full bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-6 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
      >
        {restarting ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connecting...
          </span>
        ) : (
          'Start Again'
        )}
      </Button>
    </div>
  );
}

function MicErrorView({
  errorType,
  onRetry,
}: {
  errorType: 'blocked' | 'not_found' | 'generic';
  onRetry: () => void;
}) {
  const isBlocked = errorType === 'blocked';
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <div className="bg-destructive/10 text-destructive border-destructive/30 ring-destructive/5 mb-6 flex size-20 items-center justify-center rounded-full border shadow-xl ring-8">
        <svg
          className="size-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z M3 3l18 18"
          />
        </svg>
      </div>
      <div className="bg-destructive/10 text-destructive border-destructive/20 mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
        <span>Permission Required</span>
      </div>
      <h2 className="text-foreground text-2xl font-extrabold tracking-tight md:text-3xl">
        {isBlocked ? 'Microphone access is blocked' : 'Microphone unavailable'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {isBlocked
          ? 'Please allow microphone access in your browser site settings (click the lock icon in the URL bar) and try again.'
          : 'Could not detect a working microphone device. Please connect a microphone and try again.'}
      </p>
      <Button
        size="lg"
        onClick={onRetry}
        className="mt-8 rounded-full bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-6 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105"
      >
        Try Again
      </Button>
    </div>
  );
}

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const session = useSessionContext();
  const { isConnected, connectionState, start, room } = session;
  const isConnecting = connectionState === ConnectionState.Connecting;
  const { resolvedTheme } = useTheme();

  const [hasEnded, setHasEnded] = useState(false);
  const [micError, setMicError] = useState<'blocked' | 'not_found' | 'generic' | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const isStartingRef = useRef(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnected && room) {
      wasConnectedRef.current = true;
      setHasEnded(false);
      setIsStarting(false);
      isStartingRef.current = false;
      // Safely unlock browser audio playback context
      room.startAudio().catch((err) => console.warn('startAudio failed:', err));
    } else if (wasConnectedRef.current && !isConnecting) {
      setHasEnded(true);
    }
  }, [isConnected, isConnecting, room]);

  const handleStartCall = async () => {
    if (isStartingRef.current || isConnecting || isConnected) {
      console.log('Call start already in progress, ignoring duplicate clicks.');
      return;
    }
    isStartingRef.current = true;
    setIsStarting(true);
    setMicError(null);
    setHasEnded(false);
    wasConnectedRef.current = false;

    console.log(
      '[VOICE_PIPELINE] MICROPHONE_PERMISSION: Requesting mic permissions & starting session...'
    );

    try {
      if (room && room.state !== ConnectionState.Disconnected) {
        try {
          await room.disconnect();
        } catch (discErr) {
          console.warn('Room disconnect warning before restart:', discErr);
        }
      }
      await start({
        tracks: {
          microphone: {
            enabled: true,
          },
        },
      });
      console.log('[VOICE_PIPELINE] LIVEKIT_CONNECTED: Voice session start succeeded.');
    } catch (err: unknown) {
      console.error('[VOICE_PIPELINE] MICROPHONE_ERROR:', err);
      const error = err as { name?: string; message?: string };
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.message?.toLowerCase().includes('permission') ||
        error.message?.toLowerCase().includes('denied') ||
        error.message?.toLowerCase().includes('blocked')
      ) {
        setMicError('blocked');
      } else if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError' ||
        error.message?.toLowerCase().includes('not found')
      ) {
        setMicError('not_found');
      } else {
        setMicError('generic');
      }
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  };

  const handleRestart = async () => {
    wasConnectedRef.current = false;
    setHasEnded(false);
    setMicError(null);
    try {
      if (session.end) {
        session.end();
      }
    } catch (e) {}
    await handleStartCall();
  };

  return (
    <AnimatePresence mode="wait">
      {/* Microphone Error State */}
      {micError && (
        <motion.div key="mic-error" {...VIEW_MOTION_PROPS}>
          <MicErrorView errorType={micError} onRetry={handleStartCall} />
        </motion.div>
      )}

      {/* Call Ended State */}
      {!micError && !isConnected && hasEnded && (
        <motion.div key="call-ended" {...VIEW_MOTION_PROPS}>
          <CallEndedView onRestart={handleRestart} />
        </motion.div>
      )}

      {/* Ready / Connecting State */}
      {!micError && !isConnected && !hasEnded && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
          isConnecting={isConnecting || isStarting}
        />
      )}

      {/* Active Session State (Listening / Speaking) */}
      {isConnected && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}
