export type InventoryMode = 'unit' | 'color' | 'size_color';

export interface ColorStockLine {
  color: string;
  label?: string;
  stock: number;
}

export interface SizeVariant {
  size: string;
  colors: ColorStockLine[];
}

export interface InventorySelection {
  size?: string;
  color?: string;
}

export interface ResolvedInventory {
  inventoryMode: InventoryMode;
  availableStock: number;
  resolvedSize?: string;
  resolvedColor?: string;
  requiresSize: boolean;
  requiresColor: boolean;
}

export interface ProductInventoryFields {
  inventoryMode?: InventoryMode;
  stock?: number;
  colors?: ColorStockLine[];
  sizeVariants?: SizeVariant[];
}

const normalizeOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function getInventoryMode(product: ProductInventoryFields): InventoryMode {
  return product.inventoryMode ?? 'unit';
}

export function getTotalStock(product: ProductInventoryFields): number {
  const mode = getInventoryMode(product);

  if (mode === 'unit') {
    return product.stock ?? 0;
  }

  if (mode === 'color') {
    return (product.colors ?? []).reduce((sum, line) => sum + (line.stock || 0), 0);
  }

  return (product.sizeVariants ?? []).reduce(
    (sum, sizeVariant) =>
      sum + (sizeVariant.colors ?? []).reduce((colorSum, line) => colorSum + (line.stock || 0), 0),
    0,
  );
}

export function getSizeStock(product: ProductInventoryFields, size: string): number {
  const sizeVariant = (product.sizeVariants ?? []).find((item) => item.size === size);
  if (!sizeVariant) return 0;

  return (sizeVariant.colors ?? []).reduce((sum, line) => sum + (line.stock || 0), 0);
}

export function getAvailableSizes(product: ProductInventoryFields): string[] {
  if (getInventoryMode(product) !== 'size_color') return [];
  return (product.sizeVariants ?? []).map((item) => item.size);
}

export function getAvailableColors(
  product: ProductInventoryFields,
  size?: string,
): string[] {
  const mode = getInventoryMode(product);

  if (mode === 'color') {
    return (product.colors ?? []).map((line) => line.color);
  }

  if (mode === 'size_color' && size) {
    const sizeVariant = (product.sizeVariants ?? []).find((item) => item.size === size);
    return (sizeVariant?.colors ?? []).map((line) => line.color);
  }

  return [];
}

export function getColorStockMap(
  product: ProductInventoryFields,
  size?: string,
): Record<string, number> {
  const mode = getInventoryMode(product);

  if (mode === 'color') {
    return (product.colors ?? []).reduce<Record<string, number>>((acc, line) => {
      acc[line.color] = line.stock || 0;
      return acc;
    }, {});
  }

  if (mode === 'size_color' && size) {
    const sizeVariant = (product.sizeVariants ?? []).find((item) => item.size === size);
    return (sizeVariant?.colors ?? []).reduce<Record<string, number>>((acc, line) => {
      acc[line.color] = line.stock || 0;
      return acc;
    }, {});
  }

  return {};
}

export function productHasSize(product: ProductInventoryFields, size: string): boolean {
  return getAvailableSizes(product).includes(size);
}

export function productHasColor(product: ProductInventoryFields, color: string): boolean {
  const mode = getInventoryMode(product);

  if (mode === 'color') {
    return getAvailableColors(product).includes(color);
  }

  if (mode === 'size_color') {
    return (product.sizeVariants ?? []).some((sizeVariant) =>
      (sizeVariant.colors ?? []).some((line) => line.color === color),
    );
  }

  return false;
}

export function resolveInventory(
  product: ProductInventoryFields,
  selection: InventorySelection = {},
): ResolvedInventory {
  const mode = getInventoryMode(product);
  const size = normalizeOptional(selection.size);
  const color = normalizeOptional(selection.color);

  if (mode === 'unit') {
    return {
      inventoryMode: mode,
      availableStock: product.stock ?? 0,
      resolvedSize: size,
      resolvedColor: color,
      requiresSize: false,
      requiresColor: false,
    };
  }

  if (mode === 'color') {
    const colorLines = product.colors ?? [];
    const resolvedColor = color || (colorLines.length === 1 ? colorLines[0].color : undefined);

    if (!resolvedColor) {
      throw new Error('Color is required for this product');
    }

    const colorLine = colorLines.find((line) => line.color === resolvedColor);
    if (!colorLine) {
      throw new Error(`Color ${resolvedColor} not available for this product`);
    }

    return {
      inventoryMode: mode,
      availableStock: colorLine.stock || 0,
      resolvedColor,
      requiresSize: false,
      requiresColor: colorLines.length > 1,
    };
  }

  if (!size) {
    throw new Error('Size is required for this product');
  }

  const sizeVariant = (product.sizeVariants ?? []).find((item) => item.size === size);
  if (!sizeVariant) {
    throw new Error(`Size ${size} not available for this product`);
  }

  const colorLines = sizeVariant.colors ?? [];
  const resolvedColor = color || (colorLines.length === 1 ? colorLines[0].color : undefined);

  if (!resolvedColor) {
    throw new Error('Color is required for this product');
  }

  const colorLine = colorLines.find((line) => line.color === resolvedColor);
  if (!colorLine) {
    throw new Error(`Color ${resolvedColor} not available for size ${size}`);
  }

  return {
    inventoryMode: mode,
    availableStock: colorLine.stock || 0,
    resolvedSize: size,
    resolvedColor,
    requiresSize: true,
    requiresColor: colorLines.length > 1,
  };
}
