import { NextRequest } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';
import { withRole } from '@/middleware/auth';
import { processProductImage, deleteProductImage } from '@/services/image';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';
import { cacheInvalidate } from '@/services/cache';

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function getMimeType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

async function findProductByCode(code: string) {
  const product = await prisma.product.findUnique({
    where: { code },
    select: { id: true },
  });
  if (product) return product;

  return prisma.product.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: { id: true },
  });
}

async function processOneImage(
  imageBuffer: Buffer,
  filename: string,
): Promise<{ ok: boolean; error?: string }> {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return { ok: false, error: 'Непідтримуваний формат зображення' };
  }

  const productCode = path.basename(filename, ext);
  if (!productCode) {
    return { ok: false, error: 'Не вдалося визначити код товару з імені файлу' };
  }

  const product = await findProductByCode(productCode);
  if (!product) {
    return { ok: false, error: `Товар з кодом "${productCode}" не знайдено` };
  }

  // Delete existing images before uploading new one
  const existingImages = await prisma.productImage.findMany({
    where: { productId: product.id },
    select: { id: true },
  });
  for (const img of existingImages) {
    await deleteProductImage(img.id);
  }

  const mimeType = getMimeType(ext);
  await processProductImage(imageBuffer, mimeType, filename, product.id, true);
  return { ok: true };
}

export const POST = withRole('manager', 'admin')(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return errorResponse('Файл не надано', 400);
    }

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const ext = path.extname(file.name).toLowerCase();
    const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

    if (!isZip && !isImage) {
      return errorResponse('Підтримуються формати: .zip, .jpg, .jpeg, .png, .webp', 400);
    }

    // Single image upload
    if (isImage) {
      if (file.size > MAX_IMAGE_SIZE) {
        return errorResponse('Максимальний розмір зображення: 5 МБ', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await processOneImage(buffer, file.name);

      if (!result.ok) {
        return errorResponse(result.error!, 400);
      }

      await cacheInvalidate('products:*');
      return successResponse({ processedCount: 1, skippedCount: 0, errors: [] }, 200);
    }

    // ZIP upload
    if (file.size > MAX_ZIP_SIZE) {
      return errorResponse('Максимальний розмір ZIP: 50 МБ', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let processedCount = 0;
    let skippedCount = 0;
    const errors: { filename: string; message: string }[] = [];

    for (const entry of entries) {
      const entryName = entry.entryName;

      // Skip directories, __MACOSX, hidden files
      if (entry.isDirectory) continue;
      if (entryName.startsWith('__MACOSX/')) continue;
      const basename = path.basename(entryName);
      if (basename.startsWith('.')) continue;

      const entryExt = path.extname(basename).toLowerCase();
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(entryExt)) {
        skippedCount++;
        continue;
      }

      try {
        const imageBuffer = entry.getData();
        const result = await processOneImage(imageBuffer, basename);

        if (result.ok) {
          processedCount++;
        } else {
          errors.push({ filename: basename, message: result.error! });
          skippedCount++;
        }
      } catch (err) {
        errors.push({ filename: basename, message: err instanceof Error ? err.message : 'Помилка обробки' });
        skippedCount++;
      }
    }

    if (processedCount > 0) {
      await cacheInvalidate('products:*');
    }
    return successResponse({ processedCount, skippedCount, errors }, 200);
  } catch {
    return errorResponse('Помилка обробки файлу', 500);
  }
});
