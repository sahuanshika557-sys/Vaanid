import { useEffect } from 'react';
import { useAgent, useSessionContext } from '@livekit/components-react';

export function useAgentErrors() {
  const agent = useAgent();
  const { isConnected } = useSessionContext();

  useEffect(() => {
    if (!isConnected || agent.state !== 'failed') {
      return;
    }

    // Grace period for cloud container cold start / WebRTC track handshake
    const timer = setTimeout(() => {
      if (agent.state === 'failed') {
        console.warn(
          '[useAgentErrors] Agent state reported failed during session initialization:',
          agent.failureReasons
        );
        // Do NOT forcibly terminate (end()) the room so the call stays alive and can recover seamlessly
      }
    }, 45_000);

    return () => clearTimeout(timer);
  }, [agent.state, agent.failureReasons, isConnected]);
}
