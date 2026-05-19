import { useMemo, useState, useCallback } from "react";
import { Minus, Plus } from "@/components/icons";
import { useCartStore } from "@/store/cart";
import {
  useQuickAddPanel,
  useSetQuickAddSize,
  useSetQuickAddColor,
  useSetQuickAddQuantity,
  useResetQuickAdd,
} from "@/store/ui";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  getActiveVariants,
  getAvailableColors,
  getColorStockMap,
  getMaxStock,
  getQuickAddError,
} from "@/lib/quickAddStock";
import type { Product, ProductVariant } from "@shared/index";

interface QuickAddBottomSheetProps {
  products: Product[] | undefined;
  enabled?: boolean;
}

export function QuickAddBottomSheet({ products, enabled = true }: QuickAddBottomSheetProps) {
  const state = useQuickAddPanel();
  const addToCart = useCartStore((store) => store.addToCart);
  const setSize = useSetQuickAddSize();
  const setColor = useSetQuickAddColor();
  const setQuantity = useSetQuickAddQuantity();
  const reset = useResetQuickAdd();
  const { addToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = useMemo(
    () => products?.find((item) => item._id === state.productId),
    [products, state.productId],
  );

  const variants = useMemo(
    () => (product?.variants as ProductVariant[]) || [],
    [product],
  );

  const images = useMemo(() => product?.images || [], [product?.images]);

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
      await addToCart(product!, state.quantity, finalSize, finalColor);
      addToast({
        type: "success",
        title: "¡Agregado!",
        message: `${product!.name} fue agregado al carrito`,
      });
      reset();
      setCurrentImageIndex(0);
    } catch {
      addToast({ type: "error", title: "Error", message: "No se pudo agregar" });
    }
  }, [variants, state, availableColors, addToCart, product, addToast, reset, hasVariants]);

  const handleClose = useCallback(() => {
    reset();
    setCurrentImageIndex(0);
  }, [reset]);

  if (!enabled || !state.productId || !product) return null;

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3 min-w-0">
          
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{product.name}</p>
            <p className="text-sm text-on-surface-variant font-label">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      }
      maxHeight="90%"
      closable
    >
      <div className="space-y-4 py-2">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 flex items-center justify-center text-on-surface active:scale-95 transition-all"
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 flex items-center justify-center text-on-surface active:scale-95 transition-all"
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
        {activeVariants.length > 0 && (
          <div>
            <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Talla</p>
            <div className="flex flex-wrap gap-1.5">
              {activeVariants.map((variant) => {
                const totalStock = (variant.colorStock || []).reduce((sum, color) => sum + (color.stock || 0), 0);
                const isOut = totalStock === 0;
                const isActive = state.selectedSize === variant.size;

                return (
                  <button
                    key={variant.size}
                    onClick={() => {
                      setSize(variant.size);
                      setColor("");
                      setQuantity(1);
                    }}
                    disabled={isOut}
                    className={`min-w-[40px] h-9 px-3 text-sm rounded-lg border transition-all font-medium ${
                      isActive
                        ? "bg-primary text-on-primary border-primary"
                        : isOut
                          ? "border-outline-variant/30 text-on-surface-variant/40 opacity-50 cursor-not-allowed line-through"
                          : "border-outline-variant active:scale-95"
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state.selectedSize && availableColors.length > 0 && (
          <div>
            <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const colorStock = getColorStockMap(variants, state.selectedSize)[color] ?? 0;
                const isOut = colorStock === 0;
                const isActive = state.selectedColor === color;

                return (
                  <button
                    key={color}
                    onClick={() => !isOut && setColor(color)}
                    disabled={isOut}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      isActive
                        ? "border-primary scale-110 ring-2 ring-primary/25"
                        : isOut
                          ? "border-outline-variant/25 opacity-35 cursor-not-allowed grayscale"
                          : "border-outline-variant active:scale-90"
                    }`}
                    style={{ backgroundColor: color }}
                    title={`${color}${colorStock > 0 ? ` · ${colorStock} en stock` : " · Agotado"}`}
                  />
                );
              })}
            </div>
            {state.selectedColor && (
              <p className="mt-1.5 text-[10px] font-mono text-primary">
                {state.selectedColor} · {getColorStockMap(variants, state.selectedSize)[state.selectedColor]} unidades
              </p>
            )}
          </div>
        )}

        {/* Cantidad + Botón */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setQuantity(Math.max(1, state.quantity - 1))
              }
              disabled={state.quantity <= 1}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold w-6 text-center tabular-nums">{state.quantity}</span>
            <button
              onClick={() =>
                setQuantity(
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
            Agregar al carrito
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
