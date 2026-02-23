import { prisma } from '@/lib/prisma';

/**
 * Clean up expired refresh tokens.
 * Removes tokens where expiresAt < now.
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
