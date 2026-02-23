'use client';

import { useAuth } from '@/hooks/useAuth';

export default function PricelistPage() {
  const { user } = useAuth();

  const canDownloadWholesale =
    user?.role === 'wholesaler' || user?.role === 'manager' || user?.role === 'admin';

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Прайс-листи</h2>
      <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
        Завантажте актуальний прайс-лист у форматі PDF
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Retail pricelist */}
        <a
          href="/api/v1/pricelist?type=retail"
          download
          className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]"
        >
          <svg
            className="h-10 w-10 text-[var(--color-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <span className="text-sm font-medium">Роздрібний прайс-лист</span>
          <span className="text-xs text-[var(--color-text-secondary)]">PDF</span>
        </a>

        {/* Wholesale pricelist */}
        {canDownloadWholesale ? (
          <a
            href="/api/v1/pricelist?type=wholesale"
            download
            className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]"
          >
            <svg
              className="h-10 w-10 text-[var(--color-primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span className="text-sm font-medium">Оптовий прайс-лист</span>
            <span className="text-xs text-[var(--color-text-secondary)]">PDF</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 opacity-50">
            <svg
              className="h-10 w-10 text-[var(--color-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span className="text-sm font-medium">Оптовий прайс-лист</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Доступний для оптових клієнтів
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
