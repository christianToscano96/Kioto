import { Filter, Search, X } from '@/components/icons';
import { SortDropdown, type SortOption } from '@/components/ui/SortDropdown';
import { ViewToggle } from '@/components/ui/ViewToggle';

interface ProductsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  resultCount: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

export function ProductsFilterToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  activeFilterCount,
  onOpenFilters,
}: ProductsFilterToolbarProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-on-surface md:text-4xl">Catálogo</h1>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            {resultCount} producto{resultCount !== 1 ? 's' : ''}
          </p>
        </div>
        <ViewToggle view={view} onChange={onViewChange} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="h-11 w-full rounded-xl border border-outline-variant/35 bg-background pl-10 pr-10 font-body text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            aria-label="Buscar productos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-outline-variant/35 bg-background px-4 font-label text-[11px] uppercase tracking-wide text-on-surface transition-colors hover:border-primary/40 lg:hidden"
        >
          <Filter size={18} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
              {activeFilterCount}
            </span>
          )}
        </button>

        <SortDropdown value={sortBy} onChange={onSortChange} />
      </div>
    </div>
  );
}
