'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '@/components/icons';

interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageDesktop: string;
  imageMobile?: string | null;
  buttonLink: string | null;
  buttonText: string | null;
}

const bannerGradients = [
  'from-[#2E7D32] via-[#388E3C] to-[#1B5E20]',
  'from-[#1565C0] via-[#1976D2] to-[#6A1B9A]',
  'from-[#E65100] via-[#F57C00] to-[#C62828]',
];

function BannerDecoration({ index }: { index: number }) {
  if (index === 0)
    return (
      <>
        <svg className="absolute -right-10 -top-10 h-64 w-64 opacity-10" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
        <svg className="absolute -bottom-16 -right-16 h-80 w-80 opacity-[0.07]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
        <svg className="absolute left-1/3 top-0 h-40 w-40 opacity-[0.06]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="white" /></svg>
      </>
    );
  if (index === 1)
    return (
      <>
        <svg className="absolute -left-20 bottom-0 h-72 w-72 opacity-10" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
        <svg className="absolute right-10 top-4 h-48 w-48 opacity-[0.06]" viewBox="0 0 200 200"><rect x="20" y="20" width="160" height="160" rx="40" fill="white" /></svg>
        <svg className="absolute bottom-0 left-0 right-0 h-16 opacity-[0.08]" viewBox="0 0 1200 80" preserveAspectRatio="none"><path d="M0 40 Q300 0 600 40 T1200 40 V80 H0Z" fill="white" /></svg>
      </>
    );
  return (
    <>
      <svg className="absolute -right-10 top-10 h-56 w-56 opacity-10" viewBox="0 0 200 200"><polygon points="100,10 190,190 10,190" fill="white" /></svg>
      <svg className="absolute -bottom-10 -left-10 h-64 w-64 opacity-[0.07]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
      <svg className="absolute top-0 left-0 right-0 h-12 opacity-[0.08]" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 Q300 60 600 30 T1200 30 V0 H0Z" fill="white" /></svg>
    </>
  );
}

const fallbackBanners: Banner[] = [
  {
    id: 1,
    title: 'Знижки до -30%',
    subtitle: 'На всю побутову хімію',
    imageDesktop: '',
    buttonLink: '/catalog?promo=true',
    buttonText: 'Дивитись акції',
  },
  {
    id: 2,
    title: 'Безкоштовна доставка',
    subtitle: 'При замовленні від 1000 ₴',
    imageDesktop: '',
    buttonLink: '/pages/delivery',
    buttonText: 'Детальніше',
  },
  {
    id: 3,
    title: 'Оптовим покупцям',
    subtitle: 'Спеціальні ціни та умови',
    imageDesktop: '',
    buttonLink: '/pages/wholesale',
    buttonText: 'Дізнатись більше',
  },
];

export default function BannerSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetch('/api/v1/banners')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.length) setBanners(data.data);
      })
      .catch(() => {});
  }, []);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);

    const interval = setInterval(() => {
      if (!isPaused) emblaApi.scrollNext();
    }, 5000);
    return () => {
      clearInterval(interval);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, isPaused]);

  if (!banners.length) return null;

  return (
    <section
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="min-w-0 shrink-0 basis-full">
              <Link href={banner.buttonLink || '/'} className="relative block">
                <div className="relative aspect-[2/1] sm:aspect-[21/7]">
                  {banner.imageDesktop ? (
                    <picture>
                      {banner.imageMobile && (
                        <source media="(max-width: 639px)" srcSet={banner.imageMobile} />
                      )}
                      <source media="(min-width: 640px)" srcSet={banner.imageDesktop} />
                      <img
                        src={banner.imageDesktop}
                        alt={banner.title || ''}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </picture>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${bannerGradients[idx % bannerGradients.length]} overflow-hidden`}>
                      <BannerDecoration index={idx % 3} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-start justify-center p-6 text-white sm:p-12 lg:p-16">
                    {banner.title && (
                      <h2 className="mb-2 text-3xl font-extrabold leading-tight sm:text-5xl lg:text-6xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{banner.title}</h2>
                    )}
                    {banner.subtitle && (
                      <p className="mb-6 max-w-md text-base sm:text-xl" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>{banner.subtitle}</p>
                    )}
                    {banner.buttonText && (
                      <span className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-white px-8 py-3.5 text-base font-bold text-[var(--color-primary-dark)] shadow-lg transition-all hover:shadow-xl hover:scale-105">
                        {banner.buttonText}
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md transition-all hover:bg-white hover:shadow-lg"
        aria-label="Попередній"
      >
        <ChevronLeft size={20} className="text-[var(--color-text)]" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md transition-all hover:bg-white hover:shadow-lg"
        aria-label="Наступний"
      >
        <ChevronRight size={20} className="text-[var(--color-text)]" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all ${
              i === selectedIndex ? 'h-2.5 w-6 bg-white' : 'h-2.5 w-2.5 bg-white/50'
            }`}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
