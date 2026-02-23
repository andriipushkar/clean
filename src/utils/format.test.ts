import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, formatDateTime, truncate } from './format';

describe('formatPrice', () => {
  it('should format price in UAH currency', () => {
    const result = formatPrice(89.9);
    expect(result).toContain('89,90');
    expect(result).toContain('₴');
  });

  it('should format zero price', () => {
    const result = formatPrice(0);
    expect(result).toContain('0,00');
  });

  it('should format large prices with grouping', () => {
    const result = formatPrice(10000);
    expect(result).toContain('10');
    expect(result).toContain('000');
  });

  it('should format price with two decimal places', () => {
    const result = formatPrice(100.5);
    expect(result).toContain('100,50');
  });
});

describe('formatDate', () => {
  it('should format Date object in uk-UA format', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(result).toBe('15.01.2024');
  });

  it('should format date string', () => {
    const result = formatDate('2024-12-31');
    expect(result).toBe('31.12.2024');
  });

  it('should handle ISO date string', () => {
    const result = formatDate('2024-06-01T12:00:00Z');
    expect(result).toMatch(/01\.06\.2024/);
  });
});

describe('formatDateTime', () => {
  it('should include both date and time', () => {
    const result = formatDateTime(new Date('2024-01-15T14:30:00Z'));
    expect(result).toContain('15.01.2024');
  });

  it('should format date string with time', () => {
    const result = formatDateTime('2024-06-01T09:15:00Z');
    expect(result).toContain('01.06.2024');
  });

  it('should include hours and minutes', () => {
    const result = formatDateTime(new Date('2024-01-15T14:30:00Z'));
    // Should contain time portion (exact format depends on timezone)
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4},?\s+\d{2}:\d{2}/);
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings and add ellipsis', () => {
    expect(truncate('this is a very long string', 10)).toBe('this is a ...');
  });

  it('should return exact string when length equals limit', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});
