import { NextRequest } from 'next/server';
import { verifyCallback } from '@/services/payment-providers/monobank';
import { handlePaymentCallback } from '@/services/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const xSign = request.headers.get('X-Sign') || '';

    if (!body || !xSign) {
      return new Response('Missing body or X-Sign', { status: 400 });
    }

    const callbackResult = await verifyCallback(body, xSign);
    await handlePaymentCallback('monobank', callbackResult);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Monobank webhook error:', error);
    return new Response('Error', { status: 200 }); // Return 200 to prevent retries
  }
}
