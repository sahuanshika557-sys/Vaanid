import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export async function POST() {
  try {
    const sampleCalls = [
      {
        call_id: 'call_demo_101',
        user_id: 'cust_ramesh',
        channel: 'BROWSER',
        started_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 2 + 84 * 1000).toISOString(),
        language: 'Hindi',
        intent: 'PRODUCT_ENQUIRY',
        outcome: 'SUCCESS',
        failure_reason: 'NONE',
        escalated: false,
        success_condition: 'Catalogue price for Basmati Rice provided',
      },
      {
        call_id: 'call_demo_102',
        user_id: 'cust_priya',
        channel: 'BROWSER',
        started_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 5 + 120 * 1000).toISOString(),
        language: 'Hinglish',
        intent: 'ORDER_STATUS',
        outcome: 'SUCCESS',
        failure_reason: 'NONE',
        escalated: false,
        success_condition: 'Order ORD_101 status verified as PENDING',
      },
      {
        call_id: 'call_demo_103',
        user_id: 'cust_radhika',
        channel: 'BROWSER',
        started_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 8 + 45 * 1000).toISOString(),
        language: 'Hindi',
        intent: 'PAYMENT_ISSUE',
        outcome: 'SUCCESS',
        failure_reason: 'NONE',
        escalated: true,
        success_condition: 'Escalation created for payment refund issue',
      },
      {
        call_id: 'call_demo_104',
        user_id: 'cust_anon_51',
        channel: 'SIP',
        started_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 12 + 65 * 1000).toISOString(),
        language: 'English',
        intent: 'CATALOGUE_LOOKUP',
        outcome: 'SUCCESS',
        failure_reason: 'NONE',
        escalated: false,
        success_condition: 'Order total calculated for 2 items',
      },
      {
        call_id: 'call_demo_105',
        user_id: 'cust_anon_92',
        channel: 'BROWSER',
        started_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 18 + 12 * 1000).toISOString(),
        language: 'English',
        intent: 'OTHER',
        outcome: 'FAILED',
        failure_reason: 'USER_HANGUP',
        escalated: false,
        success_condition: null,
      },
      {
        call_id: 'call_demo_106',
        user_id: 'cust_anand',
        channel: 'SIP',
        started_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        ended_at: new Date(Date.now() - 3600 * 1000 * 24 + 92 * 1000).toISOString(),
        language: 'English',
        intent: 'ORDER_DISPUTE',
        outcome: 'SUCCESS',
        failure_reason: 'NONE',
        escalated: true,
        success_condition: 'Damaged item dispute escalated',
      },
    ];

    for (const c of sampleCalls) {
      runPythonDbApi(['start_call', JSON.stringify(c)]);
      runPythonDbApi(['finalize_call', JSON.stringify(c)]);
    }

    return NextResponse.json({ success: true, count: sampleCalls.length });
  } catch (error) {
    console.error('[API /api/analytics/seed] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
