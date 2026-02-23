export const metadata = {
  title: 'Технічні роботи — Clean Shop',
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] p-4">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 text-center shadow-lg">
        <div className="mb-6 text-6xl">🔧</div>
        <h1 className="mb-3 text-2xl font-bold">Технічні роботи</h1>
        <p className="mb-6 text-[var(--color-text-secondary)]">
          Наразі ми проводимо планове оновлення сайту. Будь ласка, спробуйте пізніше.
        </p>
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--color-primary)]" />
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Зазвичай це займає кілька хвилин. Дякуємо за терпіння!
        </p>
        <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
          Якщо проблема не зникає, зв&apos;яжіться з нами: info@cleanshop.ua
        </p>
      </div>
    </div>
  );
}
