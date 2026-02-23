import { prisma } from '@/lib/prisma';

export class AddressError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AddressError';
  }
}

export async function getUserAddresses(userId: number) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(
  userId: number,
  data: {
    label?: string;
    city: string;
    street?: string;
    building?: string;
    apartment?: string;
    postalCode?: string;
    isDefault?: boolean;
  }
) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.userAddress.create({
    data: { userId, ...data },
  });
}

export async function updateAddress(
  userId: number,
  addressId: number,
  data: {
    label?: string;
    city?: string;
    street?: string;
    building?: string;
    apartment?: string;
    postalCode?: string;
    isDefault?: boolean;
  }
) {
  const address = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new AddressError('Адресу не знайдено', 404);

  if (data.isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.userAddress.update({
    where: { id: addressId },
    data,
  });
}

export async function deleteAddress(userId: number, addressId: number) {
  const address = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new AddressError('Адресу не знайдено', 404);

  await prisma.userAddress.delete({ where: { id: addressId } });
}
