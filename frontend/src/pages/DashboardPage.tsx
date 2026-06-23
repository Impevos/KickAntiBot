import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useChannel } from '../context/ChannelContext';
import { dashboardService } from '../services/api-services';
import { StatCard, Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatRelative } from '../lib/utils';
import type { DashboardSummary } from '../types/api';

export function DashboardPage() {
  const { activeChannel } = useChannel();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeChannel) return;
    setIsLoading(true);
    dashboardService
      .getSummary(activeChannel.id)
      .then(setSummary)
      .finally(() => setIsLoading(false));
  }, [activeChannel]);

  if (isLoading || !summary) {
    return <LoadingSpinner label="Dashboard yükleniyor..." />;
  }

  const bannedCount = summary.totalSuspiciousUsersCount;
  const protectionActive = summary.activeAlertsCount >= 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktif Alarmlar"
          value={summary.activeAlertsCount}
          subtitle="Okunmamış bildirimler"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="red"
        />
        <StatCard
          title="Şüpheli Kullanıcılar"
          value={summary.totalSuspiciousUsersCount}
          subtitle="Toplam tespit edilen"
          icon={<Bot className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          title="Ortalama Risk Skoru"
          value={summary.averageRiskScore.toFixed(1)}
          subtitle="Kanal geneli"
          icon={<TrendingUp className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          title="Koruma Durumu"
          value={protectionActive ? 'Aktif' : 'Pasif'}
          subtitle={`Bugün ${summary.todayStats.newBotsDetected} yeni bot`}
          icon={<Shield className="h-5 w-5" />}
          accent="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Son Aktiviteler</h2>
            <Activity className="h-4 w-4 text-muted" />
          </div>
          <div className="space-y-3">
            {summary.recentAlerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Henüz aktivite bulunmuyor.
              </p>
            ) : (
              summary.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 transition hover:bg-surface-hover"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      alert.isRead ? 'bg-muted' : 'bg-kick animate-pulse'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted truncate">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-muted/70">
                      {formatRelative(alert.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-white">
            Bugünün Özeti
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-muted">Oluşturulan Alarmlar</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.todayStats.alertsCreated}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-muted">Yeni Bot Tespiti</p>
              <p className="mt-1 text-2xl font-bold text-kick">
                {summary.todayStats.newBotsDetected}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-sm text-muted">Engellenen / İzlenen</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {bannedCount}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
