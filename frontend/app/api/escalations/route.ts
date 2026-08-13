import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'null';
    const urgency = searchParams.get('urgency') || 'null';
    const search = searchParams.get('search') || 'null';

    const res = runPythonDbApi(['get_escalations', status, urgency, search]) as {
      error?: string;
      escalations?: unknown[];
    };

    if (res.error) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    const list = Array.isArray(res.escalations) ? res.escalations : [];
    return NextResponse.json({
      success: true,
      count: list.length,
      escalations: list,
    });
  } catch (err: unknown) {
    console.error('[API /api/escalations GET Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch escalations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = runPythonDbApi(['create', JSON.stringify(body)]);

    if (res.error) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json(res);
  } catch (err: unknown) {
    console.error('[API /api/escalations POST Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create escalation' },
      { status: 500 }
    );
  }
}
