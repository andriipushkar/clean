'use client';

import { useEffect, useState, useCallback } from 'react';

interface Announcement {
  message: string;
  id: number;
}

let announceCallback: ((message: string) => void) | null = null;

/**
 * Оголошує повідомлення для скрінрідерів через aria-live регіон.
 */
export function announce(message: string) {
  announceCallback?.(message);
}

export default function AriaLiveRegion() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const handleAnnounce = useCallback((message: string) => {
    setAnnouncements((prev) => [...prev, { message, id: Date.now() }]);
    // Clean up old announcements
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1));
    }, 5000);
  }, []);

  useEffect(() => {
    announceCallback = handleAnnounce;
    return () => {
      announceCallback = null;
    };
  }, [handleAnnounce]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
    >
      {announcements.map((a) => (
        <span key={a.id}>{a.message}</span>
      ))}
    </div>
  );
}
