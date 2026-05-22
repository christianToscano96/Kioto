import { formatPrice } from '@/lib/utils';

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  compact?: boolean;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  value,
  onChange,
  compact = false,
}: PriceRangeFilterProps) {
  const [min, max] = value;
  const rangeSpan = Math.max(maxPrice - minPrice, 1);

  const handleMinSlider = (nextMin: number) => {
    onChange([Math.min(nextMin, max - 1), max]);
  };

  const handleMaxSlider = (nextMax: number) => {
    onChange([min, Math.max(nextMax, min + 1)]);
  };

  return (
    <div className={compact ? '' : 'border-t border-outline-variant/20 pt-6'}>
      {!compact && (
        <h3 className="mb-4 font-serif text-lg text-on-surface italic">Precio</h3>
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 font-body text-sm">
          <span className="rounded-md bg-surface-container px-2.5 py-1 text-on-surface tabular-nums">
            {formatPrice(min)}
          </span>
          <span className="text-on-surface-variant/50">—</span>
          <span className="rounded-md bg-surface-container px-2.5 py-1 text-on-surface tabular-nums">
            {formatPrice(max)}
          </span>
        </div>

        <div className="relative h-6">
          <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-outline-variant/25" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/70"
            style={{
              left: `${((min - minPrice) / rangeSpan) * 100}%`,
              right: `${100 - ((max - minPrice) / rangeSpan) * 100}%`,
            }}
          />
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={min}
            onChange={(e) => handleMinSlider(Number(e.target.value))}
            className="pointer-events-none absolute inset-0 z-20 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary"
            aria-label="Precio mínimo"
          />
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={max}
            onChange={(e) => handleMaxSlider(Number(e.target.value))}
            className="pointer-events-none absolute inset-0 z-10 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary"
            aria-label="Precio máximo"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Mínimo
            </span>
            <input
              type="number"
              min={minPrice}
              max={maxPrice}
              value={min}
              onChange={(e) => handleMinSlider(Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant/40 bg-background px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Máximo
            </span>
            <input
              type="number"
              min={minPrice}
              max={maxPrice}
              value={max}
              onChange={(e) => handleMaxSlider(Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant/40 bg-background px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
