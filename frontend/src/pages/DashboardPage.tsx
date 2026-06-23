import {
  AlertTriangle,
  Bot,
  Shield,
  TrendingUp,
  Activity,
  FileText,
  Check,
} from 'lucide-react';
import { useChannel } from '../context/ChannelContext';
import { useDashboardSummary } from '../hooks/use-dashboard';
import { useAlerts, useMarkAlertRead } from '../hooks/use-alerts';
import { useReports } from '../hooks/use-reports';
import { StatCard, Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatRelative, formatDate } from '../lib/utils';
import { ApiError } from '../lib/api';

const periodLabels = {
  DAILY: 'Günlük',
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
} as const;

export function DashboardPage() {
  const { activeChannel } = useChannel();
  const channelId = activeChannel?.id;

  const { data: summary, isLoading, error } = useDashboardSummary(channelId);
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts(channelId);
  const { data: reports = [], isLoading: reportsLoading } = useReports(channelId);
  const markRead = useMarkAlertRead(channelId);

  if (isLoading) {
    return <LoadingSpinner label="Dashboard yükleniyor..." />;
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error instanceof ApiError
          ? error.message
          : 'Dashboard verileri yüklenemedi.'}
      </div>
    );
  }

  const bannedCount = summary.totalSuspiciousUsersCount;
  const protectionActive = summary.activeAlertsCount >= 0;

  const handleMarkRead = (alertId: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(alertId);
    }
  };

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
            <h2 className="text-base font-semibold text-white">Alarmlar</h2>
            <Activity className="h-4 w-4 text-muted" />
          </div>
          {alertsLoading ? (
            <LoadingSpinner />
          ) : alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Henüz alarm bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => handleMarkRead(alert.id, alert.isRead)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:bg-surface-hover"
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
                      {!alert.isRead && (
                        <span className="text-xs text-muted">
                          Okundu işaretle
                        </span>
                      )}
                      {alert.isRead && (
                        <Check className="h-3.5 w-3.5 text-kick" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted truncate">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-muted/70">
                      {formatRelative(alert.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
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

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-kick" />
          <h2 className="text-base font-semibold text-white">Periyodik Raporlar</h2>
        </div>
        {reportsLoading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Henüz rapor bulunmuyor.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-kick/10 px-2 py-0.5 text-xs font-medium text-kick">
                    {periodLabels[report.period]}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatDate(report.startDate)} — {formatDate(report.endDate)}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {report.summaryData.totalBotsDetected}
                    </p>
                    <p className="text-[10px] text-muted">Bot</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {report.summaryData.totalAlerts}
                    </p>
                    <p className="text-[10px] text-muted">Alarm</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-kick">
                      {report.summaryData.averageRiskScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted">Risk</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
