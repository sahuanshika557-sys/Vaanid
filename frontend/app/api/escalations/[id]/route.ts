import { NextRequest, NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = runPythonDbApi(['get_by_ref', id]);

    if (!res.escalation) {
      return NextResponse.json({ success: false, error: 'Escalation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, escalation: res.escalation });
  } catch (err: unknown) {
    console.error('[API /api/escalations/[id] GET Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch escalation details' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
    const cleanStatus = (status || '').toUpperCase().trim();

    if (!validStatuses.includes(cleanStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const res = runPythonDbApi(['update_status', id, cleanStatus]);

    if (!res.escalation) {
      return NextResponse.json(
        { success: false, error: 'Escalation record not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Escalation status updated to ${cleanStatus}`,
      escalation: res.escalation,
    });
  } catch (err: unknown) {
    console.error('[API /api/escalations/[id] PATCH Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update escalation status' },
      { status: 500 }
    );
  }
}
