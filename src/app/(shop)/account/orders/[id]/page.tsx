'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/types/order';
import type { OrderDetail, OrderStatus } from '@/types/order';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    apiClient
      .get<OrderDetail>(`/api/v1/orders/${id}`)
      .then((res) => {
        if (res.success && res.data) {
          setOrder(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Ви впевнені, що хочете скасувати це замовлення?')) return;
    setIsCancelling(true);
    try {
      const res = await apiClient.put(`/api/v1/orders/${id}/status`, { status: 'cancelled' });
      if (res.success) {
        setOrder((prev) => prev ? { ...prev, status: 'cancelled' as OrderStatus } : prev);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (date: string | Date) =>
    new Date(date).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--color-text-secondary)]">Замовлення не знайдено</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/account/orders')}>
          Повернутись до замовлень
        </Button>
      </div>
    );
  }

  const canCancel = order.status === 'new_order' || order.status === 'processing';

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Головна', href: '/' },
          { label: 'Замовлення', href: '/account/orders' },
          { label: `#${order.orderNumber}` },
        ]}
        className="mb-6"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Замовлення #{order.orderNumber}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            від {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          {canCancel && (
            <Button variant="danger" size="sm" onClick={handleCancel} isLoading={isCancelling}>
              Скасувати
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Контакти</h3>
          <p className="text-sm">{order.contactName}</p>
          <p className="text-sm">{order.contactPhone}</p>
          <p className="text-sm">{order.contactEmail}</p>
        </div>

        {/* Delivery */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Доставка</h3>
          <p className="text-sm">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
          {order.deliveryCity && <p className="text-sm">{order.deliveryCity}</p>}
          {order.deliveryAddress && <p className="text-sm">{order.deliveryAddress}</p>}
          {order.trackingNumber && (
            <p className="mt-1 text-sm">
              ТТН: <strong>{order.trackingNumber}</strong>
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Оплата</h3>
          <p className="text-sm">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          <p className="text-sm">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
        </div>

        {/* Totals */}
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Сума</h3>
          <div className="space-y-1 text-sm">
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span>Знижка</span>
                <span className="text-[var(--color-discount)]">-{Number(order.discountAmount).toFixed(2)} ₴</span>
              </div>
            )}
            {Number(order.deliveryCost) > 0 && (
              <div className="flex justify-between">
                <span>Доставка</span>
                <span>{Number(order.deliveryCost).toFixed(2)} ₴</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-lg font-bold">
              <span>Разом</span>
              <span>{Number(order.totalAmount).toFixed(2)} ₴</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment */}
      {order.comment && (
        <div className="mt-6 rounded-[var(--radius)] border border-[var(--color-border)] p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Коментар</h3>
          <p className="text-sm">{order.comment}</p>
        </div>
      )}

      {/* Items */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">
          Товари ({order.items.length})
        </h3>
        <div className="rounded-[var(--radius)] border border-[var(--color-border)]">
          {order.items.map((item, i) => (
            <div
              key={item.productId}
              className={`flex gap-4 p-4 ${i < order.items.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius)] bg-[var(--color-bg-secondary)]">
                {item.imagePath ? (
                  <Image src={item.imagePath} alt={item.productName} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                    Фото
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Код: {item.productCode}</p>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm sm:mt-0">
                  <span className="text-[var(--color-text-secondary)]">
                    {Number(item.priceAtOrder).toFixed(2)} ₴ x {item.quantity}
                  </span>
                  <span className="font-bold">{Number(item.subtotal).toFixed(2)} ₴</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status history */}
      {order.statusHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">
            Історія статусів
          </h3>
          <div className="space-y-3">
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                <div>
                  <p className="text-sm">
                    {entry.oldStatus
                      ? `${ORDER_STATUS_LABELS[entry.oldStatus as OrderStatus]} → ${ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]}`
                      : ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {formatDateTime(entry.createdAt)}
                    {entry.comment && ` — ${entry.comment}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link href="/account/orders" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Повернутись до замовлень
        </Link>
      </div>
    </div>
  );
}
