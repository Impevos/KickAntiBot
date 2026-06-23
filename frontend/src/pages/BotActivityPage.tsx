import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useChannel } from '../context/ChannelContext';
import { useSuspiciousUsers } from '../hooks/use-suspicious-users';
import { SuspiciousUserDetailModal } from '../components/SuspiciousUserDetailModal';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner';
import {
  formatDate,
  getStatusLabel,
  getStatusStyle,
} from '../lib/utils';
import { ApiError } from '../lib/api';
import type {
  AlertSeverity,
  SuspiciousUserStatus,
} from '../types/api';

const PAGE_SIZE = 10;

export function BotActivityPage() {
  const { activeChannel } = useChannel();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SuspiciousUserStatus | ''>(
    '',
  );
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | ''>('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, severityFilter]);

  const { data, isLoading, error } = useSuspiciousUsers({
    channelId: activeChannel?.id,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const users = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Kullanıcı adında ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-kick/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as SuspiciousUserStatus | '')
                }
                className="appearance-none rounded-xl border border-border bg-surface py-2.5 pl-10 pr-8 text-sm text-white outline-none"
              >
                <option value="">Tüm Durumlar</option>
                <option value="DETECTED">Tespit Edildi</option>
                <option value="INVESTIGATING">İnceleniyor</option>
                <option value="SAFE">Güvenli</option>
                <option value="BANNED">Engellendi</option>
              </select>
            </div>
            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as AlertSeverity | '')
              }
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">Tüm Seviyeler</option>
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
              <option value="CRITICAL">Kritik</option>
            </select>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error instanceof ApiError
            ? error.message
            : 'Şüpheli kullanıcılar yüklenemedi.'}
        </div>
      ) : isLoading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          title="Şüpheli kullanıcı bulunamadı"
          description="Filtreleri değiştirmeyi deneyin"
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-left text-muted">
                  <th className="px-4 py-3 font-medium">Kullanıcı</th>
                  <th className="px-4 py-3 font-medium">Sebep</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Seviye</th>
                  <th className="px-4 py-3 font-medium">Etiketler</th>
                  <th className="px-4 py-3 font-medium">Son Görülme</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="cursor-pointer border-b border-border/50 transition hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-xs text-muted">{user.kickUserId}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted">
                      {user.reason}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={getStatusLabel(user.status)}
                        className={getStatusStyle(user.status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={user.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(user.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {users.map((user) => (
              <Card
                key={user.id}
                padding
                className="cursor-pointer"
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{user.username}</p>
                    <p className="text-xs text-muted">{user.reason}</p>
                  </div>
                  <SeverityBadge severity={user.severity} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={getStatusLabel(user.status)}
                    className={getStatusStyle(user.status)}
                  />
                  {user.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Son görülme: {formatDate(user.lastSeen)}
                </p>
              </Card>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedUserId && (
        <SuspiciousUserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
