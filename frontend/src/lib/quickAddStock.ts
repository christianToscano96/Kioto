import type { ProductVariant } from "@shared/index";

export interface QuickAddSelection {
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export function getActiveVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.filter((variant) => (variant.colorStock || []).length > 0);
}

export function getColorStockMap(
  variants: ProductVariant[],
  size: string,
): Record<string, number> {
  const variant = variants.find((item) => item.size === size);
  if (!variant) return {};

  return (variant.colorStock || []).reduce<Record<string, number>>((acc, color) => {
    acc[color.name] = color.stock || 0;
    return acc;
  }, {});
}

export function getAvailableColors(
  variants: ProductVariant[],
  selectedSize: string,
): string[] {
  return selectedSize ? Object.keys(getColorStockMap(variants, selectedSize)) : [];
}

export function getMaxStock(
  variants: ProductVariant[],
  selection: Pick<QuickAddSelection, "selectedSize" | "selectedColor">,
): number {
  if (!selection.selectedSize) return 0;

  const colorStockMap = getColorStockMap(variants, selection.selectedSize);
  if (selection.selectedColor) return colorStockMap[selection.selectedColor] ?? 0;

  return Object.values(colorStockMap).reduce((total, stock) => total + stock, 0);
}

export function getQuickAddError(
  variants: ProductVariant[],
  selection: QuickAddSelection,
): string | null {
  const availableColors = getAvailableColors(variants, selection.selectedSize);
  const maxStock = getMaxStock(variants, selection);

  if (!selection.selectedSize) return "Seleccioná una talla";
  if (availableColors.length > 1 && !selection.selectedColor) return "Seleccioná un color";
  if (maxStock === 0) return "Sin stock disponible";
  if (selection.quantity > maxStock) return "Stock insuficiente";

  return null;
}
