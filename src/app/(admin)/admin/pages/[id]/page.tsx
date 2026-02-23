'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import WysiwygEditor from '@/components/admin/WysiwygEditor';

interface StaticPage {
  id: number;
  title: string;
  slug: string;
  contentHtml: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export default function AdminPageEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    contentHtml: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    sortOrder: 0,
  });

  useEffect(() => {
    apiClient
      .get<StaticPage>(`/api/v1/admin/pages/${id}`)
      .then((res) => {
        if (res.success && res.data) {
          setPage(res.data);
          setForm({
            title: res.data.title,
            slug: res.data.slug,
            contentHtml: res.data.contentHtml || '',
            metaTitle: res.data.metaTitle || '',
            metaDescription: res.data.metaDescription || '',
            isPublished: res.data.isPublished,
            sortOrder: res.data.sortOrder,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await apiClient.put(`/api/v1/admin/pages/${id}`, form);
      if (res.success) {
        setMessage({ type: 'success', text: 'Збережено!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Помилка збереження' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Помилка мережі' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  }

  if (!page) {
    return (
      <div className="text-center">
        <p className="text-[var(--color-text-secondary)]">Сторінку не знайдено</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/pages')}>До списку</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/pages" className="text-sm text-[var(--color-primary)] hover:underline">← Сторінки</Link>
          <h2 className="mt-1 text-xl font-bold">{page.title}</h2>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>Зберегти</Button>
      </div>

      {message && (
        <div className={`mb-4 rounded-[var(--radius)] p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[var(--color-danger)]'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Заголовок *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-[var(--color-primary)]" />
              Опубліковано
            </label>
            <Input label="Порядок" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-24" />
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h3 className="mb-3 text-sm font-semibold">Вміст</h3>
          <WysiwygEditor value={form.contentHtml} onChange={(html) => setForm({ ...form, contentHtml: html })} placeholder="Введіть вміст сторінки..." />
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h3 className="mb-3 text-sm font-semibold">SEO</h3>
          <div className="space-y-4">
            <Input label="Meta Title" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
            <div>
              <label className="mb-1 block text-sm font-medium">Meta Description</label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                rows={3}
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
