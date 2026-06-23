import { useEffect, useState } from 'react';
import { useChannel } from '../context/ChannelContext';
import { activityLogsService } from '../services/api-services';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner';
import { formatDate } from '../lib/utils';
import type { ActivityLog, ActivityLogType } from '../types/api';

const typeLabels: Record<ActivityLogType, string> = {
  ALERT: 'Alarm',
  SUSPICIOUS_USER: 'Şüpheli Kullanıcı',
  RISK_SCORE: 'Risk Skoru',
  REPORT: 'Rapor',
};

const typeColors: Record<ActivityLogType, string> = {
  ALERT: 'text-red-400 bg-red-500/10',
  SUSPICIOUS_USER: 'text-amber-400 bg-amber-500/10',
  RISK_SCORE: 'text-blue-400 bg-blue-500/10',
  REPORT: 'text-emerald-400 bg-emerald-500/10',
};

export function ActivityLogsPage() {
  const { activeChannel } = useChannel();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ActivityLogType | ''>('');

  useEffect(() => {
    if (!activeChannel) return;
    setIsLoading(true);
    activityLogsService
      .getLogs({
        channelId: activeChannel.id,
        type: typeFilter || undefined,
      })
      .then(({ data, totalItems: total }) => {
        setLogs(data);
        setTotalItems(total);
      })
      .finally(() => setIsLoading(false));
  }, [activeChannel, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Toplam {totalItems} kayıt</p>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityLogType | '')}
          className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Tüm Tipler</option>
          <option value="ALERT">Alarm</option>
          <option value="SUSPICIOUS_USER">Şüpheli Kullanıcı</option>
          <option value="RISK_SCORE">Risk Skoru</option>
          <option value="REPORT">Rapor</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Log kaydı bulunamadı"
          description="Henüz sistem aktivitesi yok"
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} padding>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${typeColors[log.type]}`}
                  >
                    {typeLabels[log.type]}
                  </span>
                  <div>
                    <p className="font-medium text-white">{log.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{log.description}</p>
                    <p className="mt-2 text-xs text-muted/70">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
                <SeverityBadge severity={log.severity} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
