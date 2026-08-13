import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const res = runPythonDbApi(['get_analytics_summary']);
    return NextResponse.json(res);
  } catch (error) {
    console.error('[API /api/analytics/summary] Error:', error);
    return NextResponse.json(
      {
        success: false,
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        success_rate: 0,
        error: 'Failed to retrieve analytics summary',
      },
      { status: 500 }
    );
  }
}
