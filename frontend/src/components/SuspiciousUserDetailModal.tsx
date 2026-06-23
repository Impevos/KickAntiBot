import { X } from 'lucide-react';
import { useSuspiciousUserDetail, useRiskScores } from '../hooks/use-suspicious-user-detail';
import { SeverityBadge, StatusBadge } from './ui/Badge';
import { LoadingSpinner } from './ui/LoadingSpinner';
import {
  formatDate,
  getStatusLabel,
  getStatusStyle,
} from '../lib/utils';
import { ApiError } from '../lib/api';

interface SuspiciousUserDetailModalProps {
  userId: string;
  onClose: () => void;
}

export function SuspiciousUserDetailModal({
  userId,
  onClose,
}: SuspiciousUserDetailModalProps) {
  const { data: user, isLoading, error } = useSuspiciousUserDetail(userId);
  const { data: riskScores } = useRiskScores(userId);

  const scores = user?.riskScores ?? riskScores ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-surface-hover"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <LoadingSpinner label="Detay yükleniyor..." />
        ) : error || !user ? (
          <p className="py-8 text-center text-sm text-red-400">
            {error instanceof ApiError
              ? error.message
              : 'Kullanıcı detayı yüklenemedi.'}
          </p>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">{user.username}</h2>
              <p className="text-sm text-muted">{user.kickUserId}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  label={getStatusLabel(user.status)}
                  className={getStatusStyle(user.status)}
                />
                <SeverityBadge severity={user.severity} />
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs text-muted">Sebep</p>
              <p className="mt-1 text-sm text-white">{user.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface p-3">
                <p className="text-xs text-muted">İlk Görülme</p>
                <p className="mt-1 text-white">{formatDate(user.firstSeen)}</p>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <p className="text-xs text-muted">Son Görülme</p>
                <p className="mt-1 text-white">{formatDate(user.lastSeen)}</p>
              </div>
            </div>

            {user.tags.length > 0 && (
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
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                Risk Skoru Geçmişi
              </h3>
              {scores.length === 0 ? (
                <p className="text-sm text-muted">Risk skoru kaydı yok.</p>
              ) : (
                <div className="space-y-2">
                  {scores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between rounded-xl bg-surface p-3"
                    >
                      <div>
                        <p className="text-sm text-white">{score.reason}</p>
                        <p className="text-xs text-muted">
                          {formatDate(score.createdAt)} · {score.algorithmVersion}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-kick">
                        {score.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
