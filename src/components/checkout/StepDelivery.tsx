'use client';

import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input';
import PalletDeliveryForm from '@/components/checkout/PalletDeliveryForm';
import DeliveryCostEstimate from '@/components/checkout/DeliveryCostEstimate';
import type { CheckoutInput } from '@/validators/order';
import type { DeliveryMethod } from '@/types/order';
import { DELIVERY_METHOD_LABELS } from '@/types/order';

const DELIVERY_OPTIONS: { value: DeliveryMethod; descriptionKey: string }[] = [
  { value: 'nova_poshta', descriptionKey: 'novaPoshtaDesc' },
  { value: 'ukrposhta', descriptionKey: 'ukrposhtaDesc' },
  { value: 'pickup', descriptionKey: 'pickupDesc' },
  { value: 'pallet', descriptionKey: 'palletDesc' },
];

interface StepDeliveryProps {
  data: Partial<CheckoutInput>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  cartTotal?: number;
}

export default function StepDelivery({ data, errors, onChange, cartTotal = 0 }: StepDeliveryProps) {
  const t = useTranslations('checkout');
  const needsAddress = data.deliveryMethod === 'nova_poshta' || data.deliveryMethod === 'ukrposhta';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('stepDelivery')}</h2>

      <div className="space-y-2">
        {DELIVERY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-4 transition-colors ${
              data.deliveryMethod === option.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            <input
              type="radio"
              name="deliveryMethod"
              value={option.value}
              checked={data.deliveryMethod === option.value}
              onChange={(e) => onChange('deliveryMethod', e.target.value)}
              className="mt-0.5 accent-[var(--color-primary)]"
            />
            <div>
              <span className="text-sm font-medium">{DELIVERY_METHOD_LABELS[option.value]}</span>
              <p className="text-xs text-[var(--color-text-secondary)]">{t(option.descriptionKey)}</p>
            </div>
          </label>
        ))}
        {errors.deliveryMethod && (
          <p className="text-xs text-[var(--color-danger)]">{errors.deliveryMethod}</p>
        )}
      </div>

      {needsAddress && (
        <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
          <Input
            label={`${t('deliveryCity')} *`}
            value={data.deliveryCity || ''}
            onChange={(e) => onChange('deliveryCity', e.target.value)}
            error={errors.deliveryCity}
            placeholder="Київ"
          />
          <Input
            label={`${t('deliveryAddress')} *`}
            value={data.deliveryAddress || ''}
            onChange={(e) => onChange('deliveryAddress', e.target.value)}
            error={errors.deliveryAddress}
            placeholder={
              data.deliveryMethod === 'nova_poshta'
                ? 'Відділення №1, вул. Хрещатик, 1'
                : 'вул. Хрещатик, 1, кв. 1'
            }
          />
        </div>
      )}

      {data.deliveryMethod === 'pallet' && (
        <PalletDeliveryForm onChange={onChange} errors={errors} />
      )}

      <DeliveryCostEstimate
        deliveryMethod={data.deliveryMethod as DeliveryMethod}
        city={data.deliveryCity || ''}
        cartTotal={cartTotal}
      />
    </div>
  );
}
