import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'create';

    if (action === 'verify') {
      const paymentId = body.paymentId || '';
      const res = runPythonDbApi(['verify_payment', paymentId]);
      return NextResponse.json(res);
    }

    const res = runPythonDbApi(['create_payment', JSON.stringify(body)]);
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
