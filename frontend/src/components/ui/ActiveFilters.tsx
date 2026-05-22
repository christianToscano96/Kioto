import { X } from '@/components/icons';

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
          Filtros
        </span>

        {filters.map((filter) => (
          <span
            key={filter.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-background py-1 pl-3 pr-1.5 text-xs text-on-surface"
          >
            <span className="font-label uppercase tracking-wide text-on-surface-variant">
              {filter.label}
            </span>
            <span className="max-w-[120px] truncate font-body">{filter.value}</span>
            <button
              type="button"
              onClick={() => onRemove(filter.id)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              aria-label={`Quitar filtro ${filter.label}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto font-label text-[10px] uppercase tracking-widest text-primary hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>
    </div>
  );
}
