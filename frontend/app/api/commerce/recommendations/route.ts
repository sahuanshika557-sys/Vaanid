import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = runPythonDbApi(['get_recommendations', JSON.stringify(body)]);
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
