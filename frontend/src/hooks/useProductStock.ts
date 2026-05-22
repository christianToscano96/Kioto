import type { Product } from '@shared/index';
import {
  getAvailableColors,
  getAvailableSizes,
  getColorStockMap,
  getInventoryMode,
  getSizeStock,
  getTotalStock,
  resolveInventory,
} from '@shared/index';

interface StockInfo {
  inventoryMode: ReturnType<typeof getInventoryMode>;
  totalStock: number;
  sizes: string[];
  getSizeStock: (size?: string) => number;
  getColorStockMap: (size?: string) => Record<string, number>;
  getAvailableColors: (size?: string) => string[];
  resolveSelection: (selection: { size?: string; color?: string }) => ReturnType<typeof resolveInventory>;
}

export function useProductStock(product: Product | null | undefined): StockInfo {
  const inventoryMode = getInventoryMode(product ?? {});
  const totalStock = getTotalStock(product ?? {});
  const sizes = getAvailableSizes(product ?? {});

  return {
    inventoryMode,
    totalStock,
    sizes,
    getSizeStock: (size?: string) => (size ? getSizeStock(product ?? {}, size) : 0),
    getColorStockMap: (size?: string) => getColorStockMap(product ?? {}, size),
    getAvailableColors: (size?: string) => getAvailableColors(product ?? {}, size),
    resolveSelection: (selection) => resolveInventory(product ?? {}, selection),
  };
}
