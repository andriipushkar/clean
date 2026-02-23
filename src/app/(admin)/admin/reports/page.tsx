'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface ReportTemplate {
  key: string;
  label: string;
  description: string;
  fields: { name: string; label: string; type: 'date' | 'select'; options?: { value: string; label: string }[] }[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    key: 'sales_summary',
    label: 'Звіт про продажі',
    description: 'Загальна статистика продажів за обраний період',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
    ],
  },
  {
    key: 'products_stock',
    label: 'Залишки товарів',
    description: 'Звіт по залишках та руху товарів',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
    ],
  },
  {
    key: 'orders_by_status',
    label: 'Замовлення за статусом',
    description: 'Розбивка замовлень за статусами за обраний період',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
      {
        name: 'status', label: 'Статус', type: 'select',
        options: [
          { value: '', label: 'Всі' },
          { value: 'new_order', label: 'Нові' },
          { value: 'processing', label: 'В обробці' },
          { value: 'confirmed', label: 'Підтверджені' },
          { value: 'shipped', label: 'Відправлені' },
          { value: 'completed', label: 'Завершені' },
          { value: 'cancelled', label: 'Скасовані' },
        ],
      },
    ],
  },
  {
    key: 'clients_activity',
    label: 'Активність клієнтів',
    description: 'Звіт по активності клієнтів: замовлення, реєстрації, повернення',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
    ],
  },
  {
    key: 'wholesale_report',
    label: 'Оптові продажі',
    description: 'Деталізований звіт по оптових замовленнях та клієнтах',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
    ],
  },
  {
    key: 'delivery_report',
    label: 'Звіт по доставках',
    description: 'Статистика доставок: методи, час, вартість',
    fields: [
      { name: 'dateFrom', label: 'Дата з', type: 'date' },
      { name: 'dateTo', label: 'Дата по', type: 'date' },
    ],
  },
];

export default function AdminReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (tpl: ReportTemplate) => {
    setSelectedTemplate(tpl);
    setFormValues({});
    setDownloadUrl(null);
    setError(null);
  };

  const handleGenerate = async (format: 'xlsx' | 'csv' | 'pdf') => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const res = await apiClient.post<{ url: string }>('/api/v1/admin/reports/generate', {
        templateKey: selectedTemplate.key,
        format,
        params: formValues,
      });
      if (res.success && res.data?.url) {
        setDownloadUrl(res.data.url);
        window.open(res.data.url, '_blank');
      } else {
        setError(res.error || 'Помилка генерації звіту');
      }
    } catch {
      setError('Помилка мережі');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Звіти</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Template list */}
        <div className="space-y-2 lg:col-span-1">
          {REPORT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => handleSelect(tpl)}
              className={`w-full rounded-[var(--radius)] border p-4 text-left transition-colors ${
                selectedTemplate?.key === tpl.key
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              <p className="text-sm font-semibold">{tpl.label}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{tpl.description}</p>
            </button>
          ))}
        </div>

        {/* Report form */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
              <h3 className="mb-4 text-lg font-semibold">{selectedTemplate.label}</h3>
              <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{selectedTemplate.description}</p>

              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name}>
                    {field.type === 'date' ? (
                      <Input
                        label={field.label}
                        type="date"
                        value={formValues[field.name] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium">{field.label}</label>
                        <Select
                          options={field.options}
                          value={formValues[field.name] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleGenerate('xlsx')} isLoading={isGenerating}>Завантажити XLSX</Button>
                <Button variant="outline" onClick={() => handleGenerate('csv')} isLoading={isGenerating}>CSV</Button>
                <Button variant="outline" onClick={() => handleGenerate('pdf')} isLoading={isGenerating}>PDF</Button>
              </div>

              {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
              {downloadUrl && (
                <p className="mt-3 text-sm text-green-600">
                  Звіт згенеровано.{' '}
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="underline">Завантажити</a>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-12 text-[var(--color-text-secondary)]">
              Оберіть шаблон звіту зліва
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
