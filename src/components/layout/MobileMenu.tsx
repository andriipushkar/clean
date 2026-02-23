'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Close, Telegram, Viber, Instagram } from '@/components/icons';
import Accordion, { AccordionItem } from '@/components/ui/Accordion';
import type { CategoryListItem } from '@/types/category';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryListItem[];
}

export default function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button when menu opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Focus trap
      if (e.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parents = categories.filter((c) => !c.parentId);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню навігації">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-bg-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav ref={menuRef} role="navigation" aria-label="Мобільна навігація" className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-[var(--color-bg)] shadow-[var(--shadow-xl)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-lg font-bold text-[var(--color-primary)]">Меню</span>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Закрити">
            <Close size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-2">
          <Link
            href="/catalog"
            className="block py-3 font-medium transition-colors hover:text-[var(--color-primary)]"
            onClick={onClose}
          >
            Весь каталог
          </Link>

          <Accordion>
            {parents.map((cat) => {
              const children = categories.filter((c) => c.parentId === cat.id);
              if (children.length === 0) {
                return (
                  <div key={cat.id} className="border-b border-[var(--color-border)]">
                    <Link
                      href={`/catalog?category=${cat.slug}`}
                      className="block py-4 text-sm transition-colors hover:text-[var(--color-primary)]"
                      onClick={onClose}
                    >
                      {cat.name}
                    </Link>
                  </div>
                );
              }
              return (
                <AccordionItem key={cat.id} title={cat.name}>
                  <div className="flex flex-col gap-1 pl-4">
                    <Link
                      href={`/catalog?category=${cat.slug}`}
                      className="py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                      onClick={onClose}
                    >
                      Всі {cat.name.toLowerCase()}
                    </Link>
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/catalog?category=${child.slug}`}
                        className="py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                        onClick={onClose}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <p className="mb-2 text-xs text-[var(--color-text-secondary)]">Ми в соціальних мережах</p>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Telegram" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <Telegram size={20} />
            </a>
            <a href="#" aria-label="Viber" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <Viber size={20} />
            </a>
            <a href="#" aria-label="Instagram" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
