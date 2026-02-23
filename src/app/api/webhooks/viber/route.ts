import { NextRequest, NextResponse } from 'next/server';
import { handleViberEvent, verifyViberSignature } from '@/services/viber';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-viber-content-signature') || '';

    if (!verifyViberSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(rawBody);

    // Process asynchronously
    handleViberEvent(event).catch((err) => console.error('Viber processing error:', err));

    return NextResponse.json({ status: 0 });
  } catch {
    return NextResponse.json({ status: 0 }); // Always return success to Viber
  }
}
