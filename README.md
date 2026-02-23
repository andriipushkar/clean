# Clean Shop

Оптово-роздрібна платформа інтернет-магазину побутової хімії.

## Стек технологій

- **Framework:** Next.js 16 (App Router)
- **Мова:** TypeScript 5.9
- **UI:** React 19, Tailwind CSS 4
- **База даних:** PostgreSQL + Prisma ORM
- **Кеш/черги:** Redis + BullMQ
- **Аутентифікація:** JWT (bcryptjs)
- **PDF:** PDFKit
- **Email:** Nodemailer
- **Push-сповіщення:** Web Push
- **Боти:** Telegram Bot API
- **Тестування:** Vitest (unit), Playwright (E2E)

## Quick Start

### Передумови

- Node.js >= 20
- PostgreSQL >= 15
- Redis >= 7

### Встановлення

```bash
# Клонувати репозиторій
git clone <repo-url> && cd clean

# Встановити залежності
npm install

# Скопіювати .env
cp .env.example .env
# Заповнити DATABASE_URL, REDIS_URL, JWT_SECRET та інші змінні

# Запустити Docker-сервіси (PostgreSQL + Redis)
npm run docker:up

# Генерація Prisma-клієнта та міграції
npm run db:generate
npm run db:migrate

# Заповнити seed-дані
npm run db:seed

# Запустити dev-сервер
npm run dev
```

Додаток доступний на http://localhost:3000

### Docker

```bash
npm run docker:up      # Запустити PostgreSQL + Redis
npm run docker:down    # Зупинити
npm run docker:logs    # Логи контейнерів
```

## Скрипти

| Скрипт | Опис |
|--------|------|
| `npm run dev` | Dev-сервер з hot reload |
| `npm run build` | Продакшн-білд |
| `npm start` | Запустити продакшн-сервер |
| `npm run lint` | ESLint + autofix |
| `npm run format` | Prettier форматування |
| `npm test` | Запустити unit-тести |
| `npm run test:watch` | Тести в watch-режимі |
| `npm run test:coverage` | Тести з покриттям |
| `npm run test:e2e` | E2E тести (Playwright) |
| `npm run db:generate` | Генерація Prisma-клієнта |
| `npm run db:migrate` | Запустити міграції |
| `npm run db:seed` | Заповнити тестові дані |
| `npm run db:studio` | Prisma Studio (GUI) |

## Структура проєкту

```
src/
├── app/                  # Next.js App Router
│   ├── (shop)/           # Магазин (каталог, кошик, кабінет)
│   ├── (admin)/          # Адмін-панель (18 сторінок)
│   ├── (auth)/           # Авторизація
│   └── api/v1/           # REST API
├── components/           # React-компоненти
├── services/             # Бізнес-логіка
├── validators/           # Zod-схеми валідації
├── hooks/                # React-хуки
├── providers/            # Context-провайдери
├── lib/                  # Prisma, Redis, утиліти
├── utils/                # Допоміжні функції
├── middleware/            # Middleware (auth)
└── test/                 # Тестові утиліти
prisma/
├── schema.prisma         # Схема бази даних
├── migrations/           # Міграції
└── seed.ts               # Seed-дані
e2e/                      # Playwright E2E тести
```

## Основні можливості

- Каталог з повнотекстовим пошуком (PostgreSQL tsvector)
- Роздрібні та оптові ціни з персональним ціноутворенням
- Кошик з об'єднанням після авторизації
- Замовлення зі статусною моделлю та SMS/email/Telegram-сповіщеннями
- Імпорт товарів з Excel з автоматичною валідацією
- Telegram-бот з каталогом, пошуком та нотифікаціями
- Адмін-панель: замовлення, товари, імпорт, користувачі, аналітика
- 3 теми оформлення (Свіжість та Органіка, Кристальна чистота, Домашній затишок)
- Реферальна та бонусна програми
- Генерація PDF: рахунки, накладні, комерційні пропозиції
- Push-сповіщення через Service Worker

## Ліцензія

Приватний проєкт.
