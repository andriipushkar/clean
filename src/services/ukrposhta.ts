import { env } from '@/config/env';

export class UkrposhtaError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UkrposhtaError';
  }
}

const STATUS_TRACKING_URL = 'https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/last';
const ECOM_API_URL = 'https://www.ukrposhta.ua/ecom/0.0.1';

export interface UkrposhtaTrackingStatus {
  barcode: string;
  step: number;
  date: string;
  index: string;
  name: string;
  event: string;
  eventName: string;
  country: string;
  eventReason: string;
  eventReasonName: string;
  mailType: number;
  indexOrder: string;
}

export async function trackParcel(barcode: string): Promise<UkrposhtaTrackingStatus> {
  const token = env.UKRPOSHTA_BEARER_TOKEN;
  if (!token) {
    throw new UkrposhtaError('Ukrposhta API token not configured');
  }

  const res = await fetch(`${STATUS_TRACKING_URL}?barcode=${encodeURIComponent(barcode)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new UkrposhtaError('Відправлення не знайдено', 404);
    }
    throw new UkrposhtaError(
      `Помилка API Укрпошти: ${res.status}`,
      res.status >= 500 ? 502 : res.status
    );
  }

  const data = await res.json();
  return data as UkrposhtaTrackingStatus;
}

export interface CreateShipmentInput {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderPostcode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientPostcode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  declaredValue: number;
  description?: string;
  deliveryType?: 'W2W' | 'W2D' | 'D2W' | 'D2D';
}

export interface UkrposhtaShipment {
  uuid: string;
  barcode: string;
  sender: { name: string; phone: string };
  recipient: { name: string; phone: string };
  declaredPrice: number;
  weight: number;
}

/**
 * Create a shipment via Ukrposhta eCom API.
 */
export async function createShipment(input: CreateShipmentInput): Promise<UkrposhtaShipment> {
  const token = env.UKRPOSHTA_BEARER_TOKEN;
  if (!token) {
    throw new UkrposhtaError('Ukrposhta API token not configured');
  }

  const body = {
    sender: {
      name: input.senderName,
      phoneNumber: input.senderPhone,
      address: {
        postcode: input.senderPostcode,
        addressDescription: input.senderAddress,
      },
    },
    recipient: {
      name: input.recipientName,
      phoneNumber: input.recipientPhone,
      address: {
        postcode: input.recipientPostcode,
        addressDescription: input.recipientAddress,
      },
    },
    deliveryType: input.deliveryType ?? 'W2W',
    weight: input.weight,
    length: input.length,
    width: input.width,
    height: input.height,
    declaredPrice: input.declaredValue,
    description: input.description ?? '',
  };

  const res = await fetch(`${ECOM_API_URL}/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new UkrposhtaError(
      `Помилка створення відправлення Укрпошта: ${res.status} ${text}`,
      res.status >= 500 ? 502 : res.status
    );
  }

  return (await res.json()) as UkrposhtaShipment;
}

/**
 * Get shipment label PDF URL.
 */
export async function getShipmentLabel(shipmentUuid: string): Promise<Buffer> {
  const token = env.UKRPOSHTA_BEARER_TOKEN;
  if (!token) {
    throw new UkrposhtaError('Ukrposhta API token not configured');
  }

  const res = await fetch(`${ECOM_API_URL}/shipments/${shipmentUuid}/label`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    },
  });

  if (!res.ok) {
    throw new UkrposhtaError(`Помилка отримання накладної: ${res.status}`, res.status);
  }

  return Buffer.from(await res.arrayBuffer());
}
