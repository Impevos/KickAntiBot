import type { AlertSeverity, SuspiciousUserStatus } from '../types/api';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

const severityStyles: Record<AlertSeverity, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const severityLabels: Record<AlertSeverity, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  CRITICAL: 'Kritik',
};

export function getSeverityStyle(severity: AlertSeverity) {
  return severityStyles[severity];
}

export function getSeverityLabel(severity: AlertSeverity) {
  return severityLabels[severity];
}

const statusStyles: Record<SuspiciousUserStatus, string> = {
  DETECTED: 'bg-red-500/15 text-red-400',
  INVESTIGATING: 'bg-amber-500/15 text-amber-400',
  SAFE: 'bg-emerald-500/15 text-emerald-400',
  BANNED: 'bg-zinc-500/15 text-zinc-400',
};

const statusLabels: Record<SuspiciousUserStatus, string> = {
  DETECTED: 'Tespit Edildi',
  INVESTIGATING: 'İnceleniyor',
  SAFE: 'Güvenli',
  BANNED: 'Engellendi',
};

export function getStatusStyle(status: SuspiciousUserStatus) {
  return statusStyles[status];
}

export function getStatusLabel(status: SuspiciousUserStatus) {
  return statusLabels[status];
}

export function detectProtectionLevel(settings: {
  riskScoreThreshold: number;
  maxMessagesPerMinute: number;
  autoBlockEnabled: boolean;
  autoBanEnabled: boolean;
}): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (settings.autoBanEnabled && settings.riskScoreThreshold <= 55) {
    return 'HIGH';
  }
  if (settings.autoBlockEnabled && settings.riskScoreThreshold <= 70) {
    return 'MEDIUM';
  }
  return 'LOW';
}
