import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // --- Users ---
  const adminPassword = await hash('Admin123!', 12);
  const managerPassword = await hash('Manager123!', 12);
  const clientPassword = await hash('Client123!', 12);
  const wholesalerPassword = await hash('Wholesaler123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clean-shop.ua' },
    update: {},
    create: {
      email: 'admin@clean-shop.ua',
      passwordHash: adminPassword,
      fullName: 'Адміністратор',
      phone: '+380501234567',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log(`  Admin: ${admin.email}`);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@clean-shop.ua' },
    update: {},
    create: {
      email: 'manager@clean-shop.ua',
      passwordHash: managerPassword,
      fullName: 'Менеджер Олена',
      phone: '+380507654321',
      role: 'manager',
      isVerified: true,
    },
  });
  console.log(`  Manager: ${manager.email}`);

  const client = await prisma.user.upsert({
    where: { email: 'client@test.ua' },
    update: {},
    create: {
      email: 'client@test.ua',
      passwordHash: clientPassword,
      fullName: 'Тестовий Клієнт',
      phone: '+380991112233',
      role: 'client',
      isVerified: true,
    },
  });
  console.log(`  Client: ${client.email}`);

  const wholesaler = await prisma.user.upsert({
    where: { email: 'wholesaler@test.ua' },
    update: {},
    create: {
      email: 'wholesaler@test.ua',
      passwordHash: wholesalerPassword,
      fullName: 'Оптовий Покупець Іван',
      phone: '+380671234567',
      role: 'wholesaler',
      isVerified: true,
      wholesaleStatus: 'approved',
      companyName: 'ТОВ "Чистий Дім"',
      companyCode: '12345678',
    },
  });
  console.log(`  Wholesaler: ${wholesaler.email}`);

  // --- Categories ---
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'myiuchi-zasoby' },
      update: {},
      create: {
        name: 'Миючі засоби',
        slug: 'myiuchi-zasoby',
        description: 'Засоби для миття посуду, підлоги та поверхонь',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pralni-poroshky' },
      update: {},
      create: {
        name: 'Пральні порошки',
        slug: 'pralni-poroshky',
        description: 'Пральні порошки та гелі для прання',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'zasoby-dlya-vannoyi' },
      update: {},
      create: {
        name: 'Засоби для ванної',
        slug: 'zasoby-dlya-vannoyi',
        description: 'Засоби для чищення ванної та сантехніки',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'zasoby-dlya-kukhni' },
      update: {},
      create: {
        name: 'Засоби для кухні',
        slug: 'zasoby-dlya-kukhni',
        description: 'Засоби для миття посуду та кухонних поверхонь',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'osvizhuvachi-povitrya' },
      update: {},
      create: {
        name: 'Освіжувачі повітря',
        slug: 'osvizhuvachi-povitrya',
        description: 'Освіжувачі та ароматизатори для дому',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'paperovi-vyroby' },
      update: {},
      create: {
        name: 'Паперові вироби',
        slug: 'paperovi-vyroby',
        description: 'Туалетний папір, серветки, рушники',
        sortOrder: 6,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'zasoby-dlya-prybyranya' },
      update: {},
      create: {
        name: 'Засоби для прибирання',
        slug: 'zasoby-dlya-prybyranya',
        description: 'Ганчірки, губки, швабри, відра',
        sortOrder: 7,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'zasoby-dlya-skla' },
      update: {},
      create: {
        name: 'Засоби для скла',
        slug: 'zasoby-dlya-skla',
        description: 'Засоби для миття вікон та дзеркал',
        sortOrder: 8,
      },
    }),
  ]);
  console.log(`  Categories: ${categories.length} created`);

  // --- Subcategories ---
  const subcategories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'gel-dlya-posudu' },
      update: {},
      create: {
        name: 'Гель для посуду',
        slug: 'gel-dlya-posudu',
        parentId: categories[3].id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'tabletky-dlya-pmm' },
      update: {},
      create: {
        name: 'Таблетки для ПММ',
        slug: 'tabletky-dlya-pmm',
        parentId: categories[3].id,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'gel-dlya-prannya' },
      update: {},
      create: {
        name: 'Гель для прання',
        slug: 'gel-dlya-prannya',
        parentId: categories[1].id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'poroshok-dlya-prannya' },
      update: {},
      create: {
        name: 'Порошок для прання',
        slug: 'poroshok-dlya-prannya',
        parentId: categories[1].id,
        sortOrder: 2,
      },
    }),
  ]);
  console.log(`  Subcategories: ${subcategories.length} created`);

  // --- Products (50 items) ---
  const productsData = [
    // Washing agents (myiuchi-zasoby)
    { code: 'MR-PROPER-LEMON-1L', name: 'Mr. Proper Лимон засіб для миття підлоги 1л', slug: 'mr-proper-lemon-zasib-dlya-myttya-pidlogy-1l', categoryId: categories[0].id, priceRetail: 105.0, priceWholesale: 85.0, quantity: 110, isPromo: false },
    { code: 'MR-PROPER-OCEAN-1L', name: 'Mr. Proper Океан засіб для миття підлоги 1л', slug: 'mr-proper-ocean-zasib-dlya-myttya-pidlogy-1l', categoryId: categories[0].id, priceRetail: 105.0, priceWholesale: 85.0, quantity: 95, isPromo: false },
    { code: 'PRONTO-POLISH-250', name: 'Pronto поліроль для меблів 250мл', slug: 'pronto-poliroli-dlya-mebliv-250ml', categoryId: categories[0].id, priceRetail: 135.0, priceWholesale: 110.0, quantity: 60, isPromo: false },
    { code: 'CLIN-MULTI-500', name: 'Clin мультиповерхневий засіб 500мл', slug: 'clin-multipoverkhneviy-zasib-500ml', categoryId: categories[0].id, priceRetail: 89.0, priceWholesale: 72.0, quantity: 130, isPromo: true, priceRetailOld: 109.0 },
    { code: 'FROSCH-UNIVERSAL-750', name: 'Frosch універсальний засіб 750мл', slug: 'frosch-universalniy-zasib-750ml', categoryId: categories[0].id, priceRetail: 149.0, priceWholesale: 125.0, quantity: 70, isPromo: false },

    // Laundry (pralni-poroshky)
    { code: 'TIDE-ALPINE-3KG', name: 'Tide Альпійська свіжість пральний порошок 3кг', slug: 'tide-alpiyska-svizhist-pralniy-poroshok-3kg', categoryId: categories[1].id, priceRetail: 289.0, priceWholesale: 245.0, quantity: 60, isPromo: false },
    { code: 'ARIEL-PODS-30', name: 'Ariel Pods All-in-1 капсули для прання 30шт', slug: 'ariel-pods-all-in-1-kapsuly-dlya-prannya-30sht', categoryId: categories[1].id, priceRetail: 399.0, priceWholesale: 340.0, quantity: 50, isPromo: false },
    { code: 'TIDE-GEL-1.5L', name: 'Tide гель для прання Весняні квіти 1.5л', slug: 'tide-gel-dlya-prannya-vesnyani-kvity-1-5l', categoryId: subcategories[2].id, priceRetail: 259.0, priceWholesale: 215.0, quantity: 80, isPromo: true, priceRetailOld: 299.0 },
    { code: 'ARIEL-POWDER-3KG', name: 'Ariel Гірська Свіжість порошок 3кг', slug: 'ariel-girska-svizhist-poroshok-3kg', categoryId: subcategories[3].id, priceRetail: 315.0, priceWholesale: 270.0, quantity: 45, isPromo: false },
    { code: 'PERSIL-GEL-1L', name: 'Persil Power Gel гель для прання 1л', slug: 'persil-power-gel-1l', categoryId: subcategories[2].id, priceRetail: 215.0, priceWholesale: 180.0, quantity: 80, isPromo: false },

    // Bathroom (zasoby-dlya-vannoyi)
    { code: 'DOMESTOS-FRESH-750', name: 'Domestos Свіжість Атлантики засіб для ванної 750мл', slug: 'domestos-svizhist-atlantyky-750ml', categoryId: categories[2].id, priceRetail: 119.0, priceWholesale: 98.0, quantity: 90, isPromo: true, priceRetailOld: 139.0 },
    { code: 'DOMESTOS-LEMON-750', name: 'Domestos Лимон засіб для унітазу 750мл', slug: 'domestos-lemon-zasib-dlya-unitazu-750ml', categoryId: categories[2].id, priceRetail: 119.0, priceWholesale: 98.0, quantity: 85, isPromo: false },
    { code: 'CILLIT-BANG-750', name: 'Cillit Bang антіжир засіб для ванної 750мл', slug: 'cillit-bang-antizhyr-zasib-750ml', categoryId: categories[2].id, priceRetail: 159.0, priceWholesale: 130.0, quantity: 65, isPromo: false },
    { code: 'BREF-WC-BLOCK-3', name: 'Bref Power Activ блок для унітазу 3шт', slug: 'bref-power-activ-blok-dlya-unitazu-3sht', categoryId: categories[2].id, priceRetail: 139.0, priceWholesale: 115.0, quantity: 100, isPromo: true, priceRetailOld: 169.0 },
    { code: 'SANFOR-GEL-750', name: 'Sanfor антибактеріальний гель 750мл', slug: 'sanfor-antibakterialniy-gel-750ml', categoryId: categories[2].id, priceRetail: 79.0, priceWholesale: 63.0, quantity: 120, isPromo: false },

    // Kitchen (zasoby-dlya-kukhni)
    { code: 'FAIRY-LEMON-450', name: 'Fairy Лимон засіб для миття посуду 450мл', slug: 'fairy-lemon-zasib-dlya-myttya-posudu-450ml', categoryId: subcategories[0].id, priceRetail: 89.9, priceWholesale: 72.0, quantity: 150, isPromo: false },
    { code: 'FAIRY-SENSETIVE-450', name: 'Fairy Sensitive засіб для миття посуду 450мл', slug: 'fairy-sensitive-zasib-dlya-myttya-posudu-450ml', categoryId: subcategories[0].id, priceRetail: 94.5, priceWholesale: 76.0, quantity: 120, isPromo: true, priceRetailOld: 109.0 },
    { code: 'FAIRY-PLATINUM-430', name: 'Fairy Platinum засіб для миття посуду 430мл', slug: 'fairy-platinum-zasib-dlya-myttya-posudu-430ml', categoryId: subcategories[0].id, priceRetail: 119.0, priceWholesale: 98.0, quantity: 90, isPromo: false },
    { code: 'FINISH-TABS-50', name: 'Finish All in 1 таблетки для посудомийної машини 50шт', slug: 'finish-all-in-1-tabletky-dlya-pmm-50sht', categoryId: subcategories[1].id, priceRetail: 489.0, priceWholesale: 410.0, quantity: 35, isPromo: true, priceRetailOld: 559.0 },
    { code: 'FINISH-TABS-100', name: 'Finish Quantum таблетки для ПММ 100шт', slug: 'finish-quantum-tabletky-dlya-pmm-100sht', categoryId: subcategories[1].id, priceRetail: 879.0, priceWholesale: 740.0, quantity: 20, isPromo: false },
    { code: 'SOMAT-TABS-60', name: 'Somat Gold таблетки для ПММ 60шт', slug: 'somat-gold-tabletky-dlya-pmm-60sht', categoryId: subcategories[1].id, priceRetail: 549.0, priceWholesale: 460.0, quantity: 25, isPromo: false },
    { code: 'GALA-LEMON-500', name: 'Gala Лимон засіб для миття посуду 500мл', slug: 'gala-lemon-zasib-dlya-myttya-posudu-500ml', categoryId: subcategories[0].id, priceRetail: 55.0, priceWholesale: 44.0, quantity: 200, isPromo: false },
    { code: 'GALA-ALOE-500', name: 'Gala Алое засіб для миття посуду 500мл', slug: 'gala-aloe-zasib-dlya-myttya-posudu-500ml', categoryId: subcategories[0].id, priceRetail: 55.0, priceWholesale: 44.0, quantity: 180, isPromo: false },

    // Air fresheners (osvizhuvachi-povitrya)
    { code: 'GLADE-AUTO-269', name: 'Glade Автоматичний освіжувач повітря Лаванда 269мл', slug: 'glade-avtomatychniy-osvizhuvach-lavanda-269ml', categoryId: categories[4].id, priceRetail: 169.0, priceWholesale: 140.0, quantity: 45, isPromo: false },
    { code: 'GLADE-SPRAY-300', name: 'Glade Квітковий спрей освіжувач 300мл', slug: 'glade-kvitkoviy-spray-osvizhuvach-300ml', categoryId: categories[4].id, priceRetail: 95.0, priceWholesale: 78.0, quantity: 100, isPromo: false },
    { code: 'AIRWICK-ELEC-19', name: 'Air Wick електричний освіжувач Лаванда 19мл', slug: 'airwick-elektrychniy-osvizhuvach-lavanda-19ml', categoryId: categories[4].id, priceRetail: 149.0, priceWholesale: 125.0, quantity: 55, isPromo: true, priceRetailOld: 179.0 },
    { code: 'AIRWICK-REFILL-250', name: 'Air Wick змінний балон Свіжість лісу 250мл', slug: 'airwick-zminniy-balon-svizhist-lisu-250ml', categoryId: categories[4].id, priceRetail: 109.0, priceWholesale: 89.0, quantity: 70, isPromo: false },
    { code: 'BRISE-CANDLE-120', name: 'Brise ароматична свічка Ваніль 120г', slug: 'brise-aromatychna-svichka-vanil-120g', categoryId: categories[4].id, priceRetail: 89.0, priceWholesale: 72.0, quantity: 40, isPromo: false },

    // Paper products (paperovi-vyroby)
    { code: 'ZEWA-DELUXE-8', name: 'Zewa Deluxe туалетний папір 3-шаровий 8 рулонів', slug: 'zewa-deluxe-tualetniy-papir-3-sharoviy-8-ruloniv', categoryId: categories[5].id, priceRetail: 159.0, priceWholesale: 130.0, quantity: 200, isPromo: false },
    { code: 'ZEWA-DELUXE-16', name: 'Zewa Deluxe туалетний папір 3-шаровий 16 рулонів', slug: 'zewa-deluxe-tualetniy-papir-3-sharoviy-16-ruloniv', categoryId: categories[5].id, priceRetail: 299.0, priceWholesale: 250.0, quantity: 100, isPromo: true, priceRetailOld: 349.0 },
    { code: 'ZEWA-TOWEL-2', name: 'Zewa паперові рушники 2 рулони', slug: 'zewa-paperovi-rushnyky-2-rulony', categoryId: categories[5].id, priceRetail: 89.0, priceWholesale: 72.0, quantity: 150, isPromo: false },
    { code: 'KLEENEX-TISSUES-100', name: 'Kleenex серветки косметичні 100шт', slug: 'kleenex-servetky-kosmetychni-100sht', categoryId: categories[5].id, priceRetail: 65.0, priceWholesale: 52.0, quantity: 120, isPromo: false },
    { code: 'RUTA-NAPKINS-100', name: 'Рута серветки столові 100шт', slug: 'ruta-servetky-stolovi-100sht', categoryId: categories[5].id, priceRetail: 35.0, priceWholesale: 28.0, quantity: 300, isPromo: false },
    { code: 'SELPAK-TISSUE-150', name: 'Selpak серветки 3-шарові 150шт', slug: 'selpak-servetky-3-sharovi-150sht', categoryId: categories[5].id, priceRetail: 79.0, priceWholesale: 64.0, quantity: 90, isPromo: false },

    // Cleaning supplies (zasoby-dlya-prybyranya)
    { code: 'SCOTCH-BRITE-3', name: 'Scotch-Brite губки кухонні 3шт', slug: 'scotch-brite-gubky-kukhonni-3sht', categoryId: categories[6].id, priceRetail: 45.0, priceWholesale: 36.0, quantity: 250, isPromo: false },
    { code: 'VILEDA-MOP-TWIST', name: 'Vileda швабра Twist з віджимом', slug: 'vileda-shvabra-twist-z-vidzhymom', categoryId: categories[6].id, priceRetail: 599.0, priceWholesale: 490.0, quantity: 30, isPromo: false },
    { code: 'VILEDA-CLOTH-3', name: 'Vileda ганчірки мікрофібра 3шт', slug: 'vileda-ganchirky-mikrofibra-3sht', categoryId: categories[6].id, priceRetail: 149.0, priceWholesale: 120.0, quantity: 80, isPromo: true, priceRetailOld: 179.0 },
    { code: 'SPONTEX-GLOVES-M', name: 'Spontex рукавички господарські M', slug: 'spontex-rukavychky-gospodarski-m', categoryId: categories[6].id, priceRetail: 69.0, priceWholesale: 55.0, quantity: 160, isPromo: false },
    { code: 'FREKEN-BOK-BAGS-35', name: 'Фрекен Бок сміттєві пакети 35л 30шт', slug: 'freken-bok-smittevi-pakety-35l-30sht', categoryId: categories[6].id, priceRetail: 49.0, priceWholesale: 39.0, quantity: 400, isPromo: false },

    // Glass cleaners (zasoby-dlya-skla)
    { code: 'CLIN-GLASS-500', name: 'Clin засіб для миття скла 500мл', slug: 'clin-zasib-dlya-myttya-skla-500ml', categoryId: categories[7].id, priceRetail: 79.0, priceWholesale: 64.0, quantity: 110, isPromo: false },
    { code: 'MR-MUSCLE-GLASS-500', name: 'Mr. Muscle засіб для скла 500мл', slug: 'mr-muscle-zasib-dlya-skla-500ml', categoryId: categories[7].id, priceRetail: 89.0, priceWholesale: 72.0, quantity: 95, isPromo: false },
    { code: 'HELP-GLASS-750', name: 'Help засіб для скла та дзеркал 750мл', slug: 'help-zasib-dlya-skla-ta-dzerkal-750ml', categoryId: categories[7].id, priceRetail: 59.0, priceWholesale: 47.0, quantity: 140, isPromo: false },

    // More laundry products
    { code: 'LENOR-SOFTENER-1L', name: 'Lenor кондиціонер Весняне пробудження 1л', slug: 'lenor-kondytsioner-vesnyane-probudzhennya-1l', categoryId: categories[1].id, priceRetail: 139.0, priceWholesale: 115.0, quantity: 70, isPromo: false },
    { code: 'VANISH-OXI-450', name: 'Vanish Oxi Action плямовивідник 450г', slug: 'vanish-oxi-action-plyamovyvidnyk-450g', categoryId: categories[1].id, priceRetail: 199.0, priceWholesale: 165.0, quantity: 55, isPromo: true, priceRetailOld: 239.0 },
    { code: 'CALGON-TABS-15', name: 'Calgon таблетки для пральних машин 15шт', slug: 'calgon-tabletky-dlya-pralnykh-mashyn-15sht', categoryId: categories[1].id, priceRetail: 179.0, priceWholesale: 149.0, quantity: 40, isPromo: false },

    // Additional cleaning
    { code: 'SARMA-POWDER-400', name: 'Сарма чистячий порошок 400г', slug: 'sarma-chystyachiy-poroshok-400g', categoryId: categories[0].id, priceRetail: 35.0, priceWholesale: 28.0, quantity: 200, isPromo: false },
    { code: 'PEMOLUX-POWDER-480', name: 'Пемолюкс чистячий порошок Лимон 480г', slug: 'pemolux-chystyachiy-poroshok-lemon-480g', categoryId: categories[0].id, priceRetail: 45.0, priceWholesale: 36.0, quantity: 180, isPromo: false },
    { code: 'FROSCH-KITCHEN-500', name: 'Frosch засіб для кухні Сода 500мл', slug: 'frosch-zasib-dlya-kukhni-soda-500ml', categoryId: categories[3].id, priceRetail: 129.0, priceWholesale: 105.0, quantity: 65, isPromo: false },
  ];

  const products = [];
  for (const data of productsData) {
    const product = await prisma.product.upsert({
      where: { code: data.code },
      update: {},
      create: {
        code: data.code,
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        priceRetail: data.priceRetail,
        priceWholesale: data.priceWholesale,
        priceRetailOld: data.priceRetailOld ?? null,
        quantity: data.quantity,
        isPromo: data.isPromo,
      },
    });
    products.push(product);
  }
  console.log(`  Products: ${products.length} created`);

  // --- Product content for several items ---
  const contentItems = [
    { productId: products[0].id, shortDescription: 'Ефективний засіб для миття підлоги з ароматом лимона', fullDescription: 'Mr. Proper Лимон — потужний засіб для миття всіх типів підлог. Видаляє бруд та жир, залишаючи свіжий аромат лимона. Не потребує змивання.', specifications: "Об'єм: 1л\nАромат: Лимон\nТип: Рідкий засіб\nВиробник: Procter & Gamble" },
    { productId: products[9].id, shortDescription: 'Концентрований гель для прання з ефектом глибокого очищення', fullDescription: 'Persil Power Gel — інноваційний гель для прання, що проникає глибоко у волокна тканини. Видаляє навіть стійкі плями при низьких температурах.', specifications: "Об'єм: 1л\nТип: Гель для прання\nКількість прань: ~20\nВиробник: Henkel" },
    { productId: products[15].id, shortDescription: 'Ефективний засіб для миття посуду з ароматом лимона', fullDescription: 'Fairy Лимон — потужний засіб для миття посуду, який легко впорається з жиром навіть у холодній воді. Ніжний до шкіри рук.', specifications: "Об'єм: 450мл\nАромат: Лимон\nТип: Гель для миття посуду\nВиробник: Procter & Gamble" },
  ];

  for (const content of contentItems) {
    await prisma.productContent.upsert({
      where: { productId: content.productId },
      update: {},
      create: { ...content, isFilled: true },
    });
  }

  // --- Site Settings ---
  const settings = [
    { key: 'site_name', value: 'Clean Shop' },
    { key: 'site_description', value: 'Інтернет-магазин побутової хімії' },
    { key: 'contact_phone', value: '+380 50 123 45 67' },
    { key: 'contact_email', value: 'info@clean-shop.ua' },
    { key: 'contact_address', value: 'м. Київ, вул. Хрещатик, 1' },
    { key: 'work_hours', value: 'Пн-Пт: 9:00-18:00, Сб: 10:00-15:00' },
    { key: 'min_order_retail', value: '200' },
    { key: 'min_order_wholesale', value: '5000' },
    { key: 'free_delivery_from', value: '1500' },
    { key: 'currency', value: 'UAH' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`  Site Settings: ${settings.length} created`);

  // --- Static Pages ---
  const pages = [
    {
      slug: 'about',
      title: 'Про нас',
      content: '<h2>Clean Shop — ваш надійний партнер</h2><p>Ми працюємо на ринку побутової хімії з 2020 року. Пропонуємо широкий асортимент засобів від провідних світових брендів за вигідними цінами.</p>',
      isPublished: true,
    },
    {
      slug: 'delivery',
      title: 'Доставка та оплата',
      content: '<h2>Способи доставки</h2><p>Нова Пошта, Укрпошта, самовивіз. Безкоштовна доставка при замовленні від 1500 грн.</p><h2>Способи оплати</h2><p>Оплата при отриманні, онлайн оплата карткою, безготівковий розрахунок для ФОП/ТОВ.</p>',
      isPublished: true,
    },
    {
      slug: 'returns',
      title: 'Повернення та обмін',
      content: '<h2>Умови повернення</h2><p>Повернення товару протягом 14 днів з моменту покупки за умови збереження товарного вигляду та упаковки.</p>',
      isPublished: true,
    },
  ];

  for (const page of pages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log(`  Static Pages: ${pages.length} created`);

  // --- FAQ ---
  const faqItems = [
    { category: 'Замовлення', question: 'Як оформити замовлення?', answer: 'Виберіть товари, додайте у кошик, оформіть замовлення вказавши контактні дані та спосіб доставки.', sortOrder: 1 },
    { category: 'Замовлення', question: 'Яка мінімальна сума замовлення?', answer: 'Мінімальна сума для роздрібного замовлення — 200 грн, для оптового — 5000 грн.', sortOrder: 2 },
    { category: 'Оптова торгівля', question: 'Як стати оптовим клієнтом?', answer: 'Зареєструйтесь на сайті, перейдіть у особистий кабінет та подайте заявку на оптове обслуговування. Менеджер зв\'яже з вами протягом доби.', sortOrder: 3 },
    { category: 'Доставка', question: 'Чи є безкоштовна доставка?', answer: 'Так, доставка безкоштовна при замовленні від 1500 грн.', sortOrder: 4 },
  ];

  await prisma.faqItem.deleteMany({});
  for (const faq of faqItems) {
    await prisma.faqItem.create({ data: faq });
  }
  console.log(`  FAQ Items: ${faqItems.length} created`);

  // --- Wholesale Rules ---
  const wholesaleRules = [
    { ruleType: 'min_quantity' as const, productId: products[15].id, value: 12 },
    { ruleType: 'min_quantity' as const, productId: products[9].id, value: 6 },
    { ruleType: 'min_quantity' as const, productId: products[28].id, value: 10 },
    { ruleType: 'min_order_amount' as const, productId: null, value: 5000 },
    { ruleType: 'multiplicity' as const, productId: products[5].id, value: 3 },
  ];

  await prisma.wholesaleRule.deleteMany({});
  for (const rule of wholesaleRules) {
    await prisma.wholesaleRule.create({
      data: {
        ruleType: rule.ruleType,
        productId: rule.productId,
        value: rule.value,
      },
    });
  }
  console.log(`  Wholesale Rules: ${wholesaleRules.length} created`);

  // --- Themes ---
  const themes = [
    { folderName: 'freshness', displayName: 'Свіжість та Органіка', description: 'Світла тема з акцентами зелені та свіжості', isActive: true },
    { folderName: 'crystal', displayName: 'Кристальна чистота', description: 'Мінімалістична тема в синьо-білих тонах' },
    { folderName: 'cozy', displayName: 'Домашній затишок', description: 'Тепла тема з м\'якими бежевими тонами' },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { folderName: theme.folderName },
      update: {},
      create: {
        folderName: theme.folderName,
        displayName: theme.displayName,
        description: theme.description,
        isActive: theme.isActive ?? false,
      },
    });
  }
  console.log(`  Themes: ${themes.length} created`);

  // --- Orders (10 test orders with various statuses) ---
  const orderStatuses: Array<{ status: 'new_order' | 'processing' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'returned'; paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded'; daysAgo: number }> = [
    { status: 'completed', paymentStatus: 'paid', daysAgo: 45 },
    { status: 'completed', paymentStatus: 'paid', daysAgo: 30 },
    { status: 'completed', paymentStatus: 'paid', daysAgo: 20 },
    { status: 'shipped', paymentStatus: 'paid', daysAgo: 5 },
    { status: 'confirmed', paymentStatus: 'pending', daysAgo: 3 },
    { status: 'processing', paymentStatus: 'pending', daysAgo: 2 },
    { status: 'new_order', paymentStatus: 'pending', daysAgo: 1 },
    { status: 'cancelled', paymentStatus: 'pending', daysAgo: 15 },
    { status: 'paid', paymentStatus: 'paid', daysAgo: 4 },
    { status: 'returned', paymentStatus: 'refunded', daysAgo: 10 },
  ];

  const orders = [];
  for (let i = 0; i < orderStatuses.length; i++) {
    const { status, paymentStatus, daysAgo } = orderStatuses[i];
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const orderNum = `CS-${String(1000 + i + 1).padStart(6, '0')}`;
    const userId = i < 5 ? wholesaler.id : (i < 8 ? client.id : wholesaler.id);
    const clientType = userId === wholesaler.id ? 'wholesale' as const : 'retail' as const;

    // Pick 2-4 random products for each order
    const itemCount = 2 + (i % 3);
    const orderItems = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const productIdx = (i * 3 + j) % products.length;
      const qty = clientType === 'wholesale' ? 12 + j * 6 : 1 + j;
      const price = clientType === 'wholesale'
        ? Number(products[productIdx].priceWholesale ?? products[productIdx].priceRetail)
        : Number(products[productIdx].priceRetail);
      totalAmount += price * qty;
      orderItems.push({
        productId: products[productIdx].id,
        productCode: products[productIdx].code,
        productName: products[productIdx].name,
        quantity: qty,
        priceAtOrder: price,
      });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: orderNum,
        status,
        clientType,
        totalAmount,
        itemsCount: orderItems.length,
        contactName: userId === wholesaler.id ? 'Оптовий Покупець Іван' : 'Тестовий Клієнт',
        contactPhone: userId === wholesaler.id ? '+380671234567' : '+380991112233',
        contactEmail: userId === wholesaler.id ? 'wholesaler@test.ua' : 'client@test.ua',
        deliveryMethod: 'nova_poshta',
        deliveryCity: 'Київ',
        paymentMethod: clientType === 'wholesale' ? 'bank_transfer' : 'cod',
        paymentStatus,
        createdAt,
        items: { create: orderItems },
      },
    });
    orders.push(order);
  }
  console.log(`  Orders: ${orders.length} created`);

  // --- Wishlists (named lists for wholesaler) ---
  const wishlist1 = await prisma.wishlist.create({
    data: {
      userId: wholesaler.id,
      name: 'Регулярне замовлення',
      items: {
        create: [
          { productId: products[15].id },
          { productId: products[9].id },
          { productId: products[5].id },
          { productId: products[28].id },
        ],
      },
    },
  });

  const wishlist2 = await prisma.wishlist.create({
    data: {
      userId: wholesaler.id,
      name: 'Акційні товари',
      items: {
        create: [
          { productId: products[3].id },
          { productId: products[7].id },
          { productId: products[10].id },
          { productId: products[18].id },
        ],
      },
    },
  });

  await prisma.wishlist.create({
    data: {
      userId: client.id,
      name: 'Мій список',
      items: {
        create: [
          { productId: products[0].id },
          { productId: products[23].id },
        ],
      },
    },
  });
  console.log(`  Wishlists: 3 created (${wishlist1.name}, ${wishlist2.name}, Мій список)`);

  // --- Product Notes (for wholesaler) ---
  const noteItems = [
    { userId: wholesaler.id, productId: products[15].id, noteText: 'Замовляти щомісяця по 24 шт' },
    { userId: wholesaler.id, productId: products[5].id, noteText: 'Кратність 3 шт. Мінімум 2 упаковки' },
    { userId: wholesaler.id, productId: products[9].id, noteText: 'Хороший продавець. Клієнти задоволені' },
    { userId: wholesaler.id, productId: products[18].id, noteText: 'Перевірити ціну на наступному замовленні' },
    { userId: wholesaler.id, productId: products[28].id, noteText: 'Брати тільки 3-шаровий' },
  ];

  for (const note of noteItems) {
    await prisma.productNote.upsert({
      where: { userId_productId: { userId: note.userId, productId: note.productId } },
      update: {},
      create: note,
    });
  }
  console.log(`  Product Notes: ${noteItems.length} created`);

  console.log('\nSeeding complete!');
  console.log('---');
  console.log('Test accounts:');
  console.log('  Admin:      admin@clean-shop.ua / Admin123!');
  console.log('  Manager:    manager@clean-shop.ua / Manager123!');
  console.log('  Client:     client@test.ua / Client123!');
  console.log('  Wholesaler: wholesaler@test.ua / Wholesaler123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
