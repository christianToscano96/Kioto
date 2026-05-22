import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  heightClassName?: string;
}

export function DashboardChartCard({
  title,
  subtitle,
  children,
  action,
  className,
  contentClassName,
  heightClassName = 'h-72',
}: DashboardChartCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-outline-variant/30 bg-surface-container-low p-5 md:p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-on-surface md:text-xl">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-on-surface-variant md:text-sm">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className={cn(heightClassName, contentClassName)}>{children}</div>
    </section>
  );
}

interface DashboardChartEmptyProps {
  message?: string;
}

export function DashboardChartEmpty({
  message = 'Sin datos en este período',
}: DashboardChartEmptyProps) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/30 bg-surface/50 px-6 text-center">
      <p className="text-sm text-on-surface-variant">{message}</p>
    </div>
  );
}
