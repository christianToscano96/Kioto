import { ReactNode } from 'react';
import type { OrderStatus } from '@shared/index';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from '@/lib/orderStatus';

interface Column<T> {
  key?: keyof T;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => ReactNode;
}

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = ORDER_STATUS_LABELS[status] ?? status;
  const style = ORDER_STATUS_STYLES[status] ?? 'bg-surface-container text-on-surface';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  actions,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dashed border-outline-variant/40">
            {columns.map((column, colIndex) => (
              <th
                key={column.key ? String(column.key) : `col-${colIndex}`}
                className="py-4 text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant"
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="py-4 text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-dashed border-outline-variant/20 hover:bg-surface-container/50 transition-colors"
            >
              {columns.map((column, colIndex) => {
                const value = column.key ? row[column.key] : undefined;
                return (
                  <td key={column.key ? String(column.key) : `cell-${colIndex}`} className="py-4 px-2">
                    {column.render ? column.render(value, row) : String(value ?? '')}
                  </td>
                );
              })}
              {actions && <td className="py-4 px-2">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
