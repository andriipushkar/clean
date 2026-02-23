'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  convertedCount: number;
  totalBonusValue: number;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient
      .get<ReferralStats>('/api/v1/me/referral')
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!stats) return;
    await navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  }

  if (!stats) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Не вдалося завантажити дані</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Реферальна програма</h2>

      <div className="mb-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="mb-2 text-sm font-medium">Ваше реферальне посилання</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={stats.referralLink}
            className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm"
          />
          <button
            onClick={handleCopy}
            className="rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            {copied ? 'Скопійовано!' : 'Копіювати'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          Код: <strong>{stats.referralCode}</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Запрошено</p>
          <p className="text-2xl font-bold">{stats.totalReferred}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Здійснили покупку</p>
          <p className="text-2xl font-bold">{stats.convertedCount}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Отримано бонусів</p>
          <p className="text-2xl font-bold">{stats.totalBonusValue.toFixed(0)} ₴</p>
        </div>
      </div>
    </div>
  );
}
