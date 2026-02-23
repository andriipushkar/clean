import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('prisma/seed.ts (smoke test)', () => {
  it('should exist and contain expected seed structure', () => {
    const seedPath = resolve(__dirname, 'seed.ts');
    const content = readFileSync(seedPath, 'utf-8');

    // Verify key seed operations are present
    expect(content).toContain('PrismaClient');
    expect(content).toContain('async function main');
    expect(content).toContain('prisma.user.upsert');
    expect(content).toContain('prisma.category.upsert');
    expect(content).toContain('prisma.product.upsert');
    expect(content).toContain('prisma.siteSetting.upsert');
    expect(content).toContain('prisma.staticPage.upsert');
    expect(content).toContain('prisma.faqItem.create');
    expect(content).toContain('prisma.wholesaleRule.create');
    expect(content).toContain('prisma.$disconnect');
  });
});
