export type ReferralStatus = 'registered' | 'first_order' | 'bonus_granted';

export interface ReferralItem {
  id: number;
  referrerUserId: number;
  referrer: { id: number; fullName: string; email: string };
  referredUserId: number;
  referred: { id: number; fullName: string; email: string };
  referralCode: string;
  status: ReferralStatus;
  bonusType: string | null;
  bonusValue: number | null;
  createdAt: string;
  convertedAt: string | null;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  convertedCount: number;
  totalBonusValue: number;
}
