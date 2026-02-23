'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export default function PushPermission() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get VAPID public key from server
      const keyRes = await apiClient.get<{ publicKey: string }>('/api/v1/push/subscribe');
      if (!keyRes.success || !keyRes.data?.publicKey) return;

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      await apiClient.post('/api/v1/push/subscribe', {
        endpoint: json.endpoint,
        keys: json.keys,
      });

      setIsSubscribed(true);
    } catch {
      // Permission denied or error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await apiClient.post('/api/v1/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // Error unsubscribing
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
    >
      <span>{isSubscribed ? '🔔' : '🔕'}</span>
      <span>
        {isLoading
          ? 'Завантаження...'
          : isSubscribed
            ? 'Вимкнути сповіщення'
            : 'Увімкнути сповіщення'}
      </span>
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
