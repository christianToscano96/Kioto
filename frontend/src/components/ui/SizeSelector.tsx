import type { Product } from '@shared/index';
import { getSizeStock } from '@shared/index';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  product: Pick<Product, 'inventoryMode' | 'sizeVariants'>;
}

function getSelectedSizeMeta(stock: number, size: string): string {
  if (stock === 0) return `Talla ${size} · Agotada`;
  if (stock <= 5) return `Talla ${size} · Quedan ${stock}`;
  return `Talla ${size}`;
}

export function SizeSelector({ sizes, selectedSize, onSelectSize, product }: SizeSelectorProps) {
  const getSizeStockValue = (size: string) => getSizeStock(product, size);
  const selectedStock = selectedSize ? getSizeStockValue(selectedSize) : null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">
          Talla
        </span>
        {selectedSize && selectedStock !== null ? (
          <span className="truncate text-xs text-on-surface-variant">
            {getSelectedSizeMeta(selectedStock, selectedSize)}
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant/70">Elegí una</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {sizes.map((size) => {
          const stock = getSizeStockValue(size);
          const isOutOfStock = stock === 0;

          return (
            <button
              key={size}
              type="button"
              onClick={() => !isOutOfStock && onSelectSize(size)}
              disabled={isOutOfStock}
              aria-pressed={selectedSize === size}
              className={`relative border px-4 py-2 transition-all ${
                selectedSize === size
                  ? 'border-primary bg-primary-container text-on-primary-container'
                  : isOutOfStock
                    ? 'cursor-not-allowed border-outline-variant/30 text-on-surface-variant/50 opacity-50'
                    : 'border-outline-variant hover:border-primary'
              }`}
              title={
                isOutOfStock
                  ? `Talla ${size} · Agotada`
                  : `Talla ${size} · ${stock} en stock`
              }
            >
              <span className="font-serif text-sm">{size}</span>
              {stock > 0 && stock <= 3 && (
                <span
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-terracota-500"
                  aria-hidden="true"
                />
              )}
              {stock === 0 && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-error">Agotado</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
