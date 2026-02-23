import { prisma } from '@/lib/prisma';

export class UserError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UserError';
  }
}

interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  wholesaleStatus?: string;
  search?: string;
}

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  companyName: true,
  edrpou: true,
  wholesaleStatus: true,
  wholesaleRequestDate: true,
  isVerified: true,
  createdAt: true,
  _count: { select: { orders: true } },
};

export async function getAllUsers(params: UserListParams = {}) {
  const { page = 1, limit = 20, role, wholesaleStatus, search } = params;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (wholesaleStatus) where.wholesaleStatus = wholesaleStatus;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      legalAddress: true,
      bankIban: true,
      bankName: true,
      bankMfo: true,
      ownershipType: true,
      taxSystem: true,
      contactPersonName: true,
      contactPersonPhone: true,
      wholesaleApprovedDate: true,
      wholesaleMonthlyVol: true,
      assignedManagerId: true,
      assignedManager: { select: { id: true, fullName: true, email: true } },
      notificationPrefs: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });
}

export async function updateUserRole(id: number, role: string) {
  const validRoles = ['client', 'wholesaler', 'manager', 'admin'];
  if (!validRoles.includes(role)) {
    throw new UserError('Невалідна роль', 400);
  }

  return prisma.user.update({
    where: { id },
    data: { role: role as 'client' | 'wholesaler' | 'manager' | 'admin' },
    select: userSelect,
  });
}

export async function approveWholesale(userId: number, managerId?: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wholesaleStatus: true },
  });

  if (!user) throw new UserError('Користувача не знайдено', 404);
  if (user.wholesaleStatus !== 'pending') {
    throw new UserError('Запит не очікує розгляду', 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      role: 'wholesaler',
      wholesaleStatus: 'approved',
      wholesaleApprovedDate: new Date(),
      assignedManagerId: managerId || undefined,
    },
    select: userSelect,
  });
}

export async function rejectWholesale(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wholesaleStatus: true },
  });

  if (!user) throw new UserError('Користувача не знайдено', 404);
  if (user.wholesaleStatus !== 'pending') {
    throw new UserError('Запит не очікує розгляду', 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { wholesaleStatus: 'rejected' },
    select: userSelect,
  });
}
