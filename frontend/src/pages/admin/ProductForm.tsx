import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useProductsStore } from '@/store/products';
import { useCategoriesStore } from '@/store/categories';
import type { InventoryMode, Product } from '@shared/index';
import { showToast } from '@/components/ui/Toast';
import { useProductForm } from '@/hooks/useProductForm';
import { Save, X, Trash2 } from '@/components/icons';
import type { SizeType } from '@/hooks/useProductForm';

const ALL_PRESET_COLORS = [
  '#000000', '#FFFFFF', '#99452c', '#2e6b4f', '#c27e41',
  '#6b7280', '#dc2626', '#2563eb', '#7c3aed', '#ca8a04',
  '#059669', '#db2777', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
];

const INVENTORY_MODE_OPTIONS: Array<{ value: InventoryMode; label: string; description: string }> = [
  {
    value: 'unit',
    label: 'Stock único',
    description: 'Un solo stock para todo el producto',
  },
  {
    value: 'color',
    label: 'Solo colores',
    description: 'Sin talles, cada color tiene su stock',
  },
  {
    value: 'size_color',
    label: 'Talle y color',
    description: 'Cada talle tiene colores con stock propio',
  },
];

function ColorStockEditor({
  colors,
  onAddColor,
  onRemoveColor,
  onUpdateStock,
  pickerId,
}: {
  colors: Array<{ color: string; stock: number }>;
  onAddColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  onUpdateStock: (color: string, stock: number) => void;
  pickerId: string;
}) {
  return (
    <div className="space-y-3">
      {colors.length > 0 && (
        <div className="space-y-1.5">
          {colors.map((line) => (
            <div key={line.color} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border border-outline-variant flex-shrink-0"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-xs font-mono text-on-surface-variant w-20">{line.color}</span>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-xs text-on-surface-variant">stock:</span>
                <input
                  type="number"
                  min="0"
                  value={line.stock}
                  onChange={(e) => onUpdateStock(line.color, parseInt(e.target.value, 10) || 0)}
                  className="w-16 rounded border border-outline px-2 py-1 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveColor(line.color)}
                className="p-1 text-terracota-500 hover:text-terracota-700"
                title="Eliminar color"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-on-surface-variant mb-1.5">Paleta rápida:</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PRESET_COLORS.map((color) => {
            const alreadyAdded = colors.some((line) => line.color === color);
            return (
              <button
                key={color}
                type="button"
                disabled={alreadyAdded}
                onClick={() => onAddColor(color)}
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

      <div className="flex items-center gap-2">
        <input
          type="color"
          id={pickerId}
          defaultValue="#99452c"
          className="h-8 w-10 rounded border border-outline cursor-pointer"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const picker = document.getElementById(pickerId) as HTMLInputElement | null;
            if (picker) onAddColor(picker.value);
          }}
        >
          + Agregar color personalizado
        </Button>
      </div>
    </div>
  );
}

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const products = useProductsStore((state) => state.products);
  const isSaving = useProductsStore((state) => state.isLoadingAdmin);
  const createProduct = useProductsStore((state) => state.createProduct);
  const updateProduct = useProductsStore((state) => state.updateProduct);
  const fetchAdminProducts = useProductsStore((state) => state.fetchAdminProducts);

  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  const product = products?.find((p: Product) => p._id === id);
  const [catalogLoaded, setCatalogLoaded] = useState(!isEdit);

  const {
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
    getSubmitData,
    SIZE_PRESETS,
  } = useProductForm({ product, isEdit });

  useEffect(() => {
    void fetchAdminProducts().finally(() => setCatalogLoaded(true));
    fetchCategories();
  }, [fetchAdminProducts, fetchCategories]);

  if (isEdit && !catalogLoaded) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-surface-container-low rounded w-48" />
        <div className="h-64 bg-surface-container-low rounded-xl" />
        <div className="h-48 bg-surface-container-low rounded-xl" />
      </div>
    );
  }

  if (isEdit && catalogLoaded && !product) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <h1 className="text-2xl font-serif font-bold text-on-surface mb-2">Producto no encontrado</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          El producto que buscás no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate('/admin/products')}>Volver a productos</Button>
      </div>
    );
  }

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
  };

  const availableSizes =
    formData.sizeType === 'custom'
      ? formData.customSizes
      : SIZE_PRESETS[formData.sizeType];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-on-surface">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {isEdit ? `ID: ${id?.slice(-6)}` : 'Completa la información del producto'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          <X size={16} />
          Cancelar
        </Button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
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
                {formData.inventoryMode === 'unit' && (
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

          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
            <h2 className="text-base font-serif font-bold text-on-surface mb-4">Inventario</h2>
            <div className="space-y-4">
              <div className="grid gap-3">
                {INVENTORY_MODE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      formData.inventoryMode === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="inventoryMode"
                      value={option.value}
                      checked={formData.inventoryMode === option.value}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          inventoryMode: option.value,
                          sizeStock: option.value === 'size_color' ? prev.sizeStock : {},
                          productColors: option.value === 'color' ? prev.productColors : [],
                        }))
                      }
                      className="mt-1 h-4 w-4 border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>
                      <span className="block text-sm font-medium text-on-surface">{option.label}</span>
                      <span className="block text-xs text-on-surface-variant">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              {errors.inventory && (
                <span className="text-sm text-terracota-600">{errors.inventory}</span>
              )}

              {formData.inventoryMode === 'color' && (
                <ColorStockEditor
                  colors={formData.productColors}
                  onAddColor={addProductColor}
                  onRemoveColor={removeProductColor}
                  onUpdateStock={updateProductColorStock}
                  pickerId="product-color-picker"
                />
              )}

              {formData.inventoryMode === 'size_color' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">
                      Tipo de Tallas
                    </label>
                    <select
                      value={formData.sizeType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sizeType: e.target.value as SizeType,
                          customSizes: [],
                          sizeStock: {},
                        })
                      }
                      className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="tops">Prenda superior (XS-XXL)</option>
                      <option value="bottoms">Prenda inferior (28-42)</option>
                      <option value="footwear">Calzado (5-12 US)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {formData.sizeType === 'custom' && (
                      <div className="mt-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Agregar talla (ej: S, M, L)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomSize((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">Presiona Enter para agregar</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {availableSizes.map((size) => {
                      const variant = formData.sizeStock[size];
                      const isActive = !!variant;

                      return (
                        <div
                          key={size}
                          className={`border rounded-lg transition-all ${
                            isActive ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/30'
                          }`}
                        >
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

                          {isActive && (
                            <div className="px-3 pb-3 border-t border-outline-variant/20 pt-2 mt-1">
                              <ColorStockEditor
                                colors={variant.colors}
                                onAddColor={(color) => addColorToVariant(size, color)}
                                onRemoveColor={(color) => removeColorFromVariant(size, color)}
                                onUpdateStock={(color, stock) => updateVariantColorStock(size, color, stock)}
                                pickerId={`color-${size}`}
                              />
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
                    setFormData((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }));
                  }}
                />
              ))}
              {formData.images.length < 5 && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  + Agregar imagen
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-outline-variant/60">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSaving} form="product-form">
          <Save size={16} />
          {isEdit ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </div>
  );
}
