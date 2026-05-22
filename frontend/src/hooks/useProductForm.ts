import { useState, useEffect } from 'react';
import type { ColorStockLine, InventoryMode, Product } from '@shared/index';

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

interface SizeVariantEntry {
  colors: ColorStockLine[];
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
  inventoryMode: InventoryMode;
  sizeType: SizeType;
  sizeStock: Record<string, SizeVariantEntry>;
  productColors: ColorStockLine[];
  customSizes: string[];
  category: string;
}

interface UseProductFormProps {
  product?: Product | null;
  isEdit: boolean;
}

const sumColorStock = (colors: ColorStockLine[]) =>
  colors.reduce((sum, line) => sum + (line.stock || 0), 0);

export function useProductForm({ product, isEdit }: UseProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    images: [],
    description: '',
    stock: '',
    published: false,
    materials: '',
    inventoryMode: 'unit',
    sizeType: 'tops',
    sizeStock: {},
    productColors: [],
    customSizes: [],
    category: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && product) {
      let sizeStock: Record<string, SizeVariantEntry> = {};
      let productColors: ColorStockLine[] = [];

      if (product.inventoryMode === 'size_color' && product.sizeVariants) {
        product.sizeVariants.forEach((variant) => {
          const colors = variant.colors || [];
          sizeStock[variant.size] = {
            colors,
            totalStock: sumColorStock(colors),
          };
        });
      }

      if (product.inventoryMode === 'color' && product.colors) {
        productColors = product.colors;
      }

      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        images: product.images || [],
        description: product.description || '',
        stock: product.inventoryMode === 'unit' ? product.stock?.toString() || '' : '',
        published: product.published || false,
        materials: product.materials || '',
        inventoryMode: product.inventoryMode || 'unit',
        sizeType: 'tops',
        sizeStock,
        productColors,
        customSizes: [],
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

    if (formData.inventoryMode === 'unit') {
      if (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
        newErrors.stock = 'Se requiere una cantidad válida';
      }
    }

    if (formData.inventoryMode === 'color' && formData.productColors.length === 0) {
      newErrors.inventory = 'Agregá al menos un color con stock';
    }

    if (formData.inventoryMode === 'size_color') {
      const activeSizes = Object.values(formData.sizeStock).filter((entry) => entry.colors.length > 0);
      if (activeSizes.length === 0) {
        newErrors.inventory = 'Agregá al menos una talla con colores y stock';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleSizeVariant = (size: string) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (next.sizeStock[size]) {
        const { [size]: _, ...rest } = next.sizeStock;
        next.sizeStock = rest;
      } else {
        next.sizeStock = { ...next.sizeStock, [size]: { colors: [], totalStock: 0 } };
      }
      return next;
    });
  };

  const addColorToVariant = (size: string, color: string) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      if (variant.colors.some((line) => line.color === color)) return prev;
      const colors = [...variant.colors, { color, stock: 0 }];
      return {
        ...prev,
        sizeStock: {
          ...prev.sizeStock,
          [size]: { colors, totalStock: sumColorStock(colors) },
        },
      };
    });
  };

  const removeColorFromVariant = (size: string, color: string) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      const colors = variant.colors.filter((line) => line.color !== color);
      return {
        ...prev,
        sizeStock: {
          ...prev.sizeStock,
          [size]: { colors, totalStock: sumColorStock(colors) },
        },
      };
    });
  };

  const updateVariantColorStock = (size: string, color: string, stock: number) => {
    setFormData((prev) => {
      const variant = prev.sizeStock[size];
      if (!variant) return prev;
      const colors = variant.colors.map((line) =>
        line.color === color ? { ...line, stock } : line,
      );
      return {
        ...prev,
        sizeStock: {
          ...prev.sizeStock,
          [size]: { colors, totalStock: sumColorStock(colors) },
        },
      };
    });
  };

  const addProductColor = (color: string) => {
    setFormData((prev) => {
      if (prev.productColors.some((line) => line.color === color)) return prev;
      return {
        ...prev,
        productColors: [...prev.productColors, { color, stock: 0 }],
      };
    });
  };

  const removeProductColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      productColors: prev.productColors.filter((line) => line.color !== color),
    }));
  };

  const updateProductColorStock = (color: string, stock: number) => {
    setFormData((prev) => ({
      ...prev,
      productColors: prev.productColors.map((line) =>
        line.color === color ? { ...line, stock } : line,
      ),
    }));
  };

  const addCustomSize = (raw: string) => {
    const size = raw.trim();
    if (!size || formData.customSizes.includes(size)) return;
    setFormData((prev) => ({
      ...prev,
      customSizes: [...prev.customSizes, size],
    }));
  };

  const addImage = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const updateImage = (index: number, url: string) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[index] = url;
      return { ...prev, images: newImages };
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getSubmitData = () => {
    const base = {
      name: formData.name,
      price: Number(formData.price),
      images: formData.images.filter(Boolean),
      description: formData.description,
      published: formData.published,
      materials: formData.materials,
      category: formData.category || undefined,
      inventoryMode: formData.inventoryMode,
    } as Record<string, unknown>;

    if (formData.inventoryMode === 'unit') {
      base.stock = Number(formData.stock);
    }

    if (formData.inventoryMode === 'color') {
      base.colors = formData.productColors;
    }

    if (formData.inventoryMode === 'size_color') {
      base.sizeVariants = Object.entries(formData.sizeStock)
        .filter(([, data]) => data.colors.length > 0)
        .map(([size, data]) => ({
          size,
          colors: data.colors,
        }));
    }

    return base;
  };

  return {
    formData,
    setFormData,
    errors,
    validate,
    toggleSizeVariant,
    addColorToVariant,
    removeColorFromVariant,
    updateVariantColorStock,
    addProductColor,
    removeProductColor,
    updateProductColorStock,
    addCustomSize,
    addImage,
    updateImage,
    removeImage,
    getSubmitData,
    SIZE_PRESETS,
  };
}
