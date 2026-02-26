'use client';

import { useState } from 'react';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Honeypot: if a bot filled the hidden field, silently pretend success
    if (honeypot) {
      setStatus('success');
      setEmail('');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/v1/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p className="text-sm text-[var(--color-success)]">
        Дякуємо за підписку!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {/* Honeypot field -- visually hidden, only bots fill this */}
      <input
        type="text"
        name="company_url"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 0, height: 0, overflow: 'hidden' }}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ваш email"
        required
        className="flex-1 rounded-[var(--radius)] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-300 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="shrink-0 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
      >
        {status === 'loading' ? '...' : 'OK'}
      </button>
    </form>
  );
}
