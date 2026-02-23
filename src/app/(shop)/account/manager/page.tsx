'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';

interface ManagerInfo {
  id: number;
  fullName: string | null;
  email: string;
  phone: string | null;
}

export default function AccountManagerPage() {
  const { user } = useAuth();
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ assignedManager: ManagerInfo | null }>('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data) {
          setManager((res.data as unknown as { assignedManager: ManagerInfo | null }).assignedManager || null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (user?.role !== 'wholesaler') {
    return (
      <div className="py-8 text-center text-[var(--color-text-secondary)]">
        Розділ доступний тільки для оптових клієнтів
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Мій менеджер</h2>

      {manager ? (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-2xl font-bold text-[var(--color-primary)]">
              {(manager.fullName || manager.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold">{manager.fullName || 'Менеджер'}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{manager.email}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {manager.phone && (
              <a
                href={`tel:${manager.phone}`}
                className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Зателефонувати
              </a>
            )}
            <a
              href={`mailto:${manager.email}`}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-bg-secondary)]"
            >
              Написати Email
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-center">
          <p className="text-[var(--color-text-secondary)]">Персональний менеджер ще не призначений</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Зверніться на загальну лінію підтримки
          </p>
        </div>
      )}
    </div>
  );
}
