import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <Container className="py-6">
      <Skeleton className="mb-6 aspect-[21/9] w-full rounded-[var(--radius)] sm:aspect-[21/7]" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius)]" />
        ))}
      </div>
      <Skeleton className="mb-4 h-7 w-32" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-[var(--radius)]" />
        ))}
      </div>
    </Container>
  );
}
