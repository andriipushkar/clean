'use client';

import { Check } from '@/components/icons';

const STEPS = [
  { id: 1, label: 'Контакти' },
  { id: 2, label: 'Доставка' },
  { id: 3, label: 'Оплата' },
  { id: 4, label: 'Підтвердження' },
];

interface CheckoutStepsProps {
  currentStep: number;
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Кроки оформлення" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-[var(--color-primary)] text-white'
                      : isCurrent
                        ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-2 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : step.id}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    isCompleted ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
