import { useMemo } from "react";
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

  const product = useMemo(
    () => products?.find((item) => item._id === state.productId),
    [products, state.productId],
  );

  const variants = useMemo(
    () => (product?.variants as ProductVariant[]) || [],
    [product],
  );

  if (!enabled || !state.productId || !product) return null;

  const activeVariants = getActiveVariants(variants);
  const availableColors = getAvailableColors(variants, state.selectedSize);
  const maxStock = getMaxStock(variants, state);
  const canAddToCart = () => getQuickAddError(variants, state);

  const handleSubmit = async () => {
    const error = canAddToCart();
    if (error) {
      addToast({ type: "error", title: error });
      return;
    }

    const finalColor =
      state.selectedColor ||
      (availableColors.length === 1 ? availableColors[0] : undefined);

    try {
      await addToCart(product, state.quantity, state.selectedSize, finalColor || undefined);
      addToast({
        type: "success",
        title: "¡Agregado!",
        message: `${product.name} fue agregado al carrito`,
      });
      reset();
    } catch {
      addToast({ type: "error", title: "Error", message: "No se pudo agregar" });
    }
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={reset}
      title={
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-on-surface-variant">
                Sin img
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate">{product.name}</p>
            <p className="text-[10px] text-on-surface-variant font-label">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      }
      maxHeight="90%"
      closable
    >
      <div className="space-y-4 py-2">
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

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, state.quantity - 1))}
              disabled={state.quantity <= 1}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold w-6 text-center tabular-nums">{state.quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(maxStock || 99, state.quantity + 1))}
              disabled={state.quantity >= (maxStock || 99)}
              className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!!canAddToCart()}
            className="bg-primary text-on-primary font-label text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
