import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@shared/index';

// ─── Form data — solo campos básicos ───
interface ProductFormData {
  name: string;
  price: string;
  images: string[];
  description: string;
  stock: string;
  published: boolean;
  materials: string;
  hasSizes: boolean;
  category: string;
}

interface UseProductFormProps {
  product?: Product | null;
  isEdit: boolean;
  hasSizes?: boolean; // opcional, controlado por el componente exterior
}

const DEFAULT_FORM: ProductFormData = {
  name: '',
  price: '',
  images: [],
  description: '',
  stock: '',
  published: false,
  materials: '',
  hasSizes: false,
  category: '',
};

export function useProductForm({ product, isEdit, hasSizes: externalHasSizes }: UseProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Sincronizar hasSizes externo (cuando el usuario tilda el checkbox) ───
  useEffect(() => {
    if (externalHasSizes !== undefined && formData.hasSizes !== externalHasSizes) {
      setFormData((prev) => ({ ...prev, hasSizes: externalHasSizes }));
    }
  }, [externalHasSizes]);

  // ─── Cargar datos al editar ───
  useEffect(() => {
    if (isEdit && product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        images: product.images || [],
        description: product.description || '',
        stock: product.stock?.toString() || '',
        published: product.published || false,
        materials: product.materials || '',
        hasSizes: !!(product.variants && product.variants.length > 0),
        category: typeof product.category === 'object' ? product.category?._id : product.category || '',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [isEdit, product]);

  // ─── Validación ───
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())                newErrors.name = 'El nombre es requerido';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0)
                                              newErrors.price = 'Se requiere un precio válido';
    if (!formData.description.trim())         newErrors.description = 'La descripción es requerida';
    if (!formData.hasSizes && (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0))
                                              newErrors.stock = 'Se requiere una cantidad válida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ─── SetHasSizes (para sincronizar con el checkbox del componente) ───
  const setHasSizes = useCallback((v: boolean) => {
    setFormData((prev) => ({ ...prev, hasSizes: v }));
  }, []);

  // ─── Image helpers ───
  const addImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  }, []);

  const updateImage = useCallback((index: number, url: string) => {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = url;
      return { ...prev, images: next };
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }, []);

  // ─── Build submit payload ───
  const getSubmitData = useCallback(() => {
    const base: Record<string, any> = {
      name:         formData.name,
      price:        Number(formData.price),
      images:       formData.images.filter(Boolean),
      description:  formData.description,
      stock:        formData.hasSizes ? 0 : Number(formData.stock),
      published:    formData.published,
      materials:    formData.materials,
      category:     formData.category || undefined,
    };

    if (!formData.hasSizes) {
      base.variants = [];
    }

    return base;
  }, [formData]);

  return {
    formData,
    setFormData,
    setHasSizes,
    errors,
    validate,
    addImage,
    removeImage,
    getSubmitData,
    hasSizes: formData.hasSizes,
  };
}

// Estado base exportado para uso externo (tests, etc.)
export const DEFAULT_FORM_DATA = DEFAULT_FORM;
