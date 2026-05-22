import type { ColorStockLine, Product } from '@shared/index';
import { getInventoryMode } from '@shared/index';
import {
  getAvailableColors,
  getMaxStock,
  getQuickAddError,
  type QuickAddSelection,
} from '@/lib/quickAddStock';

export interface ColorOption {
  color: string;
  label: string;
  stock: number;
}

export function getColorOptions(product: Product, size?: string): ColorOption[] {
  const mode = getInventoryMode(product);

  const mapLines = (lines: ColorStockLine[]): ColorOption[] =>
    lines.map((line) => ({
      color: line.color,
      label: line.label?.trim() || line.color,
      stock: line.stock || 0,
    }));

  if (mode === 'color') {
    return mapLines(product.colors ?? []);
  }

  if (mode === 'size_color' && size) {
    const sizeVariant = product.sizeVariants?.find((item) => item.size === size);
    return mapLines(sizeVariant?.colors ?? []);
  }

  return [];
}

export function getColorLabel(product: Product, color: string, size?: string): string {
  return getColorOptions(product, size).find((option) => option.color === color)?.label ?? color;
}

export function getSelectionSummary(
  product: Product,
  selection: Pick<QuickAddSelection, 'selectedSize' | 'selectedColor' | 'quantity'>,
): string | null {
  const parts: string[] = [];

  if (selection.selectedSize) {
    parts.push(`Talla ${selection.selectedSize}`);
  }

  if (selection.selectedColor) {
    parts.push(getColorLabel(product, selection.selectedColor, selection.selectedSize || undefined));
  }

  if (selection.quantity > 1) {
    parts.push(`${selection.quantity} unidades`);
  }

  if (parts.length === 0) return null;

  const maxStock = getMaxStock(product, selection);
  if (maxStock > 0 && selection.quantity <= maxStock) {
    parts.push(`${maxStock} disponibles`);
  }

  return parts.join(' · ');
}

export function getAddToCartCtaLabel(
  product: Product,
  selection: QuickAddSelection,
  options?: { isSubmitting?: boolean; isSyncing?: boolean; short?: boolean },
): string {
  if (options?.isSubmitting || options?.isSyncing) {
    return 'Añadiendo...';
  }

  const error = getQuickAddError(product, selection);
  if (error === 'Seleccioná una talla') return 'Seleccioná una talla';
  if (error === 'Seleccioná un color') return 'Seleccioná un color';
  if (error === 'Sin stock disponible') return 'Agotado';
  if (error === 'Stock insuficiente') return 'Stock insuficiente';

  const total = product.price * selection.quantity;
  if (options?.short) {
    return `Agregar · $${total.toFixed(2)}`;
  }

  return `Agregar al carrito · $${total.toFixed(2)}`;
}

export function canAddToCart(product: Product, selection: QuickAddSelection): boolean {
  return getQuickAddError(product, selection) === null;
}

export function getResolvedSelection(
  product: Product,
  selection: QuickAddSelection,
): { size?: string; color?: string } {
  const availableColors = getAvailableColors(product, selection.selectedSize || undefined);
  const color =
    selection.selectedColor || (availableColors.length === 1 ? availableColors[0] : undefined);

  return {
    size: selection.selectedSize || undefined,
    color,
  };
}

export const ADD_TO_CART_FAILURE_MESSAGE = 'No se pudo agregar al carrito';

export function getAddToCartSuccessToast(
  product: Product,
  selection: QuickAddSelection,
): { title: string; message?: string } {
  const summary = getSelectionSummary(product, selection);

  return {
    title: '¡Agregado al carrito!',
    message: summary ? `${product.name} · ${summary}` : product.name,
  };
}
