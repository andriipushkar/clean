'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { USER_ROLE_LABELS, WHOLESALE_STATUS_LABELS } from '@/types/user';
import type { UserRole, WholesaleStatus } from '@/types/user';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface UserDetail {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  companyName: string | null;
  edrpou: string | null;
  legalAddress: string | null;
  bankIban: string | null;
  bankName: string | null;
  ownershipType: string | null;
  taxSystem: string | null;
  wholesaleStatus: WholesaleStatus;
  wholesaleRequestDate: string | null;
  wholesaleApprovedDate: string | null;
  wholesaleMonthlyVol: string | null;
  assignedManager: { id: number; fullName: string; email: string } | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { orders: number };
}

const ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }));

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    apiClient
      .get<UserDetail>(`/api/v1/admin/users/${id}`)
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
          setSelectedRole(res.data.role);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleRoleUpdate = async () => {
    if (!selectedRole || selectedRole === user?.role) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.put(`/api/v1/admin/users/${id}`, { role: selectedRole });
      if (res.success) {
        setUser((prev) => prev ? { ...prev, role: selectedRole as UserRole } : prev);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <p>Користувача не знайдено</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
          До списку
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-[var(--color-primary)] hover:underline">
        ← Користувачі
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={ROLE_OPTIONS}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-40"
          />
          <Button
            size="sm"
            onClick={handleRoleUpdate}
            isLoading={isUpdating}
            disabled={selectedRole === user.role}
          >
            Зберегти
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard title="Основні дані">
          <Row label="Роль" value={USER_ROLE_LABELS[user.role]} />
          <Row label="Телефон" value={user.phone || '—'} />
          <Row label="Верифікований" value={user.isVerified ? 'Так' : 'Ні'} />
          <Row label="Замовлень" value={String(user._count.orders)} />
          <Row label="Зареєстрований" value={formatDate(user.createdAt)} />
        </InfoCard>

        <InfoCard title="Оптовий статус">
          <Row label="Статус" value={WHOLESALE_STATUS_LABELS[user.wholesaleStatus]} />
          <Row label="Дата запиту" value={formatDate(user.wholesaleRequestDate)} />
          <Row label="Дата підтвердження" value={formatDate(user.wholesaleApprovedDate)} />
          <Row label="Очікуваний обсяг" value={user.wholesaleMonthlyVol || '—'} />
          {user.assignedManager && (
            <Row label="Менеджер" value={user.assignedManager.fullName} />
          )}
        </InfoCard>

        {user.companyName && (
          <InfoCard title="Дані компанії">
            <Row label="Компанія" value={user.companyName} />
            <Row label="ЄДРПОУ" value={user.edrpou || '—'} />
            <Row label="Адреса" value={user.legalAddress || '—'} />
            <Row label="IBAN" value={user.bankIban || '—'} />
            <Row label="Банк" value={user.bankName || '—'} />
            <Row label="Форма" value={user.ownershipType || '—'} />
            <Row label="Податки" value={user.taxSystem === 'with_vat' ? 'З ПДВ' : user.taxSystem === 'without_vat' ? 'Без ПДВ' : '—'} />
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
