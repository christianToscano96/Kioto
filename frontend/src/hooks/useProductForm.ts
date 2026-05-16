import { useState, useEffect } from 'react';
import type { Product } from '@shared/index';

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const FOOTWEAR_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

export type SizeType = 'tops' | 'bottoms' | 'footwear' | 'custom';

const SIZE_PRESETS: Record<SizeType, string[]> = {
  tops: PRESET_SIZES,
  bottoms: BOTTOM_SIZES,
  footwear: FOOTWEAR_SIZES,
  custom: [],
};

interface ColorStockEntry {
  name: string;
  stock: number;
}

interface SizeVariantEntry {
  colorStock: ColorStockEntry[];
  totalStock: number;
}

interface ProductFormData {
  name: string;
  price: string;
  images: string[];
  description: string;
  stock: string;
  published: boolean;
  materials: string;
  hasSizes: boolean;
  sizeType: SizeType;
  sizeStock: Record<string, SizeVariantEntry>;
  sizes: string[];
  colors: string[];
  category: string;
}

interface UseProductFormProps {
  product?: Product | null;
  isEdit: boolean;
}

export function useProductForm({ product, isEdit }: UseProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    images: [],
    description: '',
    stock: '',
    published: false,
    materials: '',
    hasSizes: false,
    sizeType: 'tops',
    sizeStock: {},
    sizes: [],
    colors: [],
    category: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && product) {
      const hasSizes = product.variants && product.variants.length > 0;
      let sizeStock: Record<string, SizeVariantEntry> = {};

      if (hasSizes && product.variants) {
        product.variants.forEach((v: any) => {
          const colorStock = v.colorStock || [];
          const totalStock = colorStock.reduce((sum: number, c: any) => sum + (c.stock || 0), 0);
          sizeStock[v.size] = { colorStock, totalStock };
        });
      }

      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        images: product.images || [],
        description: product.description || '',
        stock: product.stock?.toString() || '',
        published: product.published || false,
        materials: product.materials || '',
        hasSizes: hasSizes || false,
        sizeType: 'tops',
        sizeStock,
        sizes: product.sizes || [],
        colors: product.colors || [],
        category: typeof product.category === 'object' ? product.category?._id : product.category || '',
      });
    }
  }, [isEdit, product]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Se requiere un precio válido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.hasSizes && (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) {
      newErrors.stock = 'Se requiere una cantidad válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const removeColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  // — Variant helpers —
  const toggleSizeVariant = (size: string) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (next.sizeStock[size]) {
        // desactivar
        const { [size]: _, ...rest } = next.sizeStock;
        next.sizeStock = rest;
      } else {
        // activar con colorStock vacío
        next.sizeStock = { ...next.sizeStock, [size]: { colorStock: [], totalStock: 0 } };
      }
      return next;
    });
  };

  const addColorToVariant = (size: string, colorName: string) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      if (variant.colorStock.some((c) => c.name === colorName)) return prev;
      const colorStock = [...variant.colorStock, { name: colorName, stock: 0 }];
      const totalStock = colorStock.reduce((sum, c) => sum + c.stock, 0);
      return {
        ...prev,
        sizeStock: { ...prev.sizeStock, [size]: { colorStock, totalStock } },
      };
    });
  };

  const removeColorFromVariant = (size: string, colorName: string) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      const colorStock = variant.colorStock.filter((c) => c.name !== colorName);
      const totalStock = colorStock.reduce((sum, c) => sum + c.stock, 0);
      return {
        ...prev,
        sizeStock: { ...prev.sizeStock, [size]: { colorStock, totalStock } },
      };
    });
  };

  const updateColorStock = (size: string, colorName: string, stock: number) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      const colorStock = variant.colorStock.map((c) =>
        c.name === colorName ? { ...c, stock } : c
      );
      const totalStock = colorStock.reduce((sum, c) => sum + c.stock, 0);
      return {
        ...prev,
        sizeStock: { ...prev.sizeStock, [size]: { colorStock, totalStock } },
      };
    });
  };

  const addImage = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const updateImage = (index: number, url: string) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = url;
      return { ...prev, images: newImages };
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const getSubmitData = () => {
    const base = {
      name: formData.name,
      price: Number(formData.price),
      images: formData.images.filter(Boolean),
      description: formData.description,
      stock: formData.hasSizes ? 0 : Number(formData.stock),
      published: formData.published,
      materials: formData.materials,
      category: formData.category || undefined,
    } as Record<string, any>;

    if (formData.hasSizes) {
      base.variants = Object.entries(formData.sizeStock)
        .filter(([, data]) => data.colorStock.length > 0)
        .map(([size, data]) => ({
          size,
          colorStock: data.colorStock,
          stock: data.totalStock,
        }));
      // sizes y colors NO se envían — se manejan exclusivamente por variants
    } else {
      base.sizes = formData.sizes;
      base.colors = formData.colors;
    }

    return base;
  };

  return {
    formData,
    setFormData,
    errors,
    validate,
    toggleSize,
    removeColor,
    // variant helpers
    toggleSizeVariant,
    addColorToVariant,
    removeColorFromVariant,
    updateColorStock,
    // image helpers
    addImage,
    updateImage,
    removeImage,
    getSubmitData,
    SIZE_PRESETS,
  };
}
