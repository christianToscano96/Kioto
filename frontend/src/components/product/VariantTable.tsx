import { useState, useCallback } from 'react';
import { Trash2 } from '@/components/icons';

// ─── Presets ───
export const PRESET_SIZES = {
  tops:     ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottoms:  ['28', '30', '32', '34', '36', '38', '40', '42'],
  footwear: ['5', '6', '7', '8', '9', '10', '11', '12'],
  custom:   [] as string[],
} as const;

export const PRESET_COLORS = [
  '#000000', '#FFFFFF',  '#2e6b4f',
  '#6b7280', '#dc2626', '#2563eb', '#7c3aed', '#ca8a04',
  '#059669', '#db2777', '#f59e0b', '#10b981', '#8b5cf6', 
];

export type SizeType = keyof typeof PRESET_SIZES;

// ─── Shape ───
export interface VariantRow {
  colorStock: { name: string; stock: number }[];
  totalStock: number;
}

export type VariantState = Record<string, VariantRow>;

// ─── Helpers ───
export function computeTotalStock(rows: VariantState): number {
  return Object.values(rows).reduce((s, r) => s + r.totalStock, 0);
}

// ─── Hook ───
export function useVariantTable(initial?: { size: string; colorStock: { name: string; stock: number }[]; stock: number }[]) {
  const [rows, setRows] = useState<VariantState>(() => {
    if (!initial?.length) return {};
    return initial.reduce((acc, v) => {
      acc[v.size] = { colorStock: v.colorStock || [], totalStock: v.stock || 0 };
      return acc;
    }, {} as VariantState);
  });

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    new Set(initial?.map((v) => v.size) || [])
  );

  const toggle = useCallback((size: string) => {
    setExpanded((p) => { const n = new Set(p); n.has(size) ? n.delete(size) : n.add(size); return n; });
  }, []);

  const activate = useCallback((size: string) => {
    setRows((p) => { if (p[size]) return p; return { ...p, [size]: { colorStock: [], totalStock: 0 } }; });
    setExpanded((p) => { const n = new Set(p); n.add(size); return n; });
  }, []);

  const deactivate = useCallback((size: string) => {
    setRows((p) => { const { [size]: _, ...rest } = p; return rest; });
    setExpanded((p) => { const n = new Set(p); n.delete(size); return n; });
  }, []);

  const addColor = useCallback((size: string, hex: string) => {
    setRows((p) => {
      const row = p[size];
      if (!row || row.colorStock.some((c: any) => c.name === hex)) return p;
      const cs = [...row.colorStock, { name: hex, stock: 0 }];
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s: number, c: any) => s + c.stock, 0) } };
    });
  }, []);

  const removeColor = useCallback((size: string, hex: string) => {
    setRows((p) => {
      const row = p[size];
      if (!row) return p;
      const cs = row.colorStock.filter((c: any) => c.name !== hex);
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s: number, c: any) => s + c.stock, 0) } };
    });
  }, []);

  const setColorStock = useCallback((size: string, hex: string, stock: number) => {
    setRows((p) => {
      const row = p[size];
      if (!row) return p;
      const cs = row.colorStock.map((c: any) => (c.name === hex ? { ...c, stock } : c));
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s: number, c: any) => s + c.stock, 0) } };
    });
  }, []);

  const sizeList = Object.keys(rows);

  return {
    rows,
    expanded,
    hasVariants: sizeList.length > 0,
    totalStock: computeTotalStock(rows),
    sizes: sizeList,
    toggle,
    activate,
    deactivate,
    addColor,
    removeColor,
    setColorStock,
  };
}
