export type LoyaltyTransactionType = 'earn' | 'spend' | 'manual_add' | 'manual_deduct' | 'expire';

export interface LoyaltyAccountData {
  id: number;
  userId: number;
  points: number;
  totalSpent: number;
  level: string;
}

export interface LoyaltyTransactionData {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  orderId: number | null;
  description: string;
  createdAt: string;
}

export interface LoyaltyLevelData {
  id: number;
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  discountPercent: number;
  benefits: Record<string, unknown> | null;
  sortOrder: number;
}

export interface LoyaltyDashboard {
  account: LoyaltyAccountData;
  currentLevel: LoyaltyLevelData | null;
  nextLevel: LoyaltyLevelData | null;
  recentTransactions: LoyaltyTransactionData[];
}
