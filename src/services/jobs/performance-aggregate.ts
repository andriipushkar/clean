import { aggregateDailyMetrics } from '@/services/performance';

/**
 * BullMQ job: aggregate performance metrics from Redis into DB.
 * Runs daily via cron, processing previous day's data.
 */
export async function performanceAggregateJob() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  await aggregateDailyMetrics(dateStr);
  return { date: dateStr, status: 'completed' };
}
