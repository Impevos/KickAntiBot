import { cn, getSeverityLabel, getSeverityStyle } from '../../lib/utils';
import type { AlertSeverity } from '../../types/api';

interface BadgeProps {
  severity?: AlertSeverity;
  label?: string;
  className?: string;
}

export function SeverityBadge({ severity, label, className }: BadgeProps) {
  if (!severity) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        getSeverityStyle(severity),
        className,
      )}
    >
      {label || getSeverityLabel(severity)}
    </span>
  );
}

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {label}
    </span>
  );
}
