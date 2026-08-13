import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    const res = runPythonDbApi(['get_analytics_trends', timeframe]);
    return NextResponse.json(res);
  } catch (error) {
    console.error('[API /api/analytics/trends] Error:', error);
    return NextResponse.json(
      { success: false, trends: [], error: 'Failed to retrieve analytics trends' },
      { status: 500 }
    );
  }
}
