import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';
    const channel = searchParams.get('channel') || 'null';
    const language = searchParams.get('language') || 'null';
    const intent = searchParams.get('intent') || 'null';
    const outcome = searchParams.get('outcome') || 'null';
    const search = searchParams.get('search') || 'null';

    const res = runPythonDbApi([
      'get_recent_calls',
      limit,
      offset,
      channel,
      language,
      intent,
      outcome,
      search,
    ]);

    return NextResponse.json(res);
  } catch (error) {
    console.error('[API /api/analytics/calls] Error:', error);
    return NextResponse.json(
      { success: false, calls: [], total: 0, error: 'Failed to retrieve calls' },
      { status: 500 }
    );
  }
}
