'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';

interface LoyaltyDashboard {
  account: { points: number; totalSpent: number; level: string };
  currentLevel: { name: string; discountPercent: number; pointsMultiplier: number } | null;
  nextLevel: { name: string; minSpent: number } | null;
  recentTransactions: { id: number; type: string; points: number; description: string; createdAt: string }[];
}

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TYPE_LABELS: Record<string, string> = {
  earn: 'Нарахування',
  spend: 'Списання',
  manual_add: 'Ручне нарахування',
  manual_deduct: 'Ручне списання',
  expire: 'Згоряння',
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<LoyaltyDashboard>('/api/v1/me/loyalty')
      .then((res) => {
        if (res.success && res.data) setData(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  }

  if (!data) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Не вдалося завантажити дані</p>;
  }

  const { account, currentLevel, nextLevel, recentTransactions } = data;
  const levelColor = LEVEL_COLORS[account.level] || 'var(--color-primary)';
  const progressToNext = nextLevel
    ? Math.min(100, (account.totalSpent / Number(nextLevel.minSpent)) * 100)
    : 100;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Бонусна програма</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Баланс балів</p>
          <p className="text-3xl font-bold">{account.points}</p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Ваш рівень</p>
          <p className="text-2xl font-bold capitalize" style={{ color: levelColor }}>{account.level}</p>
          {currentLevel && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              Знижка: {currentLevel.discountPercent}% | Множник: x{currentLevel.pointsMultiplier}
            </p>
          )}
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Загальні витрати</p>
          <p className="text-2xl font-bold">{account.totalSpent.toFixed(0)} ₴</p>
        </div>
      </div>

      {nextLevel && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>До рівня <strong className="capitalize">{nextLevel.name}</strong></span>
            <span>{account.totalSpent.toFixed(0)} / {Number(nextLevel.minSpent).toFixed(0)} ₴</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressToNext}%`, backgroundColor: levelColor }}
            />
          </div>
        </div>
      )}

      <h3 className="mb-3 text-sm font-semibold">Останні транзакції</h3>
      <div className="space-y-2">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
            <div>
              <p className="text-sm">{tx.description}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {TYPE_LABELS[tx.type] || tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-sm font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {tx.points > 0 ? '+' : ''}{tx.points}
            </span>
          </div>
        ))}
        {recentTransactions.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--color-text-secondary)]">Немає транзакцій</p>
        )}
      </div>
    </div>
  );
}
