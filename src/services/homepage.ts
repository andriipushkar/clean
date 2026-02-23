import { prisma } from '@/lib/prisma';

export interface HomepageBlock {
  key: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_BLOCKS: HomepageBlock[] = [
  { key: 'banner_slider', label: 'Банер-слайдер', enabled: true },
  { key: 'usp', label: 'Блок переваг (USP)', enabled: true },
  { key: 'categories', label: 'Каталог категорій', enabled: true },
  { key: 'promo_products', label: 'Акційні товари', enabled: true },
  { key: 'new_products', label: 'Новинки', enabled: true },
  { key: 'popular_products', label: 'Хіти продажів', enabled: true },
  { key: 'recently_viewed', label: 'Нещодавно переглянуті', enabled: true },
  { key: 'brands', label: 'Бренди / Виробники', enabled: true },
  { key: 'seo_text', label: 'SEO-текстовий блок', enabled: true },
];

export async function getHomepageBlocks(): Promise<HomepageBlock[]> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'homepage_blocks' },
    });

    if (setting) {
      return JSON.parse(setting.value);
    }
  } catch {
    // fall through to default
  }

  return DEFAULT_BLOCKS;
}
