import type { OrderStatus } from '@shared/index';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/utils';

export const CHART_PRIMARY = '#99452c';
export const CHART_SECONDARY = '#2e6b4f';
export const CHART_ACCENT = '#c27e41';
export const CHART_MUTED = '#9ca3af';
export const CHART_GRID = 'rgba(0, 0, 0, 0.06)';

export const ORDER_STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  pending: '#c27e41',
  paid: '#2e6b4f',
  failed: '#dc2626',
  processing: '#99452c',
  shipped: '#6b7280',
  delivered: '#059669',
  cancelled: '#991b1b',
};

export function formatChartShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function getStatusChartColor(status: string): string {
  if (status in ORDER_STATUS_CHART_COLORS) {
    return ORDER_STATUS_CHART_COLORS[status as OrderStatus];
  }
  return CHART_MUTED;
}

export function getStatusChartLabel(status: string): string {
  if (status in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[status as OrderStatus];
  }
  return status;
}

export interface ChartTooltipPayload {
  color?: string;
  name?: string;
  value?: number;
  dataKey?: string;
}

interface DashboardChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayload[];
  valueFormatter?: (value: number, key?: string) => string;
}

export function DashboardChartTooltip({
  active,
  label,
  payload,
  valueFormatter,
}: DashboardChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const value = Number(entry.value ?? 0);
          const formatted = valueFormatter
            ? valueFormatter(value, entry.dataKey)
            : String(value);

          return (
            <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center gap-2 text-sm">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? CHART_PRIMARY }}
              />
              <span className="text-on-surface-variant">{entry.name ?? entry.dataKey}</span>
              <span className="ml-auto font-semibold text-on-surface">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function formatSalesTooltipValue(value: number): string {
  return formatPrice(value);
}

export function formatCountTooltipValue(value: number): string {
  return `${value} ${value === 1 ? 'pedido' : 'pedidos'}`;
}
