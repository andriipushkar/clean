import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 12));

    const where = {
      status: 'published' as const,
      publishedAt: { not: null },
    };

    // Get total count of published publications
    const allPublished = await prisma.publication.findMany({
      where,
      select: {
        id: true,
        channels: true,
      },
    });

    // Filter for publications that include 'site' channel
    // channels is a Json field stored as a string array in PostgreSQL
    const sitePublicationIds = allPublished
      .filter((p) => {
        const channels = p.channels;
        return Array.isArray(channels) && (channels as string[]).includes('site');
      })
      .map((p) => p.id);

    const total = sitePublicationIds.length;
    const skip = (page - 1) * limit;

    // Paginate from the filtered IDs
    const paginatedIds = sitePublicationIds.slice(skip, skip + limit);

    const publications = paginatedIds.length > 0
      ? await prisma.publication.findMany({
          where: { id: { in: paginatedIds } },
          select: {
            id: true,
            title: true,
            content: true,
            imagePath: true,
            hashtags: true,
            publishedAt: true,
            product: {
              select: { id: true, name: true, slug: true },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { publishedAt: 'desc' },
        })
      : [];

    return successResponse({
      publications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
