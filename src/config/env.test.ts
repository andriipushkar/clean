import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('env config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function importEnv() {
    const mod = await import('./env');
    return mod.env;
  }

  it('should parse valid environment variables', async () => {
    const env = await importEnv();
    expect(env.NODE_ENV).toBe('test');
    expect(env.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
    expect(env.JWT_SECRET).toBe('test-jwt-secret-minimum-16-chars');
  });

  it('should apply default values', async () => {
    const env = await importEnv();
    expect(env.PORT).toBe(3000);
    expect(env.SMTP_HOST).toBe('smtp.gmail.com');
    expect(env.SMTP_PORT).toBe(587);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.UPLOAD_DIR).toBe('./uploads');
    expect(env.MAX_FILE_SIZE).toBe(10485760);
  });

  it('should have correct JWT defaults', async () => {
    const env = await importEnv();
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.JWT_REFRESH_TTL).toBe('30d');
  });

  it('should throw on missing DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(importEnv()).rejects.toThrow('Invalid environment variables');
  });

  it('should throw on missing JWT_SECRET', async () => {
    vi.stubEnv('JWT_SECRET', '');
    await expect(importEnv()).rejects.toThrow('Invalid environment variables');
  });

  it('should throw on short JWT_SECRET', async () => {
    vi.stubEnv('JWT_SECRET', 'short');
    await expect(importEnv()).rejects.toThrow('Invalid environment variables');
  });

  it('should accept custom PORT', async () => {
    vi.stubEnv('PORT', '8080');
    const env = await importEnv();
    expect(env.PORT).toBe(8080);
  });

  it('should reject invalid NODE_ENV', async () => {
    vi.stubEnv('NODE_ENV', 'staging');
    await expect(importEnv()).rejects.toThrow('Invalid environment variables');
  });

  it('should reject invalid LOG_LEVEL', async () => {
    vi.stubEnv('LOG_LEVEL', 'trace');
    await expect(importEnv()).rejects.toThrow('Invalid environment variables');
  });
});
