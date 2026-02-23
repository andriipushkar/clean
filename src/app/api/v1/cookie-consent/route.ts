import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, analyticsAccepted, marketingAccepted } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return errorResponse('sessionId обов\'язковий', 400);
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    const consent = await prisma.cookieConsent.create({
      data: {
        sessionId,
        analyticsAccepted: Boolean(analyticsAccepted),
        marketingAccepted: Boolean(marketingAccepted),
        ipAddress,
      },
    });

    return successResponse(consent, 201);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
