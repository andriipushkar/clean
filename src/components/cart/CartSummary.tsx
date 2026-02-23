'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

interface CartSummaryProps {
  itemCount: number;
  total: number;
  isCheckoutDisabled?: boolean;
  disabledReason?: string;
}

export default function CartSummary({ itemCount, total, isCheckoutDisabled, disabledReason }: CartSummaryProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Разом</h2>

      <div className="space-y-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Товарів: {itemCount}
          </span>
          <span>{total.toFixed(2)} ₴</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Доставка</span>
          <span className="text-[var(--color-text-secondary)]">за тарифами перевізника</span>
        </div>
      </div>

      <div className="flex justify-between py-4 text-lg font-bold">
        <span>До сплати</span>
        <span>{total.toFixed(2)} ₴</span>
      </div>

      {disabledReason && (
        <p className="mb-3 text-xs text-[var(--color-danger)]">{disabledReason}</p>
      )}

      <Link href="/checkout">
        <Button
          size="lg"
          className="w-full"
          disabled={isCheckoutDisabled}
        >
          Оформити замовлення
        </Button>
      </Link>

      <Link
        href="/catalog"
        className="mt-3 block text-center text-sm text-[var(--color-primary)] hover:underline"
      >
        Продовжити покупки
      </Link>
    </div>
  );
}
