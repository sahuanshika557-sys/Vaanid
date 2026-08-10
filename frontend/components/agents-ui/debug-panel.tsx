'use client';

import React, { useEffect, useState } from 'react';
import { RoomEvent } from 'livekit-client';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';

interface DebugState {
  micStatus: 'CONNECTED' | 'WAITING' | 'MUTED';
  livekitStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  sttStatus: 'READY' | 'LISTENING' | 'IDLE';
  latestTranscript: string;
  toolName: string;
  toolStatus: 'SUCCESS' | 'IDLE' | 'FAILURE';
  ttsStatus: 'PLAYING' | 'IDLE';
}

export function DebugPanel() {
  const session = useSessionContext();
  const { isConnected, room, local } = session;
  const { state: agentState } = useAgent();
  const { messages } = useSessionMessages(session);

  const [debugState, setDebugState] = useState<DebugState>({
    micStatus: 'WAITING',
    livekitStatus: 'DISCONNECTED',
    sttStatus: 'IDLE',
    latestTranscript: '',
    toolName: 'none',
    toolStatus: 'IDLE',
    ttsStatus: 'IDLE',
  });

  useEffect(() => {
    const isMicActive = !!local?.microphoneTrack;
    const isSpeaking = agentState === 'speaking';
    const isListening = agentState === 'listening';

    // Find latest user message
    const userMsgs = messages.filter((m) => m.from?.isAgent === false);
    const lastUserText = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].message : '';

    setDebugState((prev) => ({
      ...prev,
      micStatus: isMicActive ? 'CONNECTED' : 'WAITING',
      livekitStatus: isConnected ? 'CONNECTED' : 'DISCONNECTED',
      sttStatus: isListening ? 'LISTENING' : isConnected ? 'READY' : 'IDLE',
      latestTranscript: lastUserText || prev.latestTranscript,
      ttsStatus: isSpeaking ? 'PLAYING' : 'IDLE',
    }));
  }, [isConnected, agentState, local?.microphoneTrack, messages]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: unknown,
      kind: unknown,
      topic?: string
    ) => {
      if (topic === 'catalogue_status') {
        try {
          const strData = new TextDecoder().decode(payload);
          const data = JSON.parse(strData);
          console.log('[VOICE_PIPELINE] TOOL_CALL_RECEIVED:', data);
          setDebugState((prev) => ({
            ...prev,
            toolName: data.tool || 'catalogue_tool',
            toolStatus: data.status === 'error' ? 'FAILURE' : 'SUCCESS',
          }));
        } catch {
          // ignore
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-xs space-y-1 rounded-xl border border-emerald-500/30 bg-black/85 p-3 font-mono text-xs text-emerald-400 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1 font-bold text-white">
        <span>⚙️ PIPELINE DEBUG</span>
        <span className="text-[10px] text-emerald-500">DEV MODE</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">Microphone:</span>
        <span
          className={
            debugState.micStatus === 'CONNECTED' ? 'font-bold text-emerald-400' : 'text-amber-400'
          }
        >
          {debugState.micStatus}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">LiveKit:</span>
        <span
          className={
            debugState.livekitStatus === 'CONNECTED' ? 'font-bold text-emerald-400' : 'text-red-400'
          }
        >
          {debugState.livekitStatus}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">STT:</span>
        <span className="font-semibold text-emerald-300">{debugState.sttStatus}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">Tool:</span>
        <span className="text-teal-300">{debugState.toolName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">Tool Status:</span>
        <span
          className={
            debugState.toolStatus === 'SUCCESS' ? 'font-bold text-emerald-400' : 'text-zinc-500'
          }
        >
          {debugState.toolStatus}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">TTS:</span>
        <span
          className={
            debugState.ttsStatus === 'PLAYING'
              ? 'animate-pulse font-bold text-indigo-400'
              : 'text-zinc-500'
          }
        >
          {debugState.ttsStatus}
        </span>
      </div>
      {debugState.latestTranscript && (
        <div className="truncate border-t border-zinc-800 pt-1 text-[11px] text-zinc-300">
          💬 &quot;{debugState.latestTranscript}&quot;
        </div>
      )}
    </div>
  );
}
