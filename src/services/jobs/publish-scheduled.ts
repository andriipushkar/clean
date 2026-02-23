import { prisma } from '@/lib/prisma';
import { publishNow } from '@/services/publication';

const MAX_RETRY_COUNT = 3;

/**
 * Publish all scheduled publications whose scheduledAt has passed.
 * Also retries failed publications that haven't exceeded the retry limit.
 * Returns counts of published, failed, and retried publications.
 */
export async function publishScheduledPublications(): Promise<{
  published: number;
  failed: number;
  retried: number;
}> {
  const now = new Date();

  const pending = await prisma.publication.findMany({
    where: {
      OR: [
        // Scheduled publications ready to publish
        {
          status: 'scheduled',
          scheduledAt: { lte: now },
        },
        // Failed publications eligible for retry
        {
          status: 'failed',
          retryCount: { lt: MAX_RETRY_COUNT },
          scheduledAt: { lte: now },
        },
      ],
    },
    select: { id: true, title: true, status: true, retryCount: true },
    orderBy: { scheduledAt: 'asc' },
  });

  if (pending.length === 0) return { published: 0, failed: 0, retried: 0 };

  let published = 0;
  let failed = 0;
  let retried = 0;

  for (const pub of pending) {
    const isRetry = pub.status === 'failed';

    try {
      // Reset status to scheduled before retry attempt
      if (isRetry) {
        await prisma.publication.update({
          where: { id: pub.id },
          data: { status: 'scheduled' },
        });
      }

      await publishNow(pub.id);
      published++;
      if (isRetry) retried++;
    } catch (err) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const newRetryCount = (pub.retryCount || 0) + 1;

      await prisma.publication.update({
        where: { id: pub.id },
        data: {
          status: newRetryCount >= MAX_RETRY_COUNT ? 'failed' : 'failed',
          errorMessage: `[Спроба ${newRetryCount}/${MAX_RETRY_COUNT}] ${errorMessage}`,
          retryCount: newRetryCount,
        },
      });
    }
  }

  return { published, failed, retried };
}
