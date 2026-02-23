interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-[var(--color-border)] border-t-[var(--color-primary)] ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Завантаження"
    >
      <span className="sr-only">Завантаження...</span>
    </div>
  );
}
