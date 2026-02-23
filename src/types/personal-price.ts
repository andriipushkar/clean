export interface PersonalPriceItem {
  id: number;
  userId: number;
  user: { id: number; fullName: string; email: string };
  productId: number | null;
  product: { id: number; name: string; code: string } | null;
  categoryId: number | null;
  discountPercent: number | null;
  fixedPrice: number | null;
  validFrom: string | null;
  validUntil: string | null;
  createdBy: number;
  creator: { id: number; fullName: string };
  createdAt: string;
}

export interface PersonalPriceFilters {
  page: number;
  limit: number;
  userId?: number;
  productId?: number;
  categoryId?: number;
}
