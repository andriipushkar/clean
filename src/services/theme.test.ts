import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    theme: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;

import {
  getActiveTheme,
  getAllThemes,
  activateTheme,
  updateThemeSettings,
  ThemeError,
  THEME_FRESHNESS,
  THEME_CRYSTAL,
  THEME_COZY,
} from './theme';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ThemeError', () => {
  it('should create a ThemeError with default status code', () => {
    const error = new ThemeError('theme not found');
    expect(error.message).toBe('theme not found');
    expect(error.name).toBe('ThemeError');
    expect(error.statusCode).toBe(400);
  });

  it('should create a ThemeError with custom status code', () => {
    const error = new ThemeError('not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new ThemeError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('getActiveTheme', () => {
  it('should return default freshness theme when no active theme exists', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue(null as never);

    const result = await getActiveTheme();

    expect(result).toEqual({
      id: 0,
      displayName: 'Свіжість та Органіка',
      cssVariables: THEME_FRESHNESS,
    });
    expect(mockPrisma.theme.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
    });
  });

  it('should return crystal theme when active theme has folderName "crystal"', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue({
      id: 2,
      displayName: 'Кристальна чистота',
      folderName: 'crystal',
      customSettings: null,
      isActive: true,
    } as never);

    const result = await getActiveTheme();

    expect(result.id).toBe(2);
    expect(result.displayName).toBe('Кристальна чистота');
    expect(result.cssVariables).toEqual(THEME_CRYSTAL);
  });

  it('should return cozy theme when active theme has folderName "cozy"', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue({
      id: 3,
      displayName: 'Домашній затишок',
      folderName: 'cozy',
      customSettings: null,
      isActive: true,
    } as never);

    const result = await getActiveTheme();

    expect(result.id).toBe(3);
    expect(result.cssVariables).toEqual(THEME_COZY);
  });

  it('should return freshness theme as base for unknown folderName', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue({
      id: 1,
      displayName: 'Свіжість та Органіка',
      folderName: 'freshness',
      customSettings: null,
      isActive: true,
    } as never);

    const result = await getActiveTheme();

    expect(result.cssVariables).toEqual(THEME_FRESHNESS);
  });

  it('should merge customSettings over base theme variables', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue({
      id: 2,
      displayName: 'Custom Crystal',
      folderName: 'crystal',
      customSettings: {
        '--color-primary': '#FF0000',
        '--color-bg': '#111111',
      },
      isActive: true,
    } as never);

    const result = await getActiveTheme();

    expect(result.cssVariables['--color-primary']).toBe('#FF0000');
    expect(result.cssVariables['--color-bg']).toBe('#111111');
    // Other variables should remain from THEME_CRYSTAL
    expect(result.cssVariables['--color-primary-light']).toBe(THEME_CRYSTAL['--color-primary-light']);
  });

  it('should handle empty customSettings object', async () => {
    mockPrisma.theme.findFirst.mockResolvedValue({
      id: 1,
      displayName: 'Plain Freshness',
      folderName: 'freshness',
      customSettings: {},
      isActive: true,
    } as never);

    const result = await getActiveTheme();

    expect(result.cssVariables).toEqual(THEME_FRESHNESS);
  });
});

describe('getAllThemes', () => {
  it('should return all themes ordered by installedAt desc', async () => {
    const themes = [
      { id: 2, displayName: 'Crystal', installedAt: new Date() },
      { id: 1, displayName: 'Freshness', installedAt: new Date() },
    ];
    mockPrisma.theme.findMany.mockResolvedValue(themes as never);

    const result = await getAllThemes();

    expect(result).toEqual(themes);
    expect(mockPrisma.theme.findMany).toHaveBeenCalledWith({
      orderBy: { installedAt: 'desc' },
    });
  });

  it('should return empty array when no themes exist', async () => {
    mockPrisma.theme.findMany.mockResolvedValue([] as never);

    const result = await getAllThemes();

    expect(result).toEqual([]);
  });
});

describe('activateTheme', () => {
  it('should deactivate all themes and activate the selected one', async () => {
    const theme = { id: 2, displayName: 'Crystal', isActive: false };
    const activatedTheme = { ...theme, isActive: true, activatedAt: expect.any(Date) };

    mockPrisma.theme.findUnique.mockResolvedValue(theme as never);
    mockPrisma.theme.updateMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.theme.update.mockResolvedValue(activatedTheme as never);

    const result = await activateTheme(2);

    expect(mockPrisma.theme.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(mockPrisma.theme.updateMany).toHaveBeenCalledWith({
      where: { isActive: true },
      data: { isActive: false },
    });
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { isActive: true, activatedAt: expect.any(Date) },
    });
    expect(result).toEqual(activatedTheme);
  });

  it('should throw ThemeError with 404 when theme not found', async () => {
    mockPrisma.theme.findUnique.mockResolvedValue(null as never);

    await expect(activateTheme(999)).rejects.toThrow(ThemeError);
    await expect(activateTheme(999)).rejects.toThrow('Тему не знайдено');

    try {
      await activateTheme(999);
    } catch (error) {
      expect((error as ThemeError).statusCode).toBe(404);
    }

    expect(mockPrisma.theme.updateMany).not.toHaveBeenCalled();
  });
});

describe('updateThemeSettings', () => {
  it('should update custom settings for an existing theme', async () => {
    const theme = { id: 1, displayName: 'Freshness', customSettings: {} };
    const customSettings = { '--color-primary': '#00FF00' };
    const updated = { ...theme, customSettings };

    mockPrisma.theme.findUnique.mockResolvedValue(theme as never);
    mockPrisma.theme.update.mockResolvedValue(updated as never);

    const result = await updateThemeSettings(1, customSettings);

    expect(mockPrisma.theme.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { customSettings },
    });
    expect(result).toEqual(updated);
  });

  it('should throw ThemeError with 404 when theme not found', async () => {
    mockPrisma.theme.findUnique.mockResolvedValue(null as never);

    await expect(updateThemeSettings(999, { '--color-primary': '#FF0000' })).rejects.toThrow(ThemeError);

    try {
      await updateThemeSettings(999, {});
    } catch (error) {
      expect((error as ThemeError).statusCode).toBe(404);
    }

    expect(mockPrisma.theme.update).not.toHaveBeenCalled();
  });
});
