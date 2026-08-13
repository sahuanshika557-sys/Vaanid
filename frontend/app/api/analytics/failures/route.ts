import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const res = runPythonDbApi(['get_analytics_failures']);
    return NextResponse.json(res);
  } catch (error) {
    console.error('[API /api/analytics/failures] Error:', error);
    return NextResponse.json(
      {
        success: false,
        total_failures: 0,
        breakdown: [],
        insight: 'Failed to retrieve failure insights',
      },
      { status: 500 }
    );
  }
}
