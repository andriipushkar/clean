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

const bannerStyles = [
  'from-[#0D47A1] via-[#1565C0] to-[#1E88E5]',
  'from-[#1565C0] via-[#1976D2] to-[#0D47A1]',
  'from-[#0D47A1] via-[#1E88E5] to-[#1565C0]',
];

function BannerDecoration({ index }: { index: number }) {
  if (index === 0)
    return (
      <>
        <svg className="absolute -right-20 -top-20 h-96 w-96 opacity-[0.06]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
        <svg className="absolute -bottom-24 -left-10 h-80 w-80 opacity-[0.04]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
      </>
    );
  if (index === 1)
    return (
      <>
        <svg className="absolute -right-10 bottom-0 h-72 w-72 opacity-[0.05]" viewBox="0 0 200 200"><rect x="10" y="10" width="180" height="180" rx="50" fill="white" /></svg>
        <svg className="absolute -left-16 -top-16 h-64 w-64 opacity-[0.04]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
      </>
    );
  return (
    <>
      <svg className="absolute -bottom-10 right-20 h-80 w-80 opacity-[0.05]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="white" /></svg>
      <svg className="absolute -top-10 -left-10 h-56 w-56 opacity-[0.04]" viewBox="0 0 200 200"><rect x="20" y="20" width="160" height="160" rx="80" fill="white" /></svg>
    </>
  );
}

function highlightGold(text: string) {
  const parts = text.split(/(-?\d+%?|₴|\d[\d\s]*₴)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    /\d|₴/.test(part) ? (
      <span key={i} className="bg-gradient-to-r from-[#FFD54F] via-[#FFECB3] to-[#FFD54F] bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(255,193,7,0.4)]">{part}</span>
    ) : part
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
      className="relative overflow-hidden rounded-xl"
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${bannerStyles[idx % bannerStyles.length]} overflow-hidden`}>
                      <BannerDecoration index={idx % 3} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-start justify-center p-6 text-white sm:p-12 lg:p-16">
                    {banner.title && (
                      <h2 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>{highlightGold(banner.title)}</h2>
                    )}
                    {banner.subtitle && (
                      <p className="mb-6 max-w-md text-base font-light opacity-90 sm:text-xl">{banner.subtitle}</p>
                    )}
                    {banner.buttonText && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[var(--color-primary-dark)] shadow-lg transition-all hover:shadow-xl hover:scale-[1.03] sm:text-base">
                        {banner.buttonText}
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
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
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg sm:left-4 sm:p-2.5"
        aria-label="Попередній"
      >
        <ChevronLeft size={20} className="text-[var(--color-text)]" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg sm:right-4 sm:p-2.5"
        aria-label="Наступний"
      >
        <ChevronRight size={20} className="text-[var(--color-text)]" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/40'
            }`}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
