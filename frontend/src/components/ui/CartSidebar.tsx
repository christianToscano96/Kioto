import { useMemo, useState, useCallback } from "react";
import { Minus, Plus } from "@/components/icons";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import {
  useQuickAddSidebar,
  useCloseQuickAddSidebar,
  useSetSidebarSize,
  useSetSidebarColor,
  useSetSidebarQuantity,
  useResetSidebar,
} from "@/store/ui";
import type { Product, ProductVariant } from "@shared/index";
import {
  getActiveVariants,
  getAvailableColors,
  getColorStockMap,
  getMaxStock,
  getQuickAddError,
} from "@/lib/quickAddStock";

interface CartSidebarProps {
  products: Product[] | undefined;
}


export function CartSidebar({ products }: CartSidebarProps) {
  const state = useQuickAddSidebar();
  const closeSidebar = useCloseQuickAddSidebar();

  const addToCart = useCartStore((s) => s.addToCart);
  const { addToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const close = closeSidebar;

  const setSidebarSize = useSetSidebarSize();
  const setSidebarColor = useSetSidebarColor();
  const setSidebarQuantity = useSetSidebarQuantity();
  const resetSidebar = useResetSidebar();

  // Derivados del producto abierto
  const product = useMemo(
    () => products?.find((p) => p._id === state.productId),
    [products, state.productId],
  );

  const variants = useMemo(
    () => (product?.variants as ProductVariant[]) || [],
    [product],
  );

  const images = useMemo(() => product?.images || [], [product?.images]);

  // Tallas con al menos 1 color en stock
  const activeVariants = useMemo(() => getActiveVariants(variants), [variants]);

  const availableColors = useMemo(
    () => getAvailableColors(variants, state.selectedSize),
    [variants, state.selectedSize],
  );
  const maxStock = useMemo(() => getMaxStock(variants, state, product?.stock), [variants, state, product?.stock]);
  const hasVariants = variants.length > 0;

  const handleSubmit = useCallback(async () => {
    const error = getQuickAddError(variants, state, product?.stock);
    if (error) {
      addToast({ type: "error", title: error });
      return;
    }
    // Sin variantes: no enviar size/color
    const finalSize = hasVariants ? state.selectedSize : undefined;
    const finalColor = hasVariants && state.selectedColor
      ? state.selectedColor
      : (availableColors.length === 1 ? availableColors[0] : undefined);

    try {
      await addToCart(
        product!,
        state.quantity,
        finalSize,
        finalColor,
      );
      addToast({
        type: "success",
        title: "¡Agregado!",
        message: `${product?.name} fue agregado al carrito`,
      });
      resetSidebar();
      setCurrentImageIndex(0);
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo agregar al carrito",
      });
    }
  }, [variants, state, availableColors, addToCart, product, addToast, resetSidebar, hasVariants]);

  const handleClose = useCallback(() => {
    close();
    setCurrentImageIndex(0);
  }, [close]);

  if (!product) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{product.name}</p>
            <p className="text-sm text-on-surface-variant font-label">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Galería de imágenes */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20">
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 flex items-center justify-center text-on-surface text-xl active:scale-95 transition-all"
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 flex items-center justify-center text-on-surface text-xl active:scale-95 transition-all"
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {/* Dots indicator */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-outline-variant/40 hover:bg-outline-variant"
                    }`}
                    aria-label={`Ir a imagen ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Tallas */}
        {activeVariants.length > 0 && (
          <div>
            <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
              Talla
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeVariants.map((v) => {
                const totalStock = (v.colorStock || []).reduce(
                  (s, c) => s + (c.stock || 0),
                  0,
                );
                const isOut = totalStock === 0;
                const isActive = state.selectedSize === v.size;
                return (
                  <button
                    key={v.size}
                    onClick={() => {
                      setSidebarSize(v.size);
                      setSidebarColor("");
                      setSidebarQuantity(1);
                    }}
                    disabled={isOut}
                    className={`min-w-[40px] h-9 px-3 text-sm rounded-lg border transition-all font-medium
                      ${isActive
                        ? "bg-primary text-on-primary border-primary"
                        : isOut
                          ? "border-outline-variant/30 text-on-surface-variant/40 opacity-50 cursor-not-allowed line-through"
                          : "border-outline-variant active:scale-95"
                      }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colores (por talla seleccionada) */}
        {state.selectedSize && availableColors.length > 0 && (
          <div>
            <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
              Color
            </p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const cs = getColorStockMap(variants, state.selectedSize)[color] ?? 0;
                const isOut = cs === 0;
                const isActive = state.selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => !isOut && setSidebarColor(color)}
                    disabled={isOut}
                    className={`w-9 h-9 rounded-full border-2 transition-all
                      ${isActive
                        ? "border-primary scale-110 ring-2 ring-primary/25"
                        : isOut
                          ? "border-outline-variant/25 opacity-35 cursor-not-allowed grayscale"
                          : "border-outline-variant active:scale-90"
                      }`}
                    style={{ backgroundColor: color }}
                    title={`${color}${cs > 0 ? ` · ${cs} en stock` : " · Agotado"}`}
                  />
                );
              })}
            </div>
            {state.selectedColor && (
              <p className="mt-1.5 text-[10px] font-mono text-primary">
                {state.selectedColor} ·{" "}
                {getColorStockMap(variants, state.selectedSize)[state.selectedColor]} unidades
              </p>
            )}
          </div>
        )}

        {/* Cantidad + Botón */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSidebarQuantity(Math.max(1, state.quantity - 1))
              }
              disabled={state.quantity <= 1}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold w-6 text-center tabular-nums">
              {state.quantity}
            </span>
            <button
              onClick={() =>
                setSidebarQuantity(
                  Math.min(maxStock || 99, state.quantity + 1),
                )
              }
              disabled={state.quantity >= (maxStock || 99)}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

            {!hasVariants && product?.stock !== undefined && (
              <p className="text-xs text-on-surface-variant">
                Stock: {product.stock}
              </p>
            )}

            {hasVariants && (
              <p className="text-xs text-on-surface-variant">
                Stock: {maxStock}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!!getQuickAddError(variants, state, product?.stock)}
              className="bg-primary text-on-primary font-label text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
            >
              Agregar
            </button>
        </div>
      </div>
    </div>
  );
}
