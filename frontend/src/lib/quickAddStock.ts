import type { Product } from '@shared/index';
import {
  getAvailableColors,
  getColorStockMap,
  getInventoryMode,
  resolveInventory,
} from '@shared/index';

export interface QuickAddSelection {
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export function getAvailableSizes(product: Pick<Product, 'inventoryMode' | 'sizeVariants'>): string[] {
  if (getInventoryMode(product) !== 'size_color') return [];
  return (product.sizeVariants ?? []).map((variant) => variant.size);
}

export function getActiveSizes(product: Pick<Product, 'inventoryMode' | 'sizeVariants'>): string[] {
  return getAvailableSizes(product).filter((size) => {
    const colors = getAvailableColors(product, size);
    return colors.length > 0;
  });
}

export function getMaxStock(
  product: Pick<Product, 'inventoryMode' | 'stock' | 'colors' | 'sizeVariants'>,
  selection: Pick<QuickAddSelection, 'selectedSize' | 'selectedColor'>,
): number {
  try {
    return resolveInventory(product, {
      size: selection.selectedSize || undefined,
      color: selection.selectedColor || undefined,
    }).availableStock;
  } catch {
    return 0;
  }
}

export function getQuickAddError(
  product: Pick<Product, 'inventoryMode' | 'stock' | 'colors' | 'sizeVariants'>,
  selection: QuickAddSelection,
): string | null {
  const mode = getInventoryMode(product);

  if (mode === 'size_color' && !selection.selectedSize) {
    return 'Seleccioná una talla';
  }

  const availableColors = getAvailableColors(product, selection.selectedSize || undefined);
  if ((mode === 'color' || mode === 'size_color') && availableColors.length > 1 && !selection.selectedColor) {
    return 'Seleccioná un color';
  }

  const maxStock = getMaxStock(product, selection);
  if (maxStock === 0) return 'Sin stock disponible';
  if (selection.quantity > maxStock) return 'Stock insuficiente';

  return null;
}

export { getAvailableColors, getColorStockMap };
