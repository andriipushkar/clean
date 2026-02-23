'use client';

export default function OfflinePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        &#128268;
      </div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>
        Немає з&apos;єднання з інтернетом
      </h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px' }}>
        Перевірте підключення до мережі та спробуйте знову.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Оновити сторінку
      </button>
    </div>
  );
}
