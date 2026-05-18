import { useMemo } from "react";
import { Minus, Plus } from "@/components/icons";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import {
  useQuickAddSidebar,
  useOpenQuickAddSidebar,
  useCloseQuickAddSidebar,
  useSetSidebarSize,
  useSetSidebarColor,
  useSetSidebarQuantity,
  useResetSidebar,
} from "@/store/ui";
import type { Product, ProductVariant } from "@shared/index";

interface CartSidebarProps {
  products: Product[] | undefined;
}

/**
 * Panel lateral derecho para agregar productos al carrito.
 * Se abre desde cualquier tarjeta de producto tocando el botón de carrito.
 * Contenido desacoplado de ProductsListPage — lógica propia.
 */
export function CartSidebar({ products }: CartSidebarProps) {
  const state = useQuickAddSidebar();
  const openSidebar = useOpenQuickAddSidebar();
  const closeSidebar = useCloseQuickAddSidebar();

  const addToCart = useCartStore((s) => s.addToCart);
  const { addToast } = useToast();

  const open = openSidebar;
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

  // Tallas con al menos 1 color en stock
  const activeVariants = useMemo(
    () => variants.filter((v) => (v.colorStock || []).length > 0),
    [variants],
  );

  const getColorStockMap = (size: string): Record<string, number> => {
    const variant = variants.find((v) => v.size === size);
    if (!variant) return {};
    return (variant.colorStock || []).reduce((acc, c) => {
      acc[c.name] = c.stock || 0;
      return acc;
    }, {} as Record<string, number>);
  };

  const availableColors =
    state.selectedSize && state.selectedSize.trim() !== ""
      ? Object.keys(getColorStockMap(state.selectedSize))
      : [];

  const getMaxStock = (): number => {
    if (!state.selectedSize || state.selectedSize.trim() === "") return 0;
    const map = getColorStockMap(state.selectedSize);
    if (state.selectedColor) return map[state.selectedColor] ?? 0;
    return Object.values(map).reduce((s, n) => s + n, 0);
  };

  const maxStock = getMaxStock();

  const canAddToCart = (): string | null => {
    if (!state.selectedSize) return "Seleccioná una talla";
    if (availableColors.length > 1 && !state.selectedColor)
      return "Seleccioná un color";
    if (maxStock === 0) return "Sin stock disponible";
    if (state.quantity > maxStock) return "Stock insuficiente";
    return null;
  };

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
      await addToCart(
        product!,
        state.quantity,
        state.selectedSize,
        finalColor,
      );
      addToast({
        type: "success",
        title: "¡Agregado!",
        message: `${product?.name} fue agregado al carrito`,
      });
      resetSidebar();
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo agregar al carrito",
      });
    }
  };

  if (!open || !product) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-on-surface-variant">
                Sin img
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-[10px] text-on-surface-variant font-label">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          onClick={close}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container min-h-[44px] min-w-[44px]"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                const cs = getColorStockMap(state.selectedSize)[color] ?? 0;
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
                {getColorStockMap(state.selectedSize)[state.selectedColor]} unidades
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

          <button
            onClick={handleSubmit}
            disabled={!!canAddToCart()}
            className="bg-primary text-on-primary font-label text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
