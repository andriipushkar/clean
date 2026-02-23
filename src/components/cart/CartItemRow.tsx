'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash } from '@/components/icons';
import QuantitySelector from '@/components/product/QuantitySelector';
import type { CartItem } from '@/providers/CartProvider';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const subtotal = item.priceRetail * item.quantity;

  return (
    <div className="flex gap-4 border-b border-[var(--color-border)] py-4 last:border-0">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] bg-[var(--color-bg-secondary)]">
        {item.imagePath ? (
          <Image src={item.imagePath} alt={item.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <Link
            href={`/product/${item.slug}`}
            className="text-sm font-medium hover:text-[var(--color-primary)]"
          >
            {item.name}
          </Link>
          <p className="text-xs text-[var(--color-text-secondary)]">Код: {item.code}</p>
          <p className="mt-1 text-sm font-semibold sm:hidden">{item.priceRetail.toFixed(2)} ₴</p>
        </div>

        {/* Price (desktop) */}
        <div className="hidden w-24 text-right sm:block">
          <span className="text-sm font-medium">{item.priceRetail.toFixed(2)} ₴</span>
        </div>

        {/* Quantity */}
        <QuantitySelector
          value={item.quantity}
          onChange={(qty) => onUpdateQuantity(item.productId, qty)}
          max={item.maxQuantity}
          className="self-start"
        />

        {/* Subtotal */}
        <div className="hidden w-28 text-right sm:block">
          <span className="text-sm font-bold">{subtotal.toFixed(2)} ₴</span>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.productId)}
          className="self-start rounded-[var(--radius)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-danger)]"
          aria-label="Видалити"
        >
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
}
