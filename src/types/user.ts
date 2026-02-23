export type UserRole = 'client' | 'wholesaler' | 'manager' | 'admin';
export type WholesaleStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  client: 'Клієнт',
  wholesaler: 'Оптовик',
  manager: 'Менеджер',
  admin: 'Адміністратор',
};

export const WHOLESALE_STATUS_LABELS: Record<WholesaleStatus, string> = {
  none: '—',
  pending: 'Очікує',
  approved: 'Підтверджено',
  rejected: 'Відхилено',
};

export interface UserListItem {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  companyName: string | null;
  edrpou: string | null;
  wholesaleStatus: WholesaleStatus;
  wholesaleRequestDate: string | Date | null;
  isVerified: boolean;
  createdAt: string | Date;
  _count: { orders: number };
}

export interface DashboardStats {
  orders: {
    todayCount: number;
    todayRevenue: number;
    yesterdayCount: number;
    yesterdayRevenue: number;
    newCount: number;
  };
  users: {
    total: number;
    wholesalers: number;
    newThisWeek: number;
    pendingWholesale: number;
  };
  products: {
    total: number;
    outOfStock: number;
  };
  topProducts: { name: string; quantity: number }[];
}
