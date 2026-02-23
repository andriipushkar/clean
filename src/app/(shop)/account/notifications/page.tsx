'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';

interface Notification {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await apiClient.get<NotificationsResponse>('/api/v1/me/notifications');
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (id: number) => {
    await apiClient.put(`/api/v1/me/notifications/${id}/read`);
    setData((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }
        : prev
    );
  };

  const markAllAsRead = async () => {
    await apiClient.put('/api/v1/me/notifications');
    setData((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }
        : prev
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  const notifications = data?.notifications || [];

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-4xl">🔔</span>}
        title="Немає сповіщень"
        description="Тут будуть відображатися сповіщення про замовлення, акції та інші важливі події"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Сповіщення
          {data && data.unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
              {data.unreadCount}
            </span>
          )}
        </h2>
        {data && data.unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Позначити всі як прочитані
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const className = `block cursor-pointer rounded-[var(--radius)] border p-4 transition-colors hover:border-[var(--color-primary)]/50 ${
            n.isRead
              ? 'border-[var(--color-border)]'
              : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
          }`;

          const content = (
            <>
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold">{n.title}</h3>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(n.createdAt).toLocaleDateString('uk-UA')}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{n.message}</p>
            </>
          );

          if (n.link) {
            return (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={className}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={className}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
