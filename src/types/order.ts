// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Price = any;

export type OrderStatus =
  | 'new_order'
  | 'processing'
  | 'confirmed'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'returned';

export type ClientType = 'retail' | 'wholesale';
export type DeliveryMethod = 'nova_poshta' | 'ukrposhta' | 'pickup' | 'pallet';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'online' | 'card_prepay';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new_order: 'Нове',
  processing: 'В обробці',
  confirmed: 'Підтверджене',
  paid: 'Оплачене',
  shipped: 'Відправлене',
  completed: 'Виконане',
  cancelled: 'Скасоване',
  returned: 'Повернення',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new_order: '#3b82f6',
  processing: '#f59e0b',
  confirmed: '#10b981',
  paid: '#06b6d4',
  shipped: '#8b5cf6',
  completed: '#6b7280',
  cancelled: '#ef4444',
  returned: '#f97316',
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  nova_poshta: 'Нова Пошта',
  ukrposhta: 'Укрпошта',
  pickup: 'Самовивіз',
  pallet: 'Палетна доставка',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Накладений платіж',
  bank_transfer: 'На розрахунковий рахунок',
  online: 'Онлайн-оплата',
  card_prepay: 'Передоплата на картку',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Очікує оплати',
  paid: 'Оплачено',
  partial: 'Часткова оплата',
  refunded: 'Повернення коштів',
};

export interface OrderItemData {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  priceAtOrder: number;
  quantity: number;
  subtotal: number;
  isPromo: boolean;
  imagePath?: string | null;
}

export interface OrderListItem {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  clientType: ClientType;
  totalAmount: Price;
  itemsCount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  createdAt: string | Date;
}

export interface OrderDetail extends OrderListItem {
  discountAmount: Price;
  deliveryCost: Price;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  comment: string | null;
  items: OrderItemData[];
  statusHistory: {
    id: number;
    oldStatus: string | null;
    newStatus: string;
    changeSource: string;
    comment: string | null;
    createdAt: string | Date;
  }[];
}

export interface CartItemServer {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    code: string;
    priceRetail: Price;
    priceWholesale: Price | null;
    quantity: number;
    isPromo: boolean;
    imagePath: string | null;
    images: { pathThumbnail: string | null }[];
  };
}
