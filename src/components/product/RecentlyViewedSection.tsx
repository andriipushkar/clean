'use client';

import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import ProductCarousel from './ProductCarousel';
import type { ProductListItem } from '@/types/product';

export default function RecentlyViewedSection() {
  const { ids } = useRecentlyViewed();
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (ids.length === 0) return;

    const params = new URLSearchParams();
    params.set('ids', ids.join(','));
    fetch(`/api/v1/products?limit=15&ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data);
        }
      })
      .catch(() => {});
  }, [ids]);

  if (products.length === 0) return null;

  return <ProductCarousel title="Нещодавно переглянуті" products={products} />;
}
