import { prisma } from '@/lib/prisma';
import type { PalletConfig } from '@/validators/pallet-delivery';

const PALLET_CONFIG_KEY = 'pallet_delivery_config';

const DEFAULT_CONFIG: PalletConfig = {
  enabled: true,
  minWeightKg: 100,
  maxWeightKg: 5000,
  basePrice: 1500,
  pricePerKg: 3,
  regions: [
    { name: 'Київ та область', multiplier: 1 },
    { name: 'Центральна Україна', multiplier: 1.1 },
    { name: 'Захід', multiplier: 1.3 },
    { name: 'Схід', multiplier: 1.2 },
    { name: 'Південь', multiplier: 1.2 },
  ],
  freeDeliveryThreshold: 50000,
  estimatedDays: '3-5',
};

export class PalletDeliveryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'PalletDeliveryError';
  }
}

export async function getPalletConfig(): Promise<PalletConfig> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: PALLET_CONFIG_KEY },
  });

  if (!setting) return DEFAULT_CONFIG;

  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(setting.value) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function updatePalletConfig(
  config: Partial<PalletConfig>,
  updatedBy?: number
): Promise<PalletConfig> {
  const current = await getPalletConfig();
  const merged = { ...current, ...config };

  await prisma.siteSetting.upsert({
    where: { key: PALLET_CONFIG_KEY },
    update: { value: JSON.stringify(merged), updatedBy },
    create: { key: PALLET_CONFIG_KEY, value: JSON.stringify(merged), updatedBy },
  });

  return merged;
}

export async function calculatePalletDeliveryCost(
  weightKg: number,
  region?: string
): Promise<{ cost: number; estimatedDays: string; isFreeDelivery: boolean }> {
  const config = await getPalletConfig();

  if (!config.enabled) {
    throw new PalletDeliveryError('Палетна доставка тимчасово недоступна', 400);
  }

  if (weightKg < config.minWeightKg) {
    throw new PalletDeliveryError(
      `Мінімальна вага для палетної доставки: ${config.minWeightKg} кг`,
      400
    );
  }

  if (weightKg > config.maxWeightKg) {
    throw new PalletDeliveryError(
      `Максимальна вага для палетної доставки: ${config.maxWeightKg} кг`,
      400
    );
  }

  let regionMultiplier = 1;
  if (region && config.regions.length > 0) {
    const found = config.regions.find(
      (r) => r.name.toLowerCase() === region.toLowerCase()
    );
    if (found) regionMultiplier = found.multiplier;
  }

  const rawCost = (config.basePrice + weightKg * config.pricePerKg) * regionMultiplier;
  const cost = Math.round(rawCost * 100) / 100;

  return {
    cost,
    estimatedDays: config.estimatedDays,
    isFreeDelivery: config.freeDeliveryThreshold > 0 && cost <= config.freeDeliveryThreshold,
  };
}

export async function validatePalletOrder(
  totalWeightKg: number,
  region?: string
): Promise<{ valid: boolean; message?: string }> {
  const config = await getPalletConfig();

  if (!config.enabled) {
    return { valid: false, message: 'Палетна доставка тимчасово недоступна' };
  }

  if (totalWeightKg < config.minWeightKg) {
    return {
      valid: false,
      message: `Мінімальна вага для палетної доставки: ${config.minWeightKg} кг. Поточна вага: ${totalWeightKg} кг`,
    };
  }

  if (totalWeightKg > config.maxWeightKg) {
    return {
      valid: false,
      message: `Максимальна вага для палетної доставки: ${config.maxWeightKg} кг. Поточна вага: ${totalWeightKg} кг`,
    };
  }

  if (region && config.regions.length > 0) {
    const regionExists = config.regions.some(
      (r) => r.name.toLowerCase() === region.toLowerCase()
    );
    if (!regionExists) {
      return { valid: false, message: `Регіон "${region}" не підтримується для палетної доставки` };
    }
  }

  return { valid: true };
}
