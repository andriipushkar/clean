import { vi } from 'vitest';

type MockFn = ReturnType<typeof vi.fn>;

export interface MockPrismaDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  updateMany: MockFn;
  upsert: MockFn;
  delete: MockFn;
  deleteMany: MockFn;
  count: MockFn;
  aggregate: MockFn;
  [key: string]: MockFn;
}

export type MockPrismaClient = Record<string, MockPrismaDelegate> & {
  $connect: MockFn;
  $disconnect: MockFn;
  $queryRaw: MockFn;
  $executeRaw: MockFn;
  $transaction: MockFn;
};
