'use client';

import { useEffect } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedTrackerProps {
  productId: number;
}

export default function RecentlyViewedTracker({ productId }: RecentlyViewedTrackerProps) {
  const { addItem } = useRecentlyViewed();

  useEffect(() => {
    addItem(productId);
  }, [productId, addItem]);

  return null;
}
