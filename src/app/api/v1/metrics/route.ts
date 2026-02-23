import { NextRequest } from 'next/server';
import { recordMetric } from '@/services/performance';

const VALID_METRICS = ['LCP', 'CLS', 'FID', 'TTFB', 'INP', 'FCP'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { route, metric, value } = body;

    if (!route || !metric || typeof value !== 'number') {
      return new Response(null, { status: 400 });
    }

    if (!VALID_METRICS.includes(metric)) {
      return new Response(null, { status: 400 });
    }

    // Fire and forget — don't block
    recordMetric({ route, metric, value }).catch(() => {});

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
