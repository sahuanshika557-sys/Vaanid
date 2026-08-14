'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RoomEvent } from 'livekit-client';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { DebugPanel } from '@/components/agents-ui/debug-panel';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0.8,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

interface CatalogueInfo {
  status: 'checking' | 'found' | 'error';
  title?: string;
  priceInfo?: string;
  stockInfo?: string;
  errorMessage?: string;
}

interface EscalationInfo {
  status: 'creating' | 'created' | 'duplicate' | 'failed' | 'denied';
  referenceId?: string;
  isDuplicate?: boolean;
  message?: string;
}

interface HandoffInfo {
  status: 'transferring' | 'active';
  agent: string;
  agentName: string;
}

function AgentStatusHeader({
  agentState,
  catalogueInfo,
  escalationInfo,
  handoffInfo,
}: {
  agentState?: string;
  catalogueInfo?: CatalogueInfo | null;
  escalationInfo?: EscalationInfo | null;
  handoffInfo?: HandoffInfo | null;
}) {
  let badgeColor = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  let dotColor = 'bg-emerald-400 animate-pulse';
  let label = handoffInfo?.agentName
    ? `✨ ${handoffInfo.agentName}`
    : '🎤 Listening to you';

  if (handoffInfo?.status === 'transferring') {
    badgeColor = 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    dotColor = 'bg-amber-400 animate-ping';
    label = `🔄 Connecting to ${handoffInfo.agentName}...`;
  } else if (agentState === 'speaking') {
    badgeColor = 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
    dotColor = 'bg-indigo-400 animate-bounce';
    label = handoffInfo?.agentName
      ? `🔊 ${handoffInfo.agentName} is speaking`
      : '🔊 Your assistant is speaking';
  } else if (agentState === 'thinking') {
    badgeColor = 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    dotColor = 'bg-amber-400 animate-ping';
    label =
      handoffInfo?.status === 'transferring'
        ? `🔄 Connecting to ${handoffInfo.agentName}...`
        : escalationInfo?.status === 'creating'
          ? '📑 Preparing human support request...'
          : catalogueInfo?.status === 'checking'
            ? '🔎 Checking catalogue...'
            : '💭 Assistant is thinking...';
  } else if (agentState === 'connecting' || agentState === 'initializing') {
    badgeColor = 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    dotColor = 'bg-blue-400 animate-spin';
    label = '⚡ Connecting to voice assistant...';
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 md:top-6">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide shadow-lg backdrop-blur-md transition-all duration-300',
          badgeColor
        )}
      >
        <span className={cn('size-2 rounded-full', dotColor)} />
        <span>{label}</span>
      </div>

      {/* Specialist Agent Handoff Visual Activity Card */}
      <AnimatePresence>
        {handoffInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto max-w-sm rounded-xl border border-indigo-500/40 bg-slate-950/90 px-4 py-3 shadow-2xl backdrop-blur-md"
          >
            {handoffInfo.status === 'transferring' ? (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-400">
                <span className="size-2.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <span>🔄 Connecting to {handoffInfo.agentName}...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-400">
                  <span className="size-2 animate-pulse rounded-full bg-indigo-400" />
                  <span>✨ Specialist Connected</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {handoffInfo.agentName} is helping you
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escalation Status Activity Card */}
      <AnimatePresence>
        {escalationInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto max-w-sm rounded-xl border border-emerald-500/40 bg-slate-950/90 px-4 py-3 shadow-2xl backdrop-blur-md"
          >
            {escalationInfo.status === 'creating' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span className="size-2 animate-ping rounded-full bg-amber-400" />
                <span>Preparing Human Support Request...</span>
              </div>
            )}
            {(escalationInfo.status === 'created' || escalationInfo.status === 'duplicate') && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span>🎧 Support Request Created</span>
                </div>
                <div className="font-mono text-sm font-extrabold text-white">
                  Ref ID: {escalationInfo.referenceId}
                </div>
                <div className="text-[11px] text-slate-300">{escalationInfo.message}</div>
              </div>
            )}
            {escalationInfo.status === 'failed' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                <span>⚠️</span>
                <span>Could not create support request. Please try again.</span>
              </div>
            )}
            {escalationInfo.status === 'denied' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span>🔒</span>
                <span>Request cancelled — information kept private.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Catalogue Tool Activity Card */}
      <AnimatePresence>
        {!escalationInfo && catalogueInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="border-border/60 bg-background/80 pointer-events-auto max-w-sm rounded-xl border px-4 py-2.5 shadow-xl backdrop-blur-md"
          >
            {catalogueInfo.status === 'checking' && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                <span className="size-2 animate-ping rounded-full bg-amber-400" />
                <span>🔎 Checking catalogue...</span>
              </div>
            )}
            {catalogueInfo.status === 'found' && (
              <div className="flex flex-col gap-0.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span>📦 Product Found</span>
                </div>
                <div className="text-foreground font-semibold">{catalogueInfo.title}</div>
                {catalogueInfo.priceInfo && (
                  <div className="text-muted-foreground">{catalogueInfo.priceInfo}</div>
                )}
                {catalogueInfo.stockInfo && (
                  <div className="text-xs font-medium text-emerald-500">
                    {catalogueInfo.stockInfo}
                  </div>
                )}
              </div>
            )}
            {catalogueInfo.status === 'error' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                <span>⚠️</span>
                <span>{catalogueInfo.errorMessage || 'Catalogue temporarily unavailable'}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
}

export function AgentSessionView_01({
  preConnectMessage = 'Anisha is listening, ask about products, shop info, or local services',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,

  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { state: agentState } = useAgent();
  const [escalationInfo, setEscalationInfo] = useState<EscalationInfo | null>(null);
  const [catalogueInfo, setCatalogueInfo] = useState<CatalogueInfo | null>(null);
  const [handoffInfo, setHandoffInfo] = useState<HandoffInfo | null>(null);

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  // Set checking state when agent is thinking & log pipeline transitions
  useEffect(() => {
    if (agentState === 'listening') {
      console.log('[VOICE_PIPELINE] USER_SPEECH_DETECTED: Agent is listening to audio input.');
    } else if (agentState === 'thinking') {
      console.log('[VOICE_PIPELINE] STT_STARTED / THINKING: Processing transcript & LLM decision.');
      if (!escalationInfo) {
        setCatalogueInfo({ status: 'checking' });
      }
    } else if (agentState === 'speaking') {
      console.log('[VOICE_PIPELINE] TTS_STARTED & TTS_AUDIO_RECEIVED: Playing agent audio output.');
      const timer = setTimeout(() => {
        setCatalogueInfo(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [agentState, escalationInfo]);

  // Log user transcript reception
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.from?.isAgent === false && lastMsg.message) {
        console.log('[VOICE_PIPELINE] USER_TRANSCRIPT_RECEIVED:', lastMsg.message);
      }
    }
  }, [messages]);

  // Listen to LiveKit data channel events for catalogue_status, escalation_status, and agent_handoff
  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: unknown,
      kind?: unknown,
      topic?: string
    ) => {
      if (topic === 'agent_handoff') {
        try {
          const strVal = new TextDecoder().decode(payload);
          const parsed = JSON.parse(strVal);
          setHandoffInfo({
            status: parsed.status,
            agent: parsed.agent,
            agentName: parsed.agent_name,
          });
          if (parsed.status === 'active') {
            setTimeout(() => setHandoffInfo(null), 8000);
          }
        } catch (err) {
          console.warn('Failed to parse agent_handoff event:', err);
        }
        return;
      }

      if (topic === 'catalogue_status') {
        try {
          const strVal = new TextDecoder().decode(payload);
          const parsed = JSON.parse(strVal);
          const data = parsed.data;

          if (parsed.tool_name === 'create_escalation') {
            setEscalationInfo({
              status: data.status,
              referenceId: data.reference_id,
              isDuplicate: data.is_duplicate,
              message: data.message,
            });
            setTimeout(() => setEscalationInfo(null), 8000);
            return;
          }

          if (data && data.found) {
            setCatalogueInfo({
              status: 'found',
              title: data.product_name,
              priceInfo: `₹${data.price} / ${data.unit}`,
              stockInfo: data.stock_status,
            });
          } else if (data && data.success && data.items) {
            setCatalogueInfo({
              status: 'found',
              title: `Estimated Total: ₹${data.total}`,
              priceInfo: `${data.items.length} item(s) calculated`,
              stockInfo: 'Order calculation completed',
            });
          } else if (data && (!data.success || data.error)) {
            setCatalogueInfo({
              status: 'error',
              errorMessage: data.message || 'Catalogue temporarily unavailable',
            });
          }
        } catch (err) {
          console.warn('Failed to parse catalogue_status event:', err);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [session.room]);

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      <AgentStatusHeader
        agentState={agentState}
        catalogueInfo={catalogueInfo}
        escalationInfo={escalationInfo}
        handoffInfo={handoffInfo}
      />

      <Fade top className="absolute inset-x-4 top-0 z-10 h-40" />
      {/* transcript */}

      <div className="absolute top-0 bottom-[135px] flex w-full flex-col md:bottom-[170px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3 transition-opacity duration-300 ease-out"
            >
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                className="mx-auto w-full max-w-2xl [&_.is-user>div]:rounded-[22px] [&>div>div]:px-4 [&>div>div]:pt-40 md:[&>div>div]:px-6"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Tile layout */}
      <TileLayout
        chatOpen={chatOpen}
        audioVisualizerType={audioVisualizerType}
        audioVisualizerColor={audioVisualizerColor}
        audioVisualizerColorShift={audioVisualizerColorShift}
        audioVisualizerBarCount={audioVisualizerBarCount}
        audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
        audioVisualizerRadialRadius={audioVisualizerRadialRadius}
        audioVisualizerGridRowCount={audioVisualizerGridRowCount}
        audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
        audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
      />
      {/* Bottom */}
      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {/* Pre-connect message */}
        {isPreConnectBufferEnabled && (
          <AnimatePresence>
            {messages.length === 0 && (
              <MotionMessage
                key="pre-connect-message"
                duration={2}
                aria-hidden={messages.length > 0}
                {...SHIMMER_MOTION_PROPS}
                className="pointer-events-none mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold"
              >
                {preConnectMessage}
              </MotionMessage>
            )}
          </AnimatePresence>
        )}
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar
            variant="livekit"
            controls={controls}
            isChatOpen={chatOpen}
            isConnected={session.isConnected}
            onDisconnect={session.end}
            onIsChatOpenChange={setChatOpen}
            onDeviceError={(err) => console.warn('Media device error suppressed:', err)}
          />
        </div>
      </motion.div>
      <DebugPanel />
    </section>
  );
}
