'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import PriceDisplay from './PriceDisplay';
import QuickView from './QuickView';
import { Heart, HeartFilled, Cart, Search } from '@/components/icons';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type { ProductListItem } from '@/types/product';

const WISHLIST_STORAGE_KEY = 'clean-shop-wishlist';

function getLocalWishlist(): number[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalWishlist(ids: number[]) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

interface ProductCardProps {
  product: ProductListItem;
  noteText?: string;
}

export default function ProductCard({ product, noteText }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [showQuickView, setShowQuickView] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const inStock = product.quantity > 0;
  const mainImage = product.images[0]?.pathMedium || product.imagePath;
  const blurImage = product.images[0]?.pathBlur;

  useEffect(() => {
    if (user) {
      apiClient
        .get<{ wishlisted: boolean }>(`/api/v1/me/wishlists/default/items/${product.id}/check`)
        .then((res) => {
          if (res.success && res.data) setIsWished(res.data.wishlisted);
        })
        .catch(() => {});
    } else {
      setIsWished(getLocalWishlist().includes(product.id));
    }
  }, [user, product.id]);

  const handleToggleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      const newState = !isWished;
      setIsWished(newState);

      if (user) {
        try {
          if (newState) {
            await apiClient.post(`/api/v1/me/wishlists/default/items/${product.id}`);
          } else {
            await apiClient.delete(`/api/v1/me/wishlists/default/items/${product.id}`);
          }
        } catch {
          setIsWished(!newState);
        }
      } else {
        const ids = getLocalWishlist();
        if (newState) {
          if (!ids.includes(product.id)) {
            setLocalWishlist([...ids, product.id]);
          }
        } else {
          setLocalWishlist(ids.filter((id) => id !== product.id));
        }
      }
    },
    [isWished, user, product.id]
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      code: product.code,
      priceRetail: Number(product.priceRetail),
      priceWholesale: product.priceWholesale ? Number(product.priceWholesale) : null,
      imagePath: mainImage,
      quantity: 1,
      maxQuantity: product.quantity,
    });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius)] bg-[var(--color-bg)] shadow-[var(--shadow)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5">
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-white">
        {mainImage ? (
          <>
            {blurImage && !imageLoaded && (
              <img
                src={blurImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-contain p-4 blur-lg"
              />
            )}
            <img
              src={mainImage}
              alt={product.name}
              className={`h-full w-full object-contain p-4 transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className={`flex h-full flex-col items-center justify-center ${
            product.category?.name
              ? 'bg-gradient-to-br from-[var(--color-primary-50)] via-[var(--color-primary-100)] to-[var(--color-primary-50)]'
              : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100'
          }`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-2xl font-bold text-[var(--color-primary)]">
              {product.name.charAt(0).toUpperCase()}
            </div>
            <svg className="mt-2 h-6 w-6 text-[var(--color-primary)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.badges.slice(0, 2).map((badge) => (
              <Badge key={badge.id} color={badge.customColor || undefined}>
                {badge.customText || badge.badgeType}
              </Badge>
            ))}
          </div>
        )}

        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className={`rounded-full bg-white p-1.5 shadow-sm transition-colors ${isWished ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]'}`}
            aria-label={isWished ? 'Видалити з обраного' : 'Додати в обране'}
            onClick={handleToggleWishlist}
          >
            {isWished ? <HeartFilled size={18} /> : <Heart size={18} />}
          </button>
          <button
            className="rounded-full bg-white p-1.5 text-[var(--color-text-secondary)] shadow-sm hover:text-[var(--color-primary)]"
            aria-label="Швидкий перегляд"
            onClick={(e) => { e.preventDefault(); setShowQuickView(true); }}
          >
            <Search size={18} />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col border-t border-[var(--color-border)] p-3">
        {product.category && (
          <span className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
            {product.category.name}
          </span>
        )}

        <Link href={`/product/${product.slug}`} className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-[var(--color-text)] hover:text-[var(--color-primary)]">
          {product.name}
        </Link>

        {product.content?.shortDescription && (
          <p className="mb-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
            {product.content.shortDescription}
          </p>
        )}

        <p className="mb-2 text-[11px] text-[var(--color-text-secondary)]">Код: {product.code}</p>

        <div className="mt-auto">
          <PriceDisplay
            priceRetail={product.priceRetail}
            priceRetailOld={product.priceRetailOld}
            size="sm"
          />

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`text-xs font-medium ${inStock ? 'text-[var(--color-in-stock)]' : 'text-[var(--color-out-of-stock)]'}`}>
              {inStock ? 'В наявності' : 'Немає'}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="В кошик"
            >
              <Cart size={14} />
              <span>В кошик</span>
            </button>
          </div>
        </div>
      </div>

      {noteText && (
        <div className="absolute bottom-2 right-2 z-10 max-w-[140px] rotate-1 rounded bg-yellow-200 px-2 py-1.5 text-xs leading-tight text-yellow-900 shadow-sm" title={noteText}>
          <span className="line-clamp-2">{noteText}</span>
        </div>
      )}

      {showQuickView && (
        <QuickView productId={product.id} onClose={() => setShowQuickView(false)} />
      )}
    </div>
  );
}
