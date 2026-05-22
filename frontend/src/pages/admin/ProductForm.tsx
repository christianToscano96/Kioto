import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useProductsStore } from '@/store/products';
import { useCategoriesStore } from '@/store/categories';
import type { Product } from '../../../../shared/src';
import { showToast } from '@/components/ui/Toast';
import { useProductForm } from '@/hooks/useProductForm';
import { Save, X, Trash2 } from '@/components/icons';
import type { SizeType } from '@/hooks/useProductForm';

const ALL_PRESET_COLORS = [
  '#000000', '#FFFFFF', '#99452c', '#2e6b4f', '#c27e41',
  '#6b7280', '#dc2626', '#2563eb', '#7c3aed', '#ca8a04',
  '#059669', '#db2777', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
];

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoadingAdmin);
  const createProduct = useProductsStore((state) => state.createProduct);
  const updateProduct = useProductsStore((state) => state.updateProduct);
  const fetchAdminProducts = useProductsStore((state) => state.fetchAdminProducts);

  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  const product = products?.find((p: Product) => p._id === id);

  const {
    formData,
    setFormData,
    errors,
    validate,
    toggleSize,
    removeColor,
    toggleSizeVariant,
    addColorToVariant,
    removeColorFromVariant,
    updateColorStock,
    addImage,
    updateImage,
    removeImage,
    getSubmitData,
    SIZE_PRESETS,
  } = useProductForm({ product, isEdit });

  useEffect(() => {
    fetchAdminProducts();
    fetchCategories();
  }, [fetchAdminProducts, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = getSubmitData();

    try {
      if (isEdit) {
        await updateProduct(id!, submitData);
        showToast({ type: 'success', title: 'Producto actualizado' });
      } else {
        await createProduct(submitData);
        showToast({ type: 'success', title: 'Producto creado' });
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showToast({ type: 'error', title: 'Error al guardar producto' });
    }
  }

  // —------ Helpers de UI --------
  const availableSizes =
    formData.sizeType === 'custom'
      ? formData.sizes
      : SIZE_PRESETS[formData.sizeType];

  const addCustomSize = (raw: string) => {
    const size = raw.trim();
    if (!size || formData.sizes.includes(size)) return;
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, size],
    }));
  };

  const CustomSizeAdder = () => (
    <div className="mt-2">
      <div className="flex gap-2">
        <Input
          placeholder="Agregar talla (ej: S, M, L)"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              addCustomSize(val);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm"
          onClick={() => {
            const input = (document.querySelector(
              '[data-custom-size-input]'
            ) as HTMLInputElement);
            if (input) {
              addCustomSize(input.value);
              input.value = '';
            }
          }}
        >
          +
        </Button>
      </div>
      <p className="text-xs text-on-surface-variant mt-1">Presiona Enter para agregar</p>
    </div>
  );

  // —------ Render --------
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-on-surface">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {isEdit ? 'ID: ' + id?.slice(-6) : 'Completa la información del producto'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          <X size={16} />
          Cancelar
        </Button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="flex-1 space-y-4">

          {/* Información básica */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
            <h2 className="text-base font-serif font-bold text-on-surface mb-4">Información Básica</h2>
            <div className="space-y-4">
              <Input
                label="Nombre del Producto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  error={errors.price}
                  required
                />
                {!formData.hasSizes && (
                  <Input
                    label="Stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    error={errors.stock}
                    required
                  />
                )}
              </div>

              <Input
                label="Materiales"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                placeholder="100% Algodón orgánico, Lino belga..."
              />

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Características, estilo, detalles..."
                  className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {errors.description && (
                  <span className="text-sm text-terracota-600">{errors.description}</span>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant text-verde-bosque-600 focus:ring-verde-bosque-500"
                />
                <label htmlFor="published" className="ml-2 text-sm font-medium text-on-surface">
                  Publicado en tienda
                </label>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ══════ VARIANTES ══════ */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
            <h2 className="text-base font-serif font-bold text-on-surface mb-4">Variantes</h2>
            <div className="space-y-4">

              {/* Checkbox "tiene variantes" */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasSizes"
                  checked={formData.hasSizes}
                  onChange={(e) => {
                    const hasSizes = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      hasSizes,
                      sizeStock: hasSizes
                        ? Object.keys(prev.sizeStock).reduce((acc, k) => {
                            // limpia las que no estén en esta preselección
                            return acc;
                          }, {} as typeof prev.sizeStock)
                        : {},
                    }));
                  }}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <label htmlFor="hasSizes" className="ml-2 text-sm font-medium text-on-surface">
                  Este producto tiene variantes
                </label>
              </div>

              {formData.hasSizes && (
                <>
                  {/* Tipo de talla */}
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">
                      Tipo de Tallas
                    </label>
                    <select
                      value={formData.sizeType}
                      onChange={(e) => setFormData({ ...formData, sizeType: e.target.value as SizeType, sizes: [] })}
                      className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="tops">Prenda superior (XS-XXL)</option>
                      <option value="bottoms">Prenda inferior (28-42)</option>
                      <option value="footwear">Calzado (5-12 US)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {formData.sizeType === 'custom' && <CustomSizeAdder />}
                  </div>

                  {/* Lista de tallas — cada una con su panel de colores */}
                  <div className="space-y-3">
                    {availableSizes.map((size) => {
                      const variant = formData.sizeStock[size];
                      const isActive = !!variant;

                      return (
                        <div
                          key={size}
                          className={`border rounded-lg transition-all ${
                            isActive
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-outline-variant/30'
                          }`}
                        >
                          {/* Row: checkbox + nombre de talla + stock total */}
                          <div
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                            onClick={() => toggleSizeVariant(size)}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => toggleSizeVariant(size)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-on-surface flex-1">{size}</span>
                            {isActive && variant.totalStock > 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Stock: {variant.totalStock}
                              </span>
                            )}
                          </div>

                          {/* Panel de colores */}
                          {isActive && (
                            <div className="px-3 pb-3 space-y-3 border-t border-outline-variant/20 pt-2 mt-1">
                              {/* Colores ya agregados */}
                              {variant.colorStock.length > 0 && (
                                <div className="space-y-1.5">
                                  {variant.colorStock.map((cs) => (
                                    <div
                                      key={cs.name}
                                      className="flex items-center gap-2"
                                    >
                                      {/* Check de color */}
                                      <input
                                        type="checkbox"
                                        checked
                                        readOnly
                                        className="h-4 w-4 rounded border-outline accent-primary pointer-events-none"
                                      />
                                      {/* Circulo de color */}
                                      <div
                                        className="w-6 h-6 rounded-full border border-outline-variant flex-shrink-0"
                                        style={{ backgroundColor: cs.name }}
                                      />
                                      {/* Nombre hex */}
                                      <span className="text-xs font-mono text-on-surface-variant w-20">
                                        {cs.name}
                                      </span>
                                      {/* Input stock */}
                                      <div className="flex-1 flex items-center gap-1">
                                        <span className="text-xs text-on-surface-variant">stock:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={cs.stock}
                                          onChange={(e) =>
                                            updateColorStock(size, cs.name, parseInt(e.target.value) || 0)
                                          }
                                          className="w-16 rounded border border-outline px-2 py-1 text-xs"
                                        />
                                      </div>
                                      {/* Eliminar color */}
                                      <button
                                        type="button"
                                        onClick={() => removeColorFromVariant(size, cs.name)}
                                        className="p-1 text-terracota-500 hover:text-terracota-700"
                                        title="Eliminar color"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Paleta de colores para agregar */}
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1.5">
                                  Paleta rápida:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {ALL_PRESET_COLORS.map((color) => {
                                    const alreadyAdded = variant.colorStock.some(
                                      (c) => c.name === color
                                    );
                                    return (
                                      <button
                                        key={color}
                                        type="button"
                                        disabled={alreadyAdded}
                                        onClick={() => addColorToVariant(size, color)}
                                        className={`w-7 h-7 rounded-full border transition-all ${
                                          alreadyAdded
                                            ? 'border-primary/60 ring-2 ring-primary/30 scale-105'
                                            : 'border-outline hover:border-primary hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={alreadyAdded ? 'Ya agregado' : color}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Color picker personalizado */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  id={`color-${size}`}
                                  defaultValue="#99452c"
                                  className="h-8 w-10 rounded border border-outline cursor-pointer"
                                />
                                 <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    const picker = document.getElementById(
                                      `color-${size}`
                                    ) as HTMLInputElement;
                                    if (picker) {
                                      addColorToVariant(size, picker.value);
                                    }
                                  }}
                                >
                                  + Agregar color personalizado
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA — Imágenes ── */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
            <h2 className="text-base font-serif font-bold text-on-surface mb-4">Imágenes del Producto</h2>
            <div className="space-y-3">
              {formData.images.map((img, index) => (
                <ImageUpload
                  key={index}
                  label={`Imagen ${index + 1}`}
                  currentImage={img}
                  onUpload={(url) => {
                    const newImages = [...formData.images];
                    newImages[index] = url;
                    setFormData({ ...formData, images: newImages });
                  }}
                  onRemove={() => {
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }));
                  }}
                />
              ))}
              {formData.images.length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  + Agregar imagen
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Actions bar */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-outline-variant/60">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isLoading} form="product-form">
          <Save size={16} />
          {isEdit ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </div>
  );
}
