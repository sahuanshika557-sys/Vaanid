import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const res = runPythonDbApi(['get_analytics_breakdowns']);
    return NextResponse.json(res);
  } catch (error) {
    console.error('[API /api/analytics/breakdowns] Error:', error);
    return NextResponse.json(
      {
        success: false,
        channels: { BROWSER: 0, SIP: 0 },
        languages: { English: 0, Hindi: 0, Hinglish: 0 },
        intents: {},
        escalations: { total: 0, open: 0, in_progress: 0, resolved: 0 },
      },
      { status: 500 }
    );
  }
}
