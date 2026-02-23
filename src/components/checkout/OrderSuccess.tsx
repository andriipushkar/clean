'use client';

import Link from 'next/link';
import { Check } from '@/components/icons';
import Button from '@/components/ui/Button';

interface OrderSuccessProps {
  orderNumber: string;
}

export default function OrderSuccess({ orderNumber }: OrderSuccessProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check size={32} className="text-green-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Замовлення оформлене!</h2>
      <p className="mb-1 text-[var(--color-text-secondary)]">
        Номер замовлення: <strong>{orderNumber}</strong>
      </p>
      <p className="mb-8 max-w-md text-sm text-[var(--color-text-secondary)]">
        Ми надішлемо підтвердження на вашу електронну пошту. Менеджер зв&apos;яжеться з вами для уточнення деталей.
      </p>
      <div className="flex gap-3">
        <Link href="/account/orders">
          <Button variant="outline">Мої замовлення</Button>
        </Link>
        <Link href="/catalog">
          <Button>Продовжити покупки</Button>
        </Link>
      </div>
    </div>
  );
}
