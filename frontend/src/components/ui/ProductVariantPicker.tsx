import { useEffect, useMemo } from 'react';
import { Minus, Plus } from '@/components/icons';
import type { Product } from '@shared/index';
import { getInventoryMode, getSizeStock } from '@shared/index';
import {
  getActiveSizes,
  getMaxStock,
  getQuickAddError,
  type QuickAddSelection,
} from '@/lib/quickAddStock';
import {
  canAddToCart,
  getAddToCartCtaLabel,
  getColorOptions,
  getSelectionSummary,
} from '@/lib/variantSelection';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { SizeSelector } from '@/components/ui/SizeSelector';

export interface VariantSelectionState {
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

interface ProductVariantPickerProps {
  product: Product;
  selection: VariantSelectionState;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onQuantityChange: (quantity: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isSyncing?: boolean;
  layout?: 'compact' | 'detail';
  submitLabel?: string;
  showSubmit?: boolean;
  className?: string;
}

interface ProductAddToCartCtaProps {
  product: Product;
  selection: VariantSelectionState;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isSyncing?: boolean;
  short?: boolean;
  submitLabel?: string;
  className?: string;
}

export function ProductAddToCartCta({
  product,
  selection,
  onSubmit,
  isSubmitting = false,
  isSyncing = false,
  short = false,
  submitLabel,
  className = '',
}: ProductAddToCartCtaProps) {
  const quickAddSelection: QuickAddSelection = {
    selectedSize: selection.selectedSize,
    selectedColor: selection.selectedColor,
    quantity: selection.quantity,
  };

  const ctaLabel =
    submitLabel ??
    getAddToCartCtaLabel(product, quickAddSelection, {
      isSubmitting,
      isSyncing,
      short,
    });

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={!canAddToCart(product, quickAddSelection) || isSubmitting || isSyncing}
      className={className}
    >
      {ctaLabel}
    </button>
  );
}

export function ProductVariantPicker({
  product,
  selection,
  onSizeChange,
  onColorChange,
  onQuantityChange,
  onSubmit,
  isSubmitting = false,
  isSyncing = false,
  layout = 'compact',
  submitLabel,
  showSubmit = true,
  className = '',
}: ProductVariantPickerProps) {
  const inventoryMode = getInventoryMode(product);
  const activeSizes = useMemo(() => getActiveSizes(product), [product]);
  const colorOptions = useMemo(
    () => getColorOptions(product, selection.selectedSize || undefined),
    [product, selection.selectedSize],
  );

  const quickAddSelection: QuickAddSelection = {
    selectedSize: selection.selectedSize,
    selectedColor: selection.selectedColor,
    quantity: selection.quantity,
  };

  const maxStock = useMemo(
    () => getMaxStock(product, quickAddSelection),
    [product, quickAddSelection],
  );

  const summary = getSelectionSummary(product, quickAddSelection);
  const ctaLabel =
    submitLabel ??
    getAddToCartCtaLabel(product, quickAddSelection, {
      isSubmitting,
      isSyncing,
      short: layout === 'compact',
    });

  const showSizeSelector = inventoryMode === 'size_color';
  const showColorSelector =
    inventoryMode === 'color' ||
    (inventoryMode === 'size_color' && !!selection.selectedSize && colorOptions.length > 0);

  const quantityDisabled = maxStock === 0;

  useEffect(() => {
    if (inventoryMode !== 'size_color') return;
    if (selection.selectedSize || activeSizes.length !== 1) return;
    onSizeChange(activeSizes[0]);
  }, [inventoryMode, selection.selectedSize, activeSizes, onSizeChange]);

  useEffect(() => {
    if (!showColorSelector || selection.selectedColor || colorOptions.length !== 1) return;
    if (colorOptions[0].stock === 0) return;
    onColorChange(colorOptions[0].color);
  }, [showColorSelector, selection.selectedColor, colorOptions, onColorChange]);

  const handleSizeChange = (size: string) => {
    onSizeChange(size);
    onColorChange('');
    onQuantityChange(1);
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
    onQuantityChange(1);
  };

  const renderCompactSizeSelector = () => (
    <div>
      <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
        Talla
      </p>
      <div className="flex flex-wrap gap-1.5">
        {activeSizes.map((size) => {
          const sizeStock = getSizeStock(product, size);
          const isOut = sizeStock === 0;
          const isActive = selection.selectedSize === size;

          return (
            <button
              key={size}
              type="button"
              onClick={() => !isOut && handleSizeChange(size)}
              disabled={isOut}
              aria-pressed={isActive}
              className={`min-w-[40px] h-9 px-3 text-sm rounded-lg border transition-all font-medium ${
                isActive
                  ? 'bg-primary text-on-primary border-primary'
                  : isOut
                    ? 'border-outline-variant/30 text-on-surface-variant/40 opacity-50 cursor-not-allowed line-through'
                    : 'border-outline-variant active:scale-95'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {showSizeSelector &&
        (layout === 'detail' ? (
          <SizeSelector
            sizes={activeSizes}
            selectedSize={selection.selectedSize || null}
            onSelectSize={handleSizeChange}
            product={product}
          />
        ) : (
          renderCompactSizeSelector()
        ))}

      {showColorSelector && (
        <ColorSwatch
          options={colorOptions}
          selectedColor={selection.selectedColor || null}
          onSelectColor={handleColorChange}
          compact={layout === 'compact'}
          className={layout === 'detail' ? 'mt-0' : ''}
        />
      )}

      {layout === 'detail' && (
        <div>
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-label">
            Cantidad
          </span>
          <QuantitySelector
            quantity={selection.quantity}
            maxStock={maxStock || 1}
            onDecrement={() => onQuantityChange(Math.max(1, selection.quantity - 1))}
            onIncrement={() => onQuantityChange(Math.min(maxStock || 1, selection.quantity + 1))}
            disabled={quantityDisabled}
          />
        </div>
      )}

      {layout === 'detail' && maxStock > 0 && maxStock <= 5 && (
        <p className="text-sm text-verde-bosque-600 font-medium">
          ¡Últimas {maxStock} unidades disponibles!
        </p>
      )}

      {summary && (
        <p className="text-xs text-on-surface-variant bg-surface-container rounded-lg px-3 py-2">
          {summary}
        </p>
      )}

      {showSubmit && layout === 'compact' && (
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, selection.quantity - 1))}
              disabled={quantityDisabled || selection.quantity <= 1}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold w-6 text-center tabular-nums">{selection.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(maxStock || 1, selection.quantity + 1))}
              disabled={quantityDisabled || selection.quantity >= (maxStock || 1)}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canAddToCart(product, quickAddSelection) || isSubmitting || isSyncing}
            className="bg-primary text-on-primary font-label text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            {ctaLabel}
          </button>
        </div>
      )}

      {showSubmit && layout === 'detail' && (
        <ProductAddToCartCta
          product={product}
          selection={selection}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isSyncing={isSyncing}
          submitLabel={submitLabel}
          className="hidden lg:flex w-full bg-primary-container text-on-primary-container py-4 sm:py-5 rounded-lg font-bold uppercase tracking-widest font-label hover:bg-primary transition-all duration-300 shadow-md disabled:opacity-50 min-h-[44px] items-center justify-center"
        />
      )}

      {layout === 'detail' && getQuickAddError(product, quickAddSelection) === 'Sin stock disponible' && (
        <p className="text-sm text-error font-medium">Agotado - Próximamente disponible</p>
      )}
    </div>
  );
}
