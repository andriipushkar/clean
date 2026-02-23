interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-[var(--radius)] bg-[var(--color-border)] ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, var(--color-bg-secondary) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}
