'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PalletRegion {
  name: string;
  multiplier: number;
}

interface PalletConfig {
  enabled: boolean;
  minWeightKg: number;
  maxWeightKg: number;
  basePrice: number;
  pricePerKg: number;
  regions: PalletRegion[];
  freeDeliveryThreshold: number;
  estimatedDays: string;
}

const SETTING_FIELDS = [
  { key: 'site_name', label: 'Назва сайту' },
  { key: 'site_phone', label: 'Телефон' },
  { key: 'site_email', label: 'Email' },
  { key: 'site_address', label: 'Адреса' },
  { key: 'working_hours', label: 'Графік роботи' },
  { key: 'company_legal_name', label: 'Юридична назва' },
  { key: 'company_edrpou', label: 'ЄДРПОУ' },
  { key: 'company_ipn', label: 'ІПН' },
  { key: 'company_iban', label: 'IBAN' },
  { key: 'company_bank', label: 'Банк' },
  { key: 'company_legal_address', label: 'Юридична адреса' },
  { key: 'telegram_channel', label: 'Telegram канал' },
  { key: 'viber_community', label: 'Viber спільнота' },
  { key: 'facebook_url', label: 'Facebook URL' },
  { key: 'instagram_url', label: 'Instagram URL' },
  { key: 'default_seo_title', label: 'SEO Title (за замовч.)' },
  { key: 'default_seo_description', label: 'SEO Description (за замовч.)' },
  { key: 'google_analytics_id', label: 'Google Analytics ID' },
  { key: 'facebook_pixel_id', label: 'Facebook Pixel ID' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient
      .get<Record<string, string>>('/api/v1/admin/settings')
      .then((res) => {
        if (res.success && res.data) setSettings(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    const res = await apiClient.put('/api/v1/admin/settings', settings);
    setIsSaving(false);
    setMessage(res.success ? 'Збережено' : 'Помилка збереження');
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Налаштування сайту</h2>
        <Button onClick={handleSave} isLoading={isSaving}>Зберегти</Button>
      </div>

      {message && (
        <div className={`mb-4 rounded-[var(--radius)] px-4 py-2 text-sm ${message === 'Збережено' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {SETTING_FIELDS.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            value={settings[field.key] || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
          />
        ))}
      </div>

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <PalletDeliverySettings />
      </div>
    </div>
  );
}

function PalletDeliverySettings() {
  const [config, setConfig] = useState<PalletConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient
      .get<PalletConfig>('/api/v1/admin/settings/pallet-delivery')
      .then((res) => {
        if (res.success && res.data) setConfig(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setIsSaving(true);
    setMessage('');
    const res = await apiClient.put('/api/v1/admin/settings/pallet-delivery', config);
    setIsSaving(false);
    setMessage(res.success ? 'Збережено' : 'Помилка збереження');
  }, [config]);

  const updateField = useCallback((field: keyof PalletConfig, value: unknown) => {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const updateRegion = useCallback((index: number, field: keyof PalletRegion, value: string | number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const regions = [...prev.regions];
      regions[index] = { ...regions[index], [field]: value };
      return { ...prev, regions };
    });
  }, []);

  const addRegion = useCallback(() => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, regions: [...prev.regions, { name: '', multiplier: 1 }] };
    });
  }, []);

  const removeRegion = useCallback((index: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, regions: prev.regions.filter((_, i) => i !== index) };
    });
  }, []);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;
  if (!config) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Палетна доставка</h3>
        <Button onClick={handleSave} isLoading={isSaving}>Зберегти</Button>
      </div>

      {message && (
        <div className={`mb-4 rounded-[var(--radius)] px-4 py-2 text-sm ${message === 'Збережено' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          Увімкнено
        </label>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Input
          label="Мін. вага (кг)"
          type="number"
          value={String(config.minWeightKg)}
          onChange={(e) => updateField('minWeightKg', Number(e.target.value))}
        />
        <Input
          label="Макс. вага (кг)"
          type="number"
          value={String(config.maxWeightKg)}
          onChange={(e) => updateField('maxWeightKg', Number(e.target.value))}
        />
        <Input
          label="Базова ціна (грн)"
          type="number"
          value={String(config.basePrice)}
          onChange={(e) => updateField('basePrice', Number(e.target.value))}
        />
        <Input
          label="Ціна за кг (грн)"
          type="number"
          value={String(config.pricePerKg)}
          onChange={(e) => updateField('pricePerKg', Number(e.target.value))}
        />
        <Input
          label="Безкоштовно від (грн)"
          type="number"
          value={String(config.freeDeliveryThreshold)}
          onChange={(e) => updateField('freeDeliveryThreshold', Number(e.target.value))}
        />
        <Input
          label="Орієнтовний термін"
          value={config.estimatedDays}
          onChange={(e) => updateField('estimatedDays', e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Регіони</h4>
          <button
            type="button"
            onClick={addRegion}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            + Додати регіон
          </button>
        </div>
        <div className="space-y-2">
          {config.regions.map((region, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={region.name}
                onChange={(e) => updateRegion(i, 'name', e.target.value)}
                placeholder="Назва регіону"
              />
              <Input
                type="number"
                value={String(region.multiplier)}
                onChange={(e) => updateRegion(i, 'multiplier', Number(e.target.value))}
                placeholder="Множник"
              />
              <button
                type="button"
                onClick={() => removeRegion(i)}
                className="shrink-0 text-xs text-[var(--color-danger)] hover:underline"
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
