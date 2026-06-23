import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, padding = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-surface-elevated',
        padding && 'p-5',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: 'green' | 'red' | 'amber' | 'blue';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'green',
}: StatCardProps) {
  const accents = {
    green: 'text-kick',
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted">{title}</p>
          <p className={cn('text-3xl font-bold tracking-tight', accents[accent])}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-surface-hover p-2.5 text-muted">{icon}</div>
        )}
      </div>
    </Card>
  );
}
