import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '25';
    const res = runPythonDbApi(['get_commerce_events', limit]);
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
