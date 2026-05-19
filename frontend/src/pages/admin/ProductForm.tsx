import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useProductsStore } from '@/store/products';
import { useCategoriesStore } from '@/store/categories';
import type { Product } from '../../../../shared/src';
import { showToast } from '@/components/ui/Toast';
import { useProductForm } from '@/hooks/useProductForm';
import { Save, X, Trash2, AlertCircle } from '@/components/icons';

// ─── Presets ───
const ALL_PRESET_COLORS = [
  '#000000', '#FFFFFF', '#99452c', '#2e6b4f', '#c27e41',
  '#6b7280', '#dc2626', '#2563eb', '#7c3aed', '#ca8a04',
  '#059669', '#db2777', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
];

const SIZE_PRESETS = {
  tops:     ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottoms:  ['28', '30', '32', '34', '36', '38', '40', '42'],
  footwear: ['5', '6', '7', '8', '9', '10', '11', '12'],
  custom:   [] as string[],
};
type SizeType = keyof typeof SIZE_PRESETS;

// ─── ColorStock shape ───
interface ColorStockEntry { name: string; stock: number; }

// ─── Variant rows ───
type VariantRows = Record<string, { colorStock: ColorStockEntry[]; totalStock: number }>;

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const products       = useProductsStore((s) => s.products);
  const isLoading      = useProductsStore((s) => s.isLoading);
  const createProduct  = useProductsStore((s) => s.createProduct);
  const updateProduct  = useProductsStore((s) => s.updateProduct);
  const fetchAdminProds = useProductsStore((s) => s.fetchAdminProducts);
  const categories     = useCategoriesStore((s) => s.categories);
  const fetchCats      = useCategoriesStore((s) => s.fetchCategories);

  const product        = products?.find((p: Product) => p._id === id);

  // ─── Hook: solo campos basicos + sync de hasSizes con checkbox ───
  const {
    formData,
    setFormData,
    setHasSizes,
    errors,
    validate,
    removeImage,
    getSubmitData,
  } = useProductForm({ product, isEdit });

  useEffect(() => {
    fetchAdminProds();
    fetchCats();
  }, [fetchAdminProds, fetchCats]);

  // ─── Variantes state (solo el componente maneja la UI de variantes) ───
  const [sizeType, setSizeType]   = useState<SizeType>('tops');
  const [rows, setRows]           = useState<VariantRows>({});
  const [customFor, setCustomFor] = useState<string | null>(null);
  const customRef                 = useRef<HTMLInputElement>(null);

  // Cargar variantes al editar
  useEffect(() => {
    if (isEdit && product) {
      const hasVs = !!(product.variants && product.variants.length > 0);
      setHasSizes(hasVs);
      if (hasVs && product.variants) {
        const rs: VariantRows = {};
        product.variants.forEach((v: any) => {
          const cs = v.colorStock || [];
          rs[v.size] = { colorStock: cs, totalStock: v.stock || cs.reduce((s: number, c: any) => s + c.stock, 0) };
        });
        setRows(rs);
        // Detectar tipo de talla desde los datos existentes
        const sizes = Object.keys(rs);
        if (SIZE_PRESETS.bottoms.every((s)  => sizes.includes(s))) setSizeType('bottoms');
        else if (SIZE_PRESETS.footwear.every((s) => sizes.includes(s))) setSizeType('footwear');
        else setSizeType('tops');
      } else {
        setRows({});
        setSizeType('tops');
      }
    }
  }, [isEdit, product, setHasSizes]);

  const availableSizes      = SIZE_PRESETS[sizeType];
  const totalVariantStock   = Object.values(rows).reduce((s, r) => s + r.totalStock, 0);
  const hasActiveVariants   = Object.keys(rows).length > 0;

  // ─── Submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Revisá los campos del formulario' });
      return;
    }
    const payload = buildSubmitPayload();
    try {
      if (isEdit) {
        await updateProduct(id!, payload);
        showToast({ type: 'success', title: 'Producto actualizado' });
      } else {
        await createProduct(payload);
        showToast({ type: 'success', title: 'Producto creado' });
      }
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const msg = err?.response?.data?.error || err?.message || 'Error al guardar producto';
      showToast({ type: 'error', title: msg });
    }
  };

  const buildSubmitPayload = (): Record<string, any> => {
    const base = getSubmitData();
    if (hasActiveVariants) {
      base.variants = Object.entries(rows)
        .filter(([, d]) => d.colorStock.length > 0)
        .map(([size, d]) => ({ size, colorStock: d.colorStock, stock: d.totalStock }));
      base.stock = Object.values(rows).reduce((s, r) => s + r.totalStock, 0);
    } else if (formData.hasSizes) {
      // Checkbox tildado pero sin filas activas
      showToast({ type: 'error', title: 'Agregá al menos una talla con colores antes de guardar' });
      throw new Error('No hay variantes definidas');
    }
    return base;
  };

  // ─── Variant helpers ───
  const activateSize = (size: string) => {
    setRows((p) => {
      if (p[size]) return p;
      return { ...p, [size]: { colorStock: [], totalStock: 0 } };
    });
  };

  const deactivateSize = (size: string) => {
    setRows((p) => { const { [size]: _, ...rest } = p; return rest; });
  };

  const addColorToRow = (size: string, hex: string) => {
    setRows((p) => {
      const row = p[size];
      if (!row || row.colorStock.some((c) => c.name === hex)) return p;
      const cs = [...row.colorStock, { name: hex, stock: 0 }];
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s, c) => s + c.stock, 0) } };
    });
  };

  const removeColorFromRow = (size: string, hex: string) => {
    setRows((p) => {
      const row = p[size];
      if (!row) return p;
      const cs = row.colorStock.filter((c) => c.name !== hex);
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s, c) => s + c.stock, 0) } };
    });
  };

  const setRowColorStock = (size: string, hex: string, stock: number) => {
    setRows((p) => {
      const row = p[size];
      if (!row) return p;
      const cs = row.colorStock.map((c) => (c.name === hex ? { ...c, stock } : c));
      return { ...p, [size]: { ...row, colorStock: cs, totalStock: cs.reduce((s, c) => s + c.stock, 0) } };
    });
  };

  // ─── Custom color picker ───
  const openCustomPicker = (size: string) => {
    setCustomFor(size);
    customRef.current?.click();
  };

  // ─── Custom size adder ───
  const [customSizeRaw, setCustomSizeRaw] = useState('');
  const addCustomSize = () => {
    const v = customSizeRaw.trim();
    if (!v || Object.keys(rows).includes(v)) return;
    activateSize(v);
    setCustomSizeRaw('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ── */}
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
          <X size={16} /> Cancelar
        </Button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="flex-1 space-y-4">

          {/* Información Básica */}
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
                  type="number" step="0.01" min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  error={errors.price}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    Stock
                    {formData.hasSizes && <span className="text-xs text-on-surface-variant/70"> (calculado de variantes)</span>}
                  </label>
                  <input
                    type="number"
                    readOnly={formData.hasSizes}
                    value={formData.hasSizes ? totalVariantStock : formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      formData.hasSizes
                        ? 'bg-surface-container border-outline-variant/30 text-on-surface-variant cursor-not-allowed'
                        : 'border-outline bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  {formData.hasSizes && totalVariantStock > 0 && (
                    <p className="text-xs text-primary mt-1">Suma de stock de todas las variantes</p>
                  )}
                  {errors.stock && !formData.hasSizes && (
                    <span className="text-sm text-terracota-600">{errors.stock}</span>
                  )}
                </div>
              </div>

              <Input
                label="Materiales"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                placeholder="100% Algodón orgánico, Lino belga..."
              />

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Características, estilo, detalles..."
                  className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {errors.description && <span className="text-sm text-terracota-600">{errors.description}</span>}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant text-verde-bosque-600 focus:ring-verde-bosque-500"
                />
                <span className="text-sm font-medium text-on-surface">Publicado en tienda</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ══════ VARIANTES ══════ */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-serif font-bold text-on-surface">Variantes</h2>
              {formData.hasSizes && totalVariantStock > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Stock total: {totalVariantStock}
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={formData.hasSizes}
                onChange={(e) => setHasSizes(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-on-surface">
                Este producto tiene variantes (tallas + colores)
              </span>
            </label>

            {formData.hasSizes && (
              <div className="space-y-4">
                {/* Selector de tipo de talla */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Tipo de Tallas</label>
                    <select
                      value={sizeType}
                      onChange={(e) => {
                        const t = e.target.value as SizeType;
                        setSizeType(t);
                        setRows({});
                      }}
                      className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="tops">Prenda superior (XS–XXL)</option>
                      <option value="bottoms">Prenda inferior (28–42)</option>
                      <option value="footwear">Calzado (5–12 US)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  {sizeType === 'custom' && (
                    <div className="mt-1">
                      <div className="flex gap-2">
                        <Input
                          data-custom-size-input
                          placeholder="Ej: S, M, L, 38…"
                          value={customSizeRaw}
                          onChange={(e) => setCustomSizeRaw(e.target.value)}
                          onKeyPress={(e) => { if (e.key === 'Enter') addCustomSize(); }}
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={addCustomSize}>+</Button>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">Enter para agregar</p>
                    </div>
                  )}
                </div>

                {/* ── Tabla de variantes ── */}
                <div className="border border-outline-variant/30 rounded-lg overflow-hidden">
                  {Object.keys(rows).length > 0 && (
                    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 px-4 py-2 bg-surface-container text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      <span className="w-6" />
                      <span>Talla</span>
                      <span>Color</span>
                      <span className="text-right">Stock</span>
                      <span className="w-8" />
                    </div>
                  )}

                  {Object.keys(rows).length === 0 && (
                    <div className="flex flex-col items-center py-10 text-center">
                      <AlertCircle size={32} className="text-on-surface-variant/40 mb-2" />
                      <p className="text-sm text-on-surface-variant">No agregaste ninguna variante todavía</p>
                      <p className="text-xs text-on-surface-variant/70 mt-1">Elegí las tallas que querés activar desde la lista de arriba.</p>
                    </div>
                  )}

                  {Object.entries(rows).map(([size, row]) => (
                    <div key={size} className="border-t border-outline-variant/20">
                      {/* Size row header */}
                      <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 px-4 py-2.5 items-center">
                        <span />
                        <span className="text-sm font-medium text-on-surface">{size}</span>
                        <span className="text-xs text-on-surface-variant">
                          {row.colorStock.length} {row.colorStock.length === 1 ? 'color' : 'colores'}
                        </span>
                        <span className="text-sm font-semibold text-primary text-right">{row.totalStock}</span>
                        <button type="button" onClick={() => deactivateSize(size)} className="p-1 text-terracota-500 hover:text-terracota-700 rounded" title="Eliminar variante">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Color stock rows */}
                      {row.colorStock.map((cs) => (
                        <div
                          key={cs.name}
                          className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 px-4 py-2 items-center border-t border-outline-variant/10"
                        >
                          <span />
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border border-outline-variant flex-shrink-0" style={{ backgroundColor: cs.name }} />
                            <span className="text-xs font-mono text-on-surface-variant">{cs.name}</span>
                          </div>
                          <span />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={cs.stock}
                              onChange={(e) => setRowColorStock(size, cs.name, parseInt(e.target.value) || 0)}
                              className="w-16 rounded border border-outline px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <button type="button" onClick={() => removeColorFromRow(size, cs.name)} className="p-1 text-terracota-500 hover:text-terracota-700 rounded" title="Quitar color">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Add color row */}
                      <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 px-4 py-2 items-center border-t border-outline-variant/10 bg-surface-container/30">
                        <span />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-on-surface-variant mr-1">Paleta:</span>
                          {ALL_PRESET_COLORS.map((color) => {
                            const already = row.colorStock.some((c) => c.name === color);
                            return (
                              <button
                                key={color}
                                type="button"
                                disabled={already}
                                onClick={() => addColorToRow(size, color)}
                                title={color}
                                className={`w-6 h-6 rounded-full border transition-all ${
                                  already ? 'border-primary/40 ring-1 ring-primary/20 opacity-40' : 'border-outline hover:border-primary hover:scale-110'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            );
                          })}
                          <input
                            ref={customFor === size ? customRef : undefined}
                            type="color"
                            defaultValue="#99452c"
                            className="h-6 w-8 rounded border border-outline cursor-pointer opacity-0 absolute"
                            onChange={(e) => { addColorToRow(size, e.target.value); setCustomFor(null); }}
                          />
                          <button type="button" onClick={() => { setCustomFor(size); customRef.current?.click(); }} className="text-[11px] text-primary hover:text-primary/80 underline">
                            + Personalizado
                          </button>
                        </div>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activar tallas */}
                {availableSizes.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1.5">Activar tallas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSizes.map((size) => {
                        const isActive = !!rows[size];
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => isActive ? deactivateSize(size) : activateSize(size)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                              isActive
                                ? 'bg-primary text-white border-primary'
                                : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── COLUMNA DERECHA — Imágenes ── */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/40 lg:sticky lg:top-4">
            <h2 className="text-base font-serif font-bold text-on-surface mb-4">Imágenes</h2>
            <div className="space-y-3">
              {formData.images.map((img, index) => (
                <ImageUpload
                  key={index}
                  label={`Imagen ${index + 1}`}
                  currentImage={img}
                  onUpload={(url) => {
                    const next = [...formData.images];
                    next[index] = url;
                    setFormData({ ...formData, images: next });
                  }}
                  onRemove={() => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                />
              ))}
              {formData.images.length < 5 && (
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }))} className="text-xs text-primary hover:text-primary/80">
                  + Agregar imagen
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Actions bar */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-outline-variant/60">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isLoading} form="product-form">
          <Save size={16} /> {isEdit ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </div>
  );
}
