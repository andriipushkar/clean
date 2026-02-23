import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getPageBySlug } from '@/services/static-page';
import { sanitizeHtml } from '@/utils/sanitize';

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: 'Сторінку не знайдено' };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <Container className="py-6">
      <Breadcrumbs
        items={[
          { label: 'Головна', href: '/' },
          { label: page.title },
        ]}
        className="mb-6"
      />

      <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
      />
    </Container>
  );
}
