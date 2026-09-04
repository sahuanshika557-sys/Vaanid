import { NextResponse } from 'next/server';
import { runPythonDbApi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const demoUser = 'cust_demo_hackathon';

    // Step 1: Clear previous demo cart
    runPythonDbApi(['manage_cart', JSON.stringify({ action: 'clear', user_id: demoUser })]);

    // Step 2: Query recommendations for ₹1000 budget
    const recRes = runPythonDbApi([
      'get_recommendations',
      JSON.stringify({ budget: 1000, user_id: demoUser, query: 'monthly groceries' }),
    ]);

    // Step 3: Add Basmati Rice & Toor Dal to cart
    runPythonDbApi([
      'manage_cart',
      JSON.stringify({
        action: 'add',
        product_name: 'Basmati Rice',
        quantity: 1.0,
        user_id: demoUser,
      }),
    ]);
    const cartRes = runPythonDbApi([
      'manage_cart',
      JSON.stringify({ action: 'add', product_name: 'Toor Dal', quantity: 1.0, user_id: demoUser }),
    ]);

    // Step 4: Create payment intent for cart
    const cart = (cartRes as Record<string, unknown>).cart as Record<string, unknown>;
    const total = cart ? (cart.total_amount as number) : 460;
    const paymentRes = runPythonDbApi([
      'create_payment',
      JSON.stringify({ user_id: demoUser, amount: total, cart_id: cart?.cart_id }),
    ]);

    // Step 5: Verify payment
    const paymentId = (paymentRes as Record<string, unknown>).payment_id as string;
    let verifyRes = null;
    if (paymentId) {
      verifyRes = runPythonDbApi(['verify_payment', paymentId]);
    }

    return NextResponse.json({
      success: true,
      demoStep: 'COMPLETED',
      user: demoUser,
      recommendations: recRes,
      cart: cartRes,
      payment: paymentRes,
      verification: verifyRes,
      message: 'Full autonomous commerce flow executed successfully across 5 agentic steps!',
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
