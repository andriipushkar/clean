'use client';

import { Minus, Plus } from '@/components/icons';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 999,
  className = '',
}: QuantitySelectorProps) {
  const handleChange = (newValue: number) => {
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  return (
    <div className={`inline-flex items-center rounded-[var(--radius)] border border-[var(--color-border)] ${className}`}>
      <button
        onClick={() => handleChange(value - 1)}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-40"
        aria-label="Зменшити"
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => handleChange(Number(e.target.value) || min)}
        min={min}
        max={max}
        className="h-10 w-14 border-x border-[var(--color-border)] bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={() => handleChange(value + 1)}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-40"
        aria-label="Збільшити"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
