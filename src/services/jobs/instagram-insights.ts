import { env } from '@/config/env';
import { prisma } from '@/lib/prisma';

interface InsightMetric {
  name: string;
  period: string;
  values: { value: number; end_time: string }[];
}

/**
 * Fetch daily Instagram Insights and store them in analytics.
 */
export async function collectInstagramInsights(): Promise<{
  collected: boolean;
  metricsCount: number;
  error?: string;
}> {
  if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return { collected: false, metricsCount: 0, error: 'Instagram credentials not configured' };
  }

  try {
    const metrics = 'impressions,reach,profile_views';
    const url = `https://graph.facebook.com/v18.0/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/insights?metric=${metrics}&period=day&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const body = await res.text();
      return { collected: false, metricsCount: 0, error: `Instagram API error: ${res.status} ${body}` };
    }

    const data = await res.json() as { data: InsightMetric[] };
    let metricsCount = 0;

    for (const metric of data.data) {
      for (const value of metric.values) {
        await prisma.clientEvent.create({
          data: {
            eventType: `instagram_${metric.name}`,
            metadata: { value: value.value, endTime: value.end_time },
            createdAt: new Date(value.end_time),
          },
        });
        metricsCount++;
      }
    }

    return { collected: true, metricsCount };
  } catch (err) {
    return {
      collected: false,
      metricsCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
