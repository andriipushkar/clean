import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { publishImagePost, publishReelsPost, postFirstComment } from '@/services/instagram';

export class PublicationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PublicationError';
  }
}

interface CreatePublicationInput {
  title: string;
  content: string;
  imagePath?: string;
  productId?: number;
  channels: string[]; // ['telegram', 'viber', 'site']
  hashtags?: string;
  buttons?: { text: string; url: string }[];
  scheduledAt?: string;
}

export async function createPublication(input: CreatePublicationInput, userId: number) {
  const status = input.scheduledAt ? 'scheduled' : 'draft';

  return prisma.publication.create({
    data: {
      title: input.title,
      content: input.content,
      imagePath: input.imagePath,
      productId: input.productId,
      channels: input.channels,
      hashtags: input.hashtags,
      buttons: input.buttons,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      status: status as 'draft' | 'scheduled',
      createdBy: userId,
    },
  });
}

export async function getPublications(params: { page?: number; limit?: number; status?: string } = {}) {
  const { page = 1, limit = 20, status } = params;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [publications, total] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: { select: { fullName: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.publication.count({ where }),
  ]);

  return { publications, total };
}

export async function updatePublication(
  id: number,
  data: Partial<Omit<CreatePublicationInput, 'channels'>> & { channels?: string[]; status?: string }
) {
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) throw new PublicationError('Публікацію не знайдено', 404);

  const validStatuses = ['draft', 'scheduled', 'published', 'failed'] as const;
  const status = data.status && validStatuses.includes(data.status as typeof validStatuses[number])
    ? (data.status as typeof validStatuses[number])
    : undefined;

  return prisma.publication.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.imagePath !== undefined && { imagePath: data.imagePath }),
      ...(data.channels !== undefined && { channels: data.channels }),
      ...(data.hashtags !== undefined && { hashtags: data.hashtags }),
      ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
      ...(status !== undefined && { status }),
    },
  });
}

export async function deletePublication(id: number) {
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) throw new PublicationError('Публікацію не знайдено', 404);
  if (pub.status === 'published') throw new PublicationError('Не можна видалити опубліковану публікацію', 400);

  await prisma.publication.delete({ where: { id } });
}

export async function publishNow(publicationId: number) {
  const pub = await prisma.publication.findUnique({ where: { id: publicationId } });
  if (!pub) throw new PublicationError('Публікацію не знайдено', 404);

  const channels = pub.channels as string[];
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  // Publish to Telegram channel
  if (channels.includes('telegram') && process.env.TELEGRAM_CHANNEL_ID && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHANNEL_ID,
          text: `<b>${pub.title}</b>\n\n${pub.content}${pub.hashtags ? `\n\n${pub.hashtags}` : ''}`,
          parse_mode: 'HTML',
          reply_markup: pub.buttons
            ? {
                inline_keyboard: (pub.buttons as { text: string; url: string }[]).map((b) => [
                  { text: b.text, url: b.url },
                ]),
              }
            : undefined,
        }),
      });
    } catch (err) {
      console.error('Telegram publish error:', err);
    }
  }

  // Publish to Viber community
  if (channels.includes('viber') && process.env.VIBER_AUTH_TOKEN) {
    try {
      // Viber broadcast to subscribers
      await fetch('https://chatapi.viber.com/pa/broadcast_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': process.env.VIBER_AUTH_TOKEN },
        body: JSON.stringify({
          type: 'text',
          text: `${pub.title}\n\n${pub.content}`,
          min_api_version: 7,
        }),
      });
    } catch (err) {
      console.error('Viber publish error:', err);
    }
  }

  // Publish to Instagram
  if (channels.includes('instagram') && env.INSTAGRAM_ACCESS_TOKEN && env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    try {
      const caption = `${pub.title}\n\n${pub.content}${pub.hashtags ? `\n\n${pub.hashtags}` : ''}`;
      const imageUrl = pub.imagePath ? `${appUrl}${pub.imagePath}` : '';

      let result: { igMediaId: string; igPermalink: string } | null = null;

      // Check if publication has video images (Reels)
      const images = await prisma.publicationImage.findMany({
        where: { publicationId },
        orderBy: { sortOrder: 'asc' },
      });
      const videoImage = images.find(
        (img) => img.imagePath.endsWith('.mp4') || img.imagePath.endsWith('.mov')
      );

      if (videoImage) {
        // Publish as Reels
        const videoUrl = `${appUrl}${videoImage.imagePath}`;
        const coverImage = images.find(
          (img) => !img.imagePath.endsWith('.mp4') && !img.imagePath.endsWith('.mov')
        );
        result = await publishReelsPost(
          videoUrl,
          caption,
          coverImage ? `${appUrl}${coverImage.imagePath}` : undefined
        );
      } else if (imageUrl) {
        result = await publishImagePost(imageUrl, caption);
      }

      if (result) {
        await prisma.publication.update({
          where: { id: publicationId },
          data: {
            igMediaId: result.igMediaId,
            igPermalink: result.igPermalink,
          },
        });

        // Post first comment if configured
        if (pub.firstComment) {
          try {
            await postFirstComment(result.igMediaId, pub.firstComment);
          } catch (commentErr) {
            console.error('Instagram first comment error:', commentErr);
          }
        }
      }
    } catch (err) {
      console.error('Instagram publish error:', err);
    }
  }

  return prisma.publication.update({
    where: { id: publicationId },
    data: { status: 'published', publishedAt: new Date() },
  });
}
