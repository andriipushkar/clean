import PDFDocument from 'pdfkit';
import path from 'path';
import { prisma } from '@/lib/prisma';

const FONT_PATH = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');

const COMPANY = {
  name: 'Clean Shop',
  website: 'cleanshop.com.ua',
};

export class PricelistError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PricelistError';
  }
}

export async function generatePricelist(type: 'retail' | 'wholesale'): Promise<Buffer> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  if (products.length === 0) {
    throw new PricelistError('Немає активних товарів для генерації прайс-листа');
  }

  // Group products by category
  const grouped = new Map<string, typeof products>();
  for (const product of products) {
    const categoryName = product.category?.name || 'Без категорії';
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, []);
    }
    grouped.get(categoryName)!.push(product);
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.registerFont('Roboto', FONT_PATH);
  doc.font('Roboto');

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Header
  doc.fontSize(18).text('Clean Shop \u2014 \u041F\u0440\u0430\u0439\u0441-\u043B\u0438\u0441\u0442', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).text(
    type === 'wholesale' ? '\u041E\u043F\u0442\u043E\u0432\u0438\u0439 \u043F\u0440\u0430\u0439\u0441-\u043B\u0438\u0441\u0442' : '\u0420\u043E\u0437\u0434\u0440\u0456\u0431\u043D\u0438\u0439 \u043F\u0440\u0430\u0439\u0441-\u043B\u0438\u0441\u0442',
    { align: 'center' }
  );
  doc.fontSize(9).text(`\u0414\u0430\u0442\u0430: ${new Date().toLocaleDateString('uk-UA')}`, { align: 'center' });
  doc.fontSize(9).text(COMPANY.website, { align: 'center' });
  doc.moveDown(1);

  // Table column positions
  const colX = { code: 40, name: 110, category: 300, price: 420, stock: 500 };

  const drawTableHeader = (y: number) => {
    doc.fontSize(8).fillColor('#444444');
    doc.text('\u041A\u043E\u0434', colX.code, y);
    doc.text('\u041D\u0430\u0437\u0432\u0430', colX.name, y);
    doc.text('\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0456\u044F', colX.category, y);
    doc.text('\u0426\u0456\u043D\u0430, \u0433\u0440\u043D', colX.price, y, { width: 70, align: 'right' });
    doc.text('\u041D\u0430\u044F\u0432\u043D\u0456\u0441\u0442\u044C', colX.stock, y, { width: 55, align: 'right' });
    doc.moveTo(40, y + 12).lineTo(555, y + 12).stroke('#cccccc');
    doc.fillColor('#000000');
    return y + 20;
  };

  let y = drawTableHeader(doc.y);

  for (const [categoryName, categoryProducts] of grouped) {
    // Category section header
    if (y > 740) {
      doc.addPage();
      y = drawTableHeader(40);
    }

    doc.fontSize(9).fillColor('#222222').text(categoryName, 40, y, { underline: true });
    doc.fillColor('#000000');
    y += 16;

    for (const p of categoryProducts) {
      if (y > 760) {
        doc.addPage();
        y = drawTableHeader(40);
      }

      const price = type === 'wholesale'
        ? (p.priceWholesale !== null ? Number(p.priceWholesale) : Number(p.priceRetail))
        : Number(p.priceRetail);
      const availability = p.quantity > 0 ? `${p.quantity} \u0448\u0442.` : '\u041D\u0435\u043C\u0430\u0454';

      doc.fontSize(7);
      doc.text(p.code, colX.code, y, { width: 65 });
      doc.text(p.name, colX.name, y, { width: 185 });
      doc.text(categoryName, colX.category, y, { width: 115 });
      doc.text(price.toFixed(2), colX.price, y, { width: 70, align: 'right' });
      doc.text(availability, colX.stock, y, { width: 55, align: 'right' });

      y += 16;
    }
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#666666');
  doc.text(`\u0417\u0430\u0433\u0430\u043B\u043E\u043C \u0442\u043E\u0432\u0430\u0440\u0456\u0432: ${products.length}`, { align: 'center' });
  doc.text(`${COMPANY.name} | ${COMPANY.website}`, { align: 'center' });

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
