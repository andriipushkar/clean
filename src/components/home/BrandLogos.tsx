'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const brands = [
  { name: 'Frosch', slug: 'frosch', color: '#4CAF50' },
  { name: 'Fairy', slug: 'fairy', color: '#2196F3' },
  { name: 'Persil', slug: 'persil', color: '#E91E63' },
  { name: 'Tide', slug: 'tide', color: '#FF9800' },
  { name: 'Domestos', slug: 'domestos', color: '#1565C0' },
  { name: 'Mr. Proper', slug: 'mr-proper', color: '#7B1FA2' },
  { name: 'Gala', slug: 'gala', color: '#00BCD4' },
  { name: 'Sarma', slug: 'sarma', color: '#F44336' },
  { name: 'Ariel', slug: 'ariel', color: '#0D47A1' },
  { name: 'Vanish', slug: 'vanish', color: '#E91E63' },
  { name: 'Bref', slug: 'bref', color: '#009688' },
  { name: 'Somat', slug: 'somat', color: '#FF5722' },
];

function BrandIcon({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill={color} fillOpacity={0.1} />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="16"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

function BrandCard({ brand }: { brand: (typeof brands)[number] }) {
  return (
    <Link
      href={`/catalog?brand=${brand.slug}`}
      className="flex h-20 w-36 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-center shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <BrandIcon name={brand.name} color={brand.color} />
      <span className="text-xs font-semibold text-[var(--color-text)]">
        {brand.name}
      </span>
    </Link>
  );
}

export default function BrandLogos() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const anim = el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 30000, iterations: Infinity, easing: 'linear' },
    );
    const pause = () => anim.pause();
    const play = () => anim.play();
    el.parentElement?.addEventListener('mouseenter', pause);
    el.parentElement?.addEventListener('mouseleave', play);
    return () => {
      anim.cancel();
      el.parentElement?.removeEventListener('mouseenter', pause);
      el.parentElement?.removeEventListener('mouseleave', play);
    };
  }, []);

  return (
    <section className="py-6">
      <h2 className="mb-4 text-xl font-bold">Наші бренди</h2>
      <div className="overflow-hidden">
        <div ref={trackRef} className="flex w-max gap-6">
          {brands.map((brand) => (
            <BrandCard key={brand.slug} brand={brand} />
          ))}
          {brands.map((brand) => (
            <BrandCard key={`dup-${brand.slug}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
