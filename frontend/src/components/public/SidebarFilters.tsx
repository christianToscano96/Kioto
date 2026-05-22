import { ChevronDown } from '@/components/icons';
import { useState } from 'react';
import { PriceRangeFilter } from '@/components/ui/PriceRangeFilter';

interface SidebarFiltersProps {
  categories?: Array<{ name: string; count: number; active?: boolean }>;
  colors?: string[];
  sizes?: string[];
  selectedSize?: string | null;
  selectedColor?: string | null;
  onSizeChange?: (size: string | null) => void;
  onColorChange?: (color: string | null) => void;
  onCategoryClick?: (categoryName: string) => void;
  priceRange?: {
    minPrice: number;
    maxPrice: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
  };
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onClear?: () => void;
  showClear?: boolean;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
  onClear,
  showClear,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-outline-variant/20 pb-6 last:border-b-0 last:pb-0">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex flex-1 items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <h3 className="font-serif text-lg text-on-surface italic">{title}</h3>
          <ChevronDown
            size={18}
            className={`shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {showClear && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="font-label text-[10px] uppercase tracking-widest text-primary hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>
      {open && children}
    </section>
  );
}

export function SidebarFilters({
  categories = [],
  colors = [],
  sizes = ['XS', 'S', 'M', 'L', 'XL'],
  selectedSize = null,
  selectedColor = null,
  onSizeChange,
  onColorChange,
  onCategoryClick,
  priceRange,
}: SidebarFiltersProps) {
  return (
    <aside className="w-full lg:w-56 xl:w-60 shrink-0">
      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low/40 p-5 lg:sticky lg:top-28">
        <p className="mb-5 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
          Refinar búsqueda
        </p>

        <div className="space-y-6">
          {categories.length > 0 && (
            <FilterSection
              title="Categoría"
              showClear={!!categories.some((c) => c.active)}
              onClear={() => {
                const activeCategory = categories.find((category) => category.active);
                if (activeCategory) onCategoryClick?.(activeCategory.name);
              }}
            >
              <ul className="space-y-1">
                {categories.map((category) => {
                  const isActive = category.active;
                  const isEmpty = category.count === 0;

                  return (
                    <li key={category.name}>
                      <button
                        type="button"
                        disabled={isEmpty}
                        onClick={() => onCategoryClick?.(category.name)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container'
                            : isEmpty
                              ? 'cursor-not-allowed text-on-surface-variant/40'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`}
                      >
                        <span className="font-label text-xs uppercase tracking-wide">
                          {category.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                            isActive ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {category.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </FilterSection>
          )}

          {colors.length > 0 && (
            <FilterSection
              title="Color"
              showClear={!!selectedColor}
              onClear={() => onColorChange?.(null)}
            >
              <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8 lg:grid-cols-5">
                {colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onColorChange?.(isSelected ? null : color)}
                      className={`relative aspect-square rounded-full border transition-all ${
                        isSelected
                          ? 'scale-110 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'border-outline-variant/30 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                      aria-pressed={isSelected}
                      title={color}
                    />
                  );
                })}
              </div>
            </FilterSection>
          )}

          <FilterSection
            title="Talla"
            showClear={!!selectedSize}
            onClear={() => onSizeChange?.(null)}
          >
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onSizeChange?.(isSelected ? null : size)}
                    className={`min-h-[40px] min-w-[40px] rounded-md border px-3 py-2 font-label text-xs uppercase tracking-wide transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {priceRange && (
            <PriceRangeFilter
              minPrice={priceRange.minPrice}
              maxPrice={priceRange.maxPrice}
              value={priceRange.value}
              onChange={priceRange.onChange}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
