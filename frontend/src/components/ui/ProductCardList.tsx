import { memo } from "react";
import { Minus, Plus, ShoppingBag, Eye } from '@/components/icons';
import { useProductStock } from "../../hooks/useProductStock";
import type { Product } from "../../../../shared/src";

interface ProductCardListProps {
  product: Product;
  showQuickActions?: boolean;
  // Derived
  totalStock: number;
  getVariantStock: (size: string) => number;
  hasVariants: boolean;
  availableSizes: string[];
  availableStock: number;
  hasSizes: boolean;
  handleAddToCart: (size: string, color: string, qty: number, onSuccess?: () => void) => void;
  /** Se dispara al tocar el botón de carrito — la página decide si abre sidebar o bottom sheet */
  onAddToCart: (productId: string) => void;
}

export function ProductCardList({
  product,
  showQuickActions = true,
  totalStock,
  getVariantStock,
  hasVariants,
  availableSizes,
  availableStock,
  hasSizes,
  handleAddToCart,
  onAddToCart,
}: ProductCardListProps) {
  return (
    <div className="group bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 hover:shadow-xl hover:border-outline-variant/60 transition-all duration-300">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div
          className="block sm:w-56 lg:w-64 xl:w-72 flex-shrink-0 cursor-pointer"
          onClick={() => { window.location.href = `/products/${product._id}`; }}
        >
          <div className="aspect-[3/4] sm:aspect-square bg-surface-container rounded-xl overflow-hidden relative">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                  totalStock === 0 ? "grayscale opacity-60" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                Sin imagen
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
              {totalStock <= 5 && totalStock > 0 && (
                <span className="bg-verde-bosque-600 text-on-primary font-label text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shadow-md">
                  Últimos
                </span>
              )}
              {totalStock === 0 && (
                <span className="bg-error text-on-primary font-label text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shadow-md">
                  Agotado
                </span>
              )}
            </div>

            {/* Sold Out Overlay — solo si no hay badge */}
            {totalStock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                <span className="font-label text-sm uppercase tracking-widest text-white/90">
                  Agotado
                </span>
              </div>
            )}

            {/* Quick Actions overlay en hover desktop */}
            {showQuickActions && totalStock > 0 && (
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/products/${product._id}`;
                  }}
                  className="w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-md hover:bg-surface-container transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex-1">
            <button
              onClick={() => { window.location.href = `/products/${product._id}`; }}
              className="text-left w-full"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-on-surface hover:text-primary transition-colors leading-tight">
                  {product.name}
                </h3>
                {product.category && (
                  <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    {typeof product.category === 'string' ? product.category : product.category.name}
                  </span>
                )}
              </div>
            </button>

            <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-4 line-clamp-2 sm:line-clamp-3">
              {product.description}
            </p>

            {/* Specs compactos */}
            {(product.materials || (product.sizes?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.materials && (
                  <span className="bg-surface-container text-on-surface-variant text-xs px-2.5 py-1 rounded-full border border-outline-variant/30">
                    {product.materials}
                  </span>
                )}
                {(product.sizes?.length ?? 0) > 0 && (
                  <span className="bg-surface-container text-on-surface-variant text-xs px-2.5 py-1 rounded-full border border-outline-variant/30">
                    {product.sizes?.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom row: price + stock + cta */}
          <div className="flex items-end justify-between pt-3 border-t border-outline-variant/20">
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                ${product.price.toFixed(2)}
              </p>
              {hasSizes && availableSizes.length > 0 && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Tallas: {availableSizes.join(', ')}
                </p>
              )}
              {totalStock <= 5 && totalStock > 0 && (
                <p className="text-xs text-verde-bosque-600 font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-verde-bosque-600 rounded-full animate-pulse" />
                  ¡Últimas {totalStock} unidades!
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* CTA secundaria — ver detalles */}
              <button
                onClick={() => { window.location.href = `/products/${product._id}`; }}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:border-outline-variant transition-all active:scale-95"
                title="Ver detalles"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* CTA principal — agregar */}
               <button
                onClick={() => {
                  onAddToCart(product._id);
                }}
                disabled={totalStock === 0}
                className="bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProductCardListMemo = memo(ProductCardList, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.price === next.product.price &&
  prev.product.name === next.product.name &&
  prev.product.images?.join() === next.product.images?.join() &&
  prev.showQuickActions === next.showQuickActions
);
