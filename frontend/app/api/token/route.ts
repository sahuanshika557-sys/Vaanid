import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: define the environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const AGENT_NAME = process.env.AGENT_NAME;

// Don't cache token route results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL) {
      return NextResponse.json(
        { error: 'LIVEKIT_URL environment variable is missing' },
        { status: 500 }
      );
    }
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'LIVEKIT_API_KEY environment variable is missing' },
        { status: 500 }
      );
    }
    if (!API_SECRET) {
      return NextResponse.json(
        { error: 'LIVEKIT_API_SECRET environment variable is missing' },
        { status: 500 }
      );
    }

    // Parse room config from request body (if provided).
    const body = await req.json().catch(() => ({}));
    let roomConfig: RoomConfiguration | undefined;
    const effectiveAgentName = AGENT_NAME || process.env.AGENT_NAME || 'Indiabuddy';

    if (body?.room_config) {
      roomConfig = RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true });
    }

    if (
      !roomConfig ||
      !roomConfig.agents ||
      roomConfig.agents.length === 0 ||
      !roomConfig.agents[0].agentName
    ) {
      // Configure explicit agent dispatch so the named agent worker picks up the job when a user joins
      roomConfig = RoomConfiguration.fromJson(
        { agents: [{ agentName: effectiveAgentName }] },
        { ignoreUnknownFields: true }
      );
    }

    // Generate participant token with stable customer identity
    const customerId =
      typeof body?.customer_id === 'string' && body.customer_id.trim().length > 0
        ? body.customer_id.trim()
        : `cust_anon_${Math.floor(Math.random() * 10_000)}`;

    const participantName = 'Customer';
    const participantIdentity = customerId;
    const roomName = `local_commerce_room_${customerId}_${Date.now()}`;

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      roomConfig
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantToken,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
    console.error('[API /api/token]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig?: RoomConfiguration
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
