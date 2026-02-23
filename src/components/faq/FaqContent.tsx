'use client';

import { useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';
import Accordion, { AccordionItem } from '@/components/ui/Accordion';
import FaqSearch from './FaqSearch';
import { sanitizeHtml } from '@/utils/sanitize';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FaqContentProps {
  groupedFaq: Record<string, FaqItem[]>;
}

function highlightText(text: string, query: string): string {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

export default function FaqContent({ groupedFaq }: FaqContentProps) {
  const [searchResults, setSearchResults] = useState<FaqItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const categories = Object.keys(groupedFaq);

  const handleClick = (id: number) => {
    fetch(`/api/v1/faq/${id}/click`, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
  };

  const renderFaqList = (items: FaqItem[], query?: string) => (
    <Accordion>
      {items.map((item) => {
        const title = query
          ? <span dangerouslySetInnerHTML={{ __html: highlightText(item.question, query) }} />
          : item.question;
        const answerHtml = query
          ? highlightText(sanitizeHtml(item.answer), query)
          : sanitizeHtml(item.answer);

        return (
          <AccordionItem key={item.id} title={title}>
            <div
              className="prose max-w-none text-sm text-[var(--color-text-secondary)]"
              onClick={() => handleClick(item.id)}
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  const tabs = categories.map((cat) => ({
    id: cat,
    label: cat,
    content: renderFaqList(groupedFaq[cat]) as ReactNode,
  }));

  return (
    <div>
      <FaqSearch onResults={setSearchResults} onQueryChange={setSearchQuery} />

      <div className="mt-6">
        {searchResults !== null ? (
          searchResults.length > 0 ? (
            renderFaqList(searchResults, searchQuery)
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              Нічого не знайдено
            </p>
          )
        ) : tabs.length > 0 ? (
          <Tabs tabs={tabs} />
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            Поки що немає питань
          </p>
        )}
      </div>

      {/* "Не знайшли відповідь?" block */}
      <div className="mt-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold">Не знайшли відповідь?</h3>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Зв&apos;яжіться з нами — ми з радістю допоможемо!
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/contacts"
            className="inline-block rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Написати нам
          </a>
          <a
            href="tel:+380XXXXXXXXX"
            className="inline-block rounded-[var(--radius)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
          >
            Зателефонувати
          </a>
        </div>
      </div>
    </div>
  );
}
