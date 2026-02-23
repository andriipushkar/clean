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
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import OrderItemsEditor from '@/components/admin/OrderItemsEditor';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new_order: ['processing', 'cancelled'],
  processing: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'shipped', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed', 'returned'],
  completed: ['returned'],
  cancelled: [],
  returned: [],
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [isEditingItems, setIsEditingItems] = useState(false);

  useEffect(() => {
    apiClient
      .get<OrderDetail>(`/api/v1/admin/orders/${id}`)
      .then((res) => {
        if (res.success && res.data) setOrder(res.data);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setIsUpdating(true);
    setError('');
    try {
      const res = await apiClient.put(`/api/v1/admin/orders/${id}/status`, {
        status: newStatus,
        comment: comment || undefined,
      });
      if (res.success) {
        // Reload order
        const updated = await apiClient.get<OrderDetail>(`/api/v1/admin/orders/${id}`);
        if (updated.success && updated.data) setOrder(updated.data);
        setNewStatus('');
        setComment('');
      } else {
        setError(res.error || 'Помилка оновлення');
      }
    } catch {
      setError('Помилка мережі');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (d: string | Date) =>
    new Date(d).toLocaleString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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
      <div className="text-center">
        <p className="text-[var(--color-text-secondary)]">Замовлення не знайдено</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/orders')}>
          До списку
        </Button>
      </div>
    );
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[order.status] || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm text-[var(--color-primary)] hover:underline">
            ← Замовлення
          </Link>
          <h2 className="mt-1 text-xl font-bold">#{order.orderNumber}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{formatDateTime(order.createdAt)}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-medium text-white"
          style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Status update */}
      {allowedStatuses.length > 0 && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h3 className="mb-3 text-sm font-semibold">Змінити статус</h3>
          <div className="flex flex-wrap gap-3">
            <Select
              options={[
                { value: '', label: 'Оберіть статус' },
                ...allowedStatuses.map((s) => ({
                  value: s,
                  label: ORDER_STATUS_LABELS[s as OrderStatus],
                })),
              ]}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Коментар (необов'язково)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleStatusUpdate} isLoading={isUpdating} disabled={!newStatus}>
              Оновити
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact */}
        <InfoCard title="Контакти">
          <p>{order.contactName}</p>
          <p>{order.contactPhone}</p>
          <p>{order.contactEmail}</p>
        </InfoCard>

        {/* Delivery */}
        <InfoCard title="Доставка">
          <p>{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
          {order.deliveryCity && <p>{order.deliveryCity}</p>}
          {order.deliveryAddress && <p>{order.deliveryAddress}</p>}
          {order.trackingNumber && (
            <p className="mt-1 font-semibold">ТТН: {order.trackingNumber}</p>
          )}
        </InfoCard>

        {/* Payment */}
        <InfoCard title="Оплата">
          <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          <p>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
          <p className="mt-2 text-lg font-bold">{Number(order.totalAmount).toFixed(2)} ₴</p>
        </InfoCard>
      </div>

      {order.comment && (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Коментар</p>
          <p className="mt-1 text-sm">{order.comment}</p>
        </div>
      )}

      {/* Items */}
      <div className="mt-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h3 className="text-sm font-semibold">Товари ({order.items.length})</h3>
          {['new_order', 'processing', 'confirmed'].includes(order.status) && (
            <Button size="sm" variant="outline" onClick={() => setIsEditingItems(true)}>
              Редагувати товари
            </Button>
          )}
        </div>
        {order.items.map((item, i) => (
          <div
            key={item.productId}
            className={`flex gap-3 px-4 py-3 ${i < order.items.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-[var(--color-bg-secondary)]">
              {item.imagePath ? (
                <Image src={item.imagePath} alt={item.productName} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-text-secondary)]">
                  Фото
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{item.productCode}</p>
              </div>
              <div className="text-right text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  {Number(item.priceAtOrder).toFixed(2)} × {item.quantity}
                </span>
                <span className="ml-3 font-bold">{Number(item.subtotal).toFixed(2)} ₴</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status history */}
      {order.statusHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-[var(--color-text-secondary)]">Історія</h3>
          <div className="space-y-2">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-2 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                <div>
                  <span>
                    {h.oldStatus
                      ? `${ORDER_STATUS_LABELS[h.oldStatus as OrderStatus]} → ${ORDER_STATUS_LABELS[h.newStatus as OrderStatus]}`
                      : ORDER_STATUS_LABELS[h.newStatus as OrderStatus]}
                  </span>
                  <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                    {formatDateTime(h.createdAt)}
                  </span>
                  {h.comment && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{h.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit items modal */}
      <Modal
        isOpen={isEditingItems}
        onClose={() => setIsEditingItems(false)}
        title="Редагувати товари"
        size="lg"
      >
        <OrderItemsEditor
          orderId={order.id}
          items={order.items}
          onSaved={(updatedOrder) => {
            setOrder(updatedOrder);
            setIsEditingItems(false);
          }}
          onClose={() => setIsEditingItems(false)}
        />
      </Modal>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">{title}</p>
      <div className="space-y-0.5 text-sm">{children}</div>
    </div>
  );
}
