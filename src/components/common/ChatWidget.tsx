'use client';

import { useState } from 'react';
import { MessageCircle, Close, ChevronRight } from '@/components/icons';

const FAQ_ITEMS = [
  {
    question: 'Як зробити замовлення?',
    answer:
      'Додайте товари до кошика та перейдіть до оформлення. Заповніть контактні дані, оберіть спосіб доставки та оплати.',
  },
  {
    question: 'Які способи доставки доступні?',
    answer:
      'Доставка здійснюється Новою Поштою та Укрпоштою по всій Україні. Також доступний самовивіз.',
  },
  {
    question: 'Як стати оптовим клієнтом?',
    answer:
      'Зареєструйтесь на сайті та подайте заявку на оптовий статус у кабінеті клієнта. Менеджер розгляне заявку протягом 1-2 робочих днів.',
  },
  {
    question: 'Як повернути товар?',
    answer:
      'Повернення можливе протягом 14 днів з моменту отримання. Зверніться до менеджера через форму зворотного зв\'язку або Telegram.',
  },
  {
    question: 'Які способи оплати?',
    answer:
      'Оплата картою онлайн (LiqPay, Monobank), накладений платіж, безготівковий розрахунок для юридичних осіб.',
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  const telegramBotUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/CleanShopBot';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Онлайн-чат"
      >
        <MessageCircle size={22} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-3 text-white">
            <div>
              <h3 className="text-sm font-bold">Clean Shop</h3>
              <p className="text-xs opacity-80">Часті питання та підтримка</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedFaq(null);
              }}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
              aria-label="Закрити чат"
            >
              <Close size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-auto p-4">
            {selectedFaq !== null ? (
              <div>
                <button
                  onClick={() => setSelectedFaq(null)}
                  className="mb-3 flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Назад до питань
                </button>
                <p className="mb-2 text-sm font-semibold">{FAQ_ITEMS[selectedFaq].question}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {FAQ_ITEMS[selectedFaq].answer}
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
                  Оберіть питання або зв&apos;яжіться з менеджером:
                </p>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedFaq(index)}
                      className="flex w-full items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
                    >
                      <span>{item.question}</span>
                      <ChevronRight size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer — Connect to manager */}
          <div className="border-t border-[var(--color-border)] p-3">
            <a
              href={telegramBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <MessageCircle size={16} />
              Написати менеджеру в Telegram
            </a>
          </div>
        </div>
      )}
    </>
  );
}
