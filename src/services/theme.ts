import { prisma } from '@/lib/prisma';

export class ThemeError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ThemeError';
  }
}

// Тема 1: «Свіжість та Органіка» — mint primary, coral CTA (default)
export const THEME_FRESHNESS: Record<string, string> = {
  '--color-primary': '#78C4AA',
  '--color-primary-light': '#9BD4BF',
  '--color-primary-dark': '#5BAF91',
  '--color-primary-50': '#f0faf5',
  '--color-primary-100': '#d9f2e6',
  '--color-secondary': '#FF6F61',
  '--color-accent': '#FF6F61',
  '--color-danger': '#ef4444',
  '--color-warning': '#f59e0b',
  '--color-success': '#10b981',
  '--color-info': '#78C4AA',
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#f7faf8',
  '--color-bg-overlay': 'rgba(0, 0, 0, 0.5)',
  '--color-text': '#1e293b',
  '--color-text-secondary': '#64748b',
  '--color-border': '#e2e8f0',
  '--color-discount': '#ef4444',
  '--color-in-stock': '#10b981',
  '--color-out-of-stock': '#94a3b8',
  '--radius': '0.5rem',
  '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '--transition-base': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Тема 2: «Кристальна чистота» — sky-blue primary, orange CTA
export const THEME_CRYSTAL: Record<string, string> = {
  '--color-primary': '#87CEEB',
  '--color-primary-light': '#A8DCEF',
  '--color-primary-dark': '#5DB8D9',
  '--color-primary-50': '#f0f9ff',
  '--color-primary-100': '#daf0fc',
  '--color-secondary': '#FF8C42',
  '--color-accent': '#FF8C42',
  '--color-danger': '#ef4444',
  '--color-warning': '#f59e0b',
  '--color-success': '#10b981',
  '--color-info': '#87CEEB',
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#f7fafd',
  '--color-bg-overlay': 'rgba(0, 0, 0, 0.5)',
  '--color-text': '#1e293b',
  '--color-text-secondary': '#64748b',
  '--color-border': '#e2e8f0',
  '--color-discount': '#ef4444',
  '--color-in-stock': '#10b981',
  '--color-out-of-stock': '#94a3b8',
  '--radius': '0.5rem',
  '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '--transition-base': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Тема 3: «Домашній затишок» — lavender primary, warm tones
export const THEME_COZY: Record<string, string> = {
  '--color-primary': '#B39DDB',
  '--color-primary-light': '#C9B8E8',
  '--color-primary-dark': '#9575CD',
  '--color-primary-50': '#f5f0ff',
  '--color-primary-100': '#ede4fc',
  '--color-secondary': '#F4A261',
  '--color-accent': '#F4A261',
  '--color-danger': '#ef4444',
  '--color-warning': '#f59e0b',
  '--color-success': '#10b981',
  '--color-info': '#B39DDB',
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#faf8fc',
  '--color-bg-overlay': 'rgba(0, 0, 0, 0.5)',
  '--color-text': '#1e293b',
  '--color-text-secondary': '#64748b',
  '--color-border': '#e8e0f0',
  '--color-discount': '#ef4444',
  '--color-in-stock': '#10b981',
  '--color-out-of-stock': '#94a3b8',
  '--radius': '0.5rem',
  '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '--transition-base': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export async function getActiveTheme() {
  const theme = await prisma.theme.findFirst({
    where: { isActive: true },
  });

  if (!theme) {
    return {
      id: 0,
      displayName: 'Свіжість та Органіка',
      cssVariables: THEME_FRESHNESS,
    };
  }

  const customSettings = (theme.customSettings as Record<string, string>) || {};
  const baseTheme =
    theme.folderName === 'crystal'
      ? THEME_CRYSTAL
      : theme.folderName === 'cozy'
        ? THEME_COZY
        : THEME_FRESHNESS;
  const cssVariables = { ...baseTheme, ...customSettings };

  return {
    id: theme.id,
    displayName: theme.displayName,
    cssVariables,
  };
}

export async function getAllThemes() {
  return prisma.theme.findMany({
    orderBy: { installedAt: 'desc' },
  });
}

export async function activateTheme(themeId: number) {
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme) {
    throw new ThemeError('Тему не знайдено', 404);
  }

  // Deactivate all themes
  await prisma.theme.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Activate selected theme
  return prisma.theme.update({
    where: { id: themeId },
    data: { isActive: true, activatedAt: new Date() },
  });
}

export async function updateThemeSettings(themeId: number, customSettings: Record<string, string>) {
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme) {
    throw new ThemeError('Тему не знайдено', 404);
  }

  return prisma.theme.update({
    where: { id: themeId },
    data: { customSettings },
  });
}

/**
 * Завантажує та встановлює тему з ZIP-архіву.
 * Валідує наявність theme.json та директорії styles.
 * @param buffer - ZIP-файл як Buffer
 * @param filename - Оригінальне ім'я файлу
 * @returns Створений об'єкт теми
 */
export async function uploadTheme(buffer: Buffer, filename: string) {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Validate theme.json exists
  const themeJsonEntry = entries.find(
    (e) => e.entryName === 'theme.json' || e.entryName.endsWith('/theme.json')
  );
  if (!themeJsonEntry) {
    throw new ThemeError('ZIP-архів має містити файл theme.json', 400);
  }

  // Parse theme.json
  let themeConfig: { name: string; displayName?: string; variables?: Record<string, string> };
  try {
    themeConfig = JSON.parse(themeJsonEntry.getData().toString('utf-8'));
  } catch {
    throw new ThemeError('Невалідний формат theme.json', 400);
  }

  if (!themeConfig.name || typeof themeConfig.name !== 'string') {
    throw new ThemeError('theme.json має містити поле "name"', 400);
  }

  // Check for styles directory
  const hasStyles = entries.some(
    (e) => e.entryName.includes('styles/') || e.entryName.includes('styles\\')
  );

  const folderName = themeConfig.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const displayName = themeConfig.displayName || themeConfig.name;

  // Extract to themes directory
  const path = await import('path');
  const fs = await import('fs');
  const { env } = await import('@/config/env');
  const themesDir = path.join(env.UPLOAD_DIR, 'themes', folderName);

  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
  }
  zip.extractAllTo(themesDir, true);

  // Create theme in database
  const existing = await prisma.theme.findFirst({ where: { folderName } });
  if (existing) {
    return prisma.theme.update({
      where: { id: existing.id },
      data: {
        displayName,
        customSettings: themeConfig.variables || {},
        installedAt: new Date(),
      },
    });
  }

  return prisma.theme.create({
    data: {
      displayName,
      folderName,
      isActive: false,
      customSettings: themeConfig.variables || {},
      installedAt: new Date(),
    },
  });
}
