import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const res = runPythonDbApi(['get_followups', status || 'null']);
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, status } = body;
    const res = runPythonDbApi(['update_followup', suggestionId, status || 'APPROVED']);
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
