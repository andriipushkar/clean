import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import type { Prisma } from '../../generated/prisma';

const FONT_PATH = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');

type TemplateKey =
  | 'sales_summary'
  | 'products_stock'
  | 'orders_by_status'
  | 'clients_activity'
  | 'wholesale_report'
  | 'delivery_report';

type Format = 'xlsx' | 'csv' | 'pdf';

interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  sales_summary: 'Звіт про продажі',
  products_stock: 'Залишки товарів',
  orders_by_status: 'Замовлення за статусом',
  clients_activity: 'Активність клієнтів',
  wholesale_report: 'Оптові продажі',
  delivery_report: 'Звіт по доставках',
};

// ── Main entry point ──

export async function generateReport(
  templateKey: TemplateKey,
  format: Format,
  params: ReportParams
): Promise<{ url: string }> {
  const reportsDir = path.join(env.UPLOAD_DIR, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const fileName = `${templateKey}_${timestamp}.${format === 'pdf' ? 'pdf' : format}`;
  const filePath = path.join(reportsDir, fileName);
  const publicUrl = `/uploads/reports/${fileName}`;

  const fetchFn = DATA_FETCHERS[templateKey];
  const rows = await fetchFn(params);

  if (format === 'pdf') {
    const config = PDF_CONFIGS[templateKey];
    await renderPdf(rows, config.title, config.columns, filePath);
  } else {
    const sheetName = TEMPLATE_LABELS[templateKey];
    if (format === 'csv') {
      renderCsv(rows, filePath);
    } else {
      renderXlsx(rows, sheetName, filePath);
    }
  }

  return { url: publicUrl };
}

// ── Date helpers ──

function buildDateRange(params: ReportParams): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (params.dateFrom) range.gte = new Date(params.dateFrom);
  if (params.dateTo) {
    const d = new Date(params.dateTo);
    d.setHours(23, 59, 59, 999);
    range.lte = d;
  }
  return range;
}

// ── Data fetchers ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RowData = Record<string, any>;

async function fetchSalesSummary(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);
  const where: Prisma.OrderWhereInput = {
    status: { notIn: ['cancelled', 'returned'] },
  };
  if (dateRange.gte || dateRange.lte) {
    where.createdAt = dateRange;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      createdAt: true,
      totalAmount: true,
      itemsCount: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<string, { revenue: number; count: number; items: number }>();
  for (const o of orders) {
    const dateKey = o.createdAt.toLocaleDateString('uk-UA');
    const existing = grouped.get(dateKey) || { revenue: 0, count: 0, items: 0 };
    existing.revenue += Number(o.totalAmount);
    existing.count += 1;
    existing.items += o.itemsCount;
    grouped.set(dateKey, existing);
  }

  return Array.from(grouped.entries()).map(([date, data]) => ({
    'Дата': date,
    'Замовлень': data.count,
    'Товарів': data.items,
    'Виручка': Number(data.revenue.toFixed(2)),
    'Середній чек': Number((data.count > 0 ? data.revenue / data.count : 0).toFixed(2)),
  }));
}

async function fetchProductsStock(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      code: true,
      name: true,
      quantity: true,
      priceRetail: true,
      priceWholesale: true,
      category: { select: { name: true } },
      _count: {
        select: {
          orderItems: dateRange.gte || dateRange.lte
            ? { where: { order: { createdAt: dateRange, status: { notIn: ['cancelled', 'returned'] } } } }
            : { where: { order: { status: { notIn: ['cancelled', 'returned'] } } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((p) => ({
    'Код': p.code,
    'Назва': p.name,
    'Категорія': p.category?.name || '',
    'Залишок': p.quantity,
    'Роздрібна ціна': Number(Number(p.priceRetail).toFixed(2)),
    'Оптова ціна': Number(Number(p.priceWholesale || 0).toFixed(2)),
    'Продано (шт)': p._count.orderItems,
  }));
}

async function fetchOrdersByStatus(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);
  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status as Prisma.EnumOrderStatusFilter;
  if (dateRange.gte || dateRange.lte) where.createdAt = dateRange;

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { select: { productName: true, quantity: true, subtotal: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    '№ замовлення': o.orderNumber,
    'Дата': o.createdAt.toLocaleDateString('uk-UA'),
    'Статус': o.status,
    'Клієнт': o.contactName,
    'Телефон': o.contactPhone,
    'Тип': o.clientType === 'wholesale' ? 'Оптовий' : 'Роздрібний',
    'Кількість товарів': o.itemsCount,
    'Сума': Number(Number(o.totalAmount).toFixed(2)),
    'Оплата': o.paymentMethod,
    'Статус оплати': o.paymentStatus,
    'Товари': o.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
  }));
}

async function fetchClientsActivity(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: dateRange.gte || dateRange.lte
            ? { where: { createdAt: dateRange } }
            : true,
        },
      },
      orders: {
        where: dateRange.gte || dateRange.lte ? { createdAt: dateRange } : {},
        select: { totalAmount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => {
    const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return {
      'ID': u.id,
      'Email': u.email,
      "Ім'я": u.fullName || '',
      'Телефон': u.phone || '',
      'Роль': u.role,
      'Дата реєстрації': u.createdAt.toLocaleDateString('uk-UA'),
      'Замовлень за період': u._count.orders,
      'Сума за період': Number(totalSpent.toFixed(2)),
    };
  });
}

async function fetchWholesaleReport(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);
  const where: Prisma.OrderWhereInput = {
    clientType: 'wholesale',
  };
  if (dateRange.gte || dateRange.lte) where.createdAt = dateRange;

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { fullName: true, companyName: true, edrpou: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    '№ замовлення': o.orderNumber,
    'Дата': o.createdAt.toLocaleDateString('uk-UA'),
    'Клієнт': o.contactName,
    'Компанія': o.user?.companyName || '',
    'ЄДРПОУ': o.user?.edrpou || '',
    'Статус': o.status,
    'Кількість товарів': o.itemsCount,
    'Знижка': Number(Number(o.discountAmount).toFixed(2)),
    'Сума': Number(Number(o.totalAmount).toFixed(2)),
    'Оплата': o.paymentMethod,
    'Статус оплати': o.paymentStatus,
  }));
}

async function fetchDeliveryReport(params: ReportParams): Promise<RowData[]> {
  const dateRange = buildDateRange(params);
  const where: Prisma.OrderWhereInput = {};
  if (dateRange.gte || dateRange.lte) where.createdAt = dateRange;

  const orders = await prisma.order.findMany({
    where,
    select: {
      orderNumber: true,
      createdAt: true,
      deliveryMethod: true,
      deliveryCity: true,
      deliveryAddress: true,
      trackingNumber: true,
      deliveryCost: true,
      status: true,
      contactName: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    '№ замовлення': o.orderNumber,
    'Дата': o.createdAt.toLocaleDateString('uk-UA'),
    'Клієнт': o.contactName,
    'Метод доставки': o.deliveryMethod,
    'Місто': o.deliveryCity || '',
    'Адреса': o.deliveryAddress || '',
    'ТТН': o.trackingNumber || '',
    'Вартість доставки': Number(Number(o.deliveryCost).toFixed(2)),
    'Статус замовлення': o.status,
  }));
}

const DATA_FETCHERS: Record<TemplateKey, (params: ReportParams) => Promise<RowData[]>> = {
  sales_summary: fetchSalesSummary,
  products_stock: fetchProductsStock,
  orders_by_status: fetchOrdersByStatus,
  clients_activity: fetchClientsActivity,
  wholesale_report: fetchWholesaleReport,
  delivery_report: fetchDeliveryReport,
};

// ── Renderers ──

function renderXlsx(rows: RowData[], sheetName: string, filePath: string): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(filePath, buffer);
}

function renderCsv(rows: RowData[], filePath: string): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const csv = XLSX.utils.sheet_to_csv(ws);
  writeFileSync(filePath, csv, 'utf-8');
}

async function renderPdf(
  rows: RowData[],
  title: string,
  columns: { label: string; key: string; width: number; align?: string }[],
  filePath: string
): Promise<void> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'landscape' });
  doc.registerFont('Roboto', FONT_PATH);
  doc.font('Roboto');

  const stream = createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(16).text(title, { align: 'center' });
  doc.fontSize(9).text(`Згенеровано: ${new Date().toLocaleDateString('uk-UA')}`, { align: 'center' });
  doc.moveDown(1);

  if (rows.length === 0) {
    doc.fontSize(12).text('Немає даних за обраний період', { align: 'center' });
    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    return;
  }

  // Table
  const startX = 50;
  let currentX = startX;
  let y = doc.y;

  // Header row
  doc.fontSize(8).fillColor('#444444');
  for (const col of columns) {
    doc.text(col.label, currentX, y, {
      width: col.width,
      align: (col.align as 'left' | 'right' | 'center') || 'left',
    });
    currentX += col.width + 5;
  }
  y += 14;
  doc.moveTo(startX, y).lineTo(startX + columns.reduce((s, c) => s + c.width + 5, 0), y).stroke('#cccccc');
  y += 8;
  doc.fillColor('#000000');

  // Data rows
  for (const row of rows) {
    if (y > 520) {
      doc.addPage();
      y = 50;
      // Repeat header
      currentX = startX;
      doc.fontSize(8).fillColor('#444444');
      for (const col of columns) {
        doc.text(col.label, currentX, y, {
          width: col.width,
          align: (col.align as 'left' | 'right' | 'center') || 'left',
        });
        currentX += col.width + 5;
      }
      y += 14;
      doc.moveTo(startX, y).lineTo(startX + columns.reduce((s, c) => s + c.width + 5, 0), y).stroke('#cccccc');
      y += 8;
      doc.fillColor('#000000');
    }

    currentX = startX;
    doc.fontSize(7);
    for (const col of columns) {
      const value = String(row[col.key] ?? '');
      doc.text(value.slice(0, 60), currentX, y, {
        width: col.width,
        align: (col.align as 'left' | 'right' | 'center') || 'left',
      });
      currentX += col.width + 5;
    }
    y += 16;
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ── PDF column configs ──

interface PdfConfig {
  title: string;
  columns: { label: string; key: string; width: number; align?: string }[];
}

const PDF_CONFIGS: Record<TemplateKey, PdfConfig> = {
  sales_summary: {
    title: 'Звіт про продажі',
    columns: [
      { label: 'Дата', key: 'Дата', width: 100 },
      { label: 'Замовлень', key: 'Замовлень', width: 80, align: 'right' },
      { label: 'Товарів', key: 'Товарів', width: 80, align: 'right' },
      { label: 'Виручка', key: 'Виручка', width: 100, align: 'right' },
      { label: 'Середній чек', key: 'Середній чек', width: 100, align: 'right' },
    ],
  },
  products_stock: {
    title: 'Залишки товарів',
    columns: [
      { label: 'Код', key: 'Код', width: 80 },
      { label: 'Назва', key: 'Назва', width: 200 },
      { label: 'Категорія', key: 'Категорія', width: 120 },
      { label: 'Залишок', key: 'Залишок', width: 60, align: 'right' },
      { label: 'Розд. ціна', key: 'Роздрібна ціна', width: 80, align: 'right' },
      { label: 'Продано', key: 'Продано (шт)', width: 60, align: 'right' },
    ],
  },
  orders_by_status: {
    title: 'Замовлення за статусом',
    columns: [
      { label: '№', key: '№ замовлення', width: 80 },
      { label: 'Дата', key: 'Дата', width: 80 },
      { label: 'Статус', key: 'Статус', width: 80 },
      { label: 'Клієнт', key: 'Клієнт', width: 120 },
      { label: 'Тип', key: 'Тип', width: 70 },
      { label: 'К-ть', key: 'Кількість товарів', width: 40, align: 'right' },
      { label: 'Сума', key: 'Сума', width: 80, align: 'right' },
    ],
  },
  clients_activity: {
    title: 'Активність клієнтів',
    columns: [
      { label: 'Email', key: 'Email', width: 160 },
      { label: "Ім'я", key: "Ім'я", width: 120 },
      { label: 'Телефон', key: 'Телефон', width: 100 },
      { label: 'Реєстрація', key: 'Дата реєстрації', width: 80 },
      { label: 'Замовлень', key: 'Замовлень за період', width: 70, align: 'right' },
      { label: 'Сума', key: 'Сума за період', width: 80, align: 'right' },
    ],
  },
  wholesale_report: {
    title: 'Оптові продажі',
    columns: [
      { label: '№', key: '№ замовлення', width: 80 },
      { label: 'Дата', key: 'Дата', width: 80 },
      { label: 'Клієнт', key: 'Клієнт', width: 100 },
      { label: 'Компанія', key: 'Компанія', width: 120 },
      { label: 'ЄДРПОУ', key: 'ЄДРПОУ', width: 80 },
      { label: 'Сума', key: 'Сума', width: 80, align: 'right' },
      { label: 'Оплата', key: 'Статус оплати', width: 80 },
    ],
  },
  delivery_report: {
    title: 'Звіт по доставках',
    columns: [
      { label: '№', key: '№ замовлення', width: 80 },
      { label: 'Дата', key: 'Дата', width: 80 },
      { label: 'Клієнт', key: 'Клієнт', width: 100 },
      { label: 'Метод', key: 'Метод доставки', width: 100 },
      { label: 'Місто', key: 'Місто', width: 100 },
      { label: 'ТТН', key: 'ТТН', width: 100 },
      { label: 'Вартість', key: 'Вартість доставки', width: 70, align: 'right' },
    ],
  },
};
