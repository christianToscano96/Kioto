import { useState, memo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { OptimizedImage } from "./OptimizedImage";
import { useProductStock } from "../../hooks/useProductStock";
import {  Eye, ShoppingCart, ChevronLeft, ChevronRight } from '@/components/icons';
import type { Product } from "../../../../shared/src";

interface ProductCardGridProps {
  product: Product;
  showQuickActions?: boolean;
  currentImageIndex: number;
  imageError: boolean;
  setCurrentImageIndex: (idx: number) => void;
  setImageError: (err: boolean) => void;
  images: string[];
  availableSizes: string[];
  availableColors: string[];
  totalStock: number;
  getVariantStock: (size: string) => number;
  hasVariants: boolean;
  availableStock: number;
  handleAddToCart: (size: string, color: string, qty: number, onSuccess?: () => void) => void;
  hasSizes: boolean;
  /** Se dispara al tocar el botón de carrito — la página decide si abre sidebar o bottom sheet */
  onAddToCart: (productId: string) => void;
}

export function ProductCardGrid({
  product,
  showQuickActions = true,
  currentImageIndex,
  imageError,
  setCurrentImageIndex,
  setImageError,
  images,
  availableSizes,
  availableColors,
  totalStock,
  getVariantStock,
  hasVariants,
  availableStock,
  handleAddToCart,
  hasSizes,
  onAddToCart,
}: ProductCardGridProps) {
  const { isMobile } = useDeviceType();
  const { prefetchRoute } = usePrefetchRoute();
  const hasPrefetched = useRef(false);

  const handleMouseEnter = useCallback(() => {
    // Prefetch product detail page on hover (desktop only)
    // Only once per card, and only on desktop
    if (!isMobile && !hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchRoute(`/products/${product._id}`);
    }
  }, [isMobile, prefetchRoute, product._id]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((currentImageIndex + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="group relative bg-surface-container-low rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
    >
      {/* Image Container */}
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden relative">
          {images.length > 0 && !imageError ? (
            <OptimizedImage
              src={images[currentImageIndex]}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ${
                totalStock === 0 ? "grayscale opacity-60" : ""
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              Sin imagen
            </div>
          )}

          {/* Badges — más visibles con cards más grandes */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col gap-1.5 z-10">
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <span className="bg-verde-bosque-600 text-on-primary font-label text-[10px] sm:text-xs uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
                Últimos
              </span>
            )}
          </div>

          {/* Sold Out Overlay */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-black/55 sm:bg-black/60 flex items-center justify-center">
              <span className="font-label text-[10px] sm:text-xs uppercase tracking-widest text-white bg-error/90 px-2.5 sm:px-3 py-1 rounded">
                Agotado
              </span>
            </div>
          )}

          {/* Image Navigation Arrows */}
          {images.length > 1 && totalStock > 0 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-7 sm:h-7 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-7 sm:h-7 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight />
              </button>
            </>
          )}

          {/* Image Indicators */}
          {images.length > 1 && totalStock > 0 && (
            <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? "bg-white w-2 sm:w-3" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick Actions — siempre visibles en mobile; solo en hover en desktop */}
          {showQuickActions && totalStock > 0 && (
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2 sm:gap-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
              {/* Ver detalles */}
              <button
                onClick={() => { window.location.href = `/products/${product._id}`; }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/95 rounded-full flex items-center justify-center shadow-lg active:scale-90 sm:hover:bg-surface-container transition-all"
                title="Ver detalles"
              >
                <Eye className="text-[11px] sm:text-base" />
              </button>

              {/* Botón de carrito — mobile abre panel exterior, desktop navega a detalle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(product._id);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/95 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                title="Agregar al carrito"
              >
                <ShoppingCart className="text-[11px] sm:text-base" />
              </button>
            </div>
          )}
        </div>

        {/* Info section — más aire para cards más grandes */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-start justify-between gap-2">
          <h3 className="font-body text-sm sm:text-base font-medium text-on-surface line-clamp-2 leading-snug min-w-0">
            {product.name}
          </h3>
          <p className="font-serif text-base sm:text-lg text-primary font-bold whitespace-nowrap flex-shrink-0">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </Link>
    </div>
  );
}

export const ProductCardGridMemo = memo(ProductCardGrid, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.price === next.product.price &&
  prev.product.name === next.product.name &&
  prev.product.images?.join() === next.product.images?.join() &&
  prev.showQuickActions === next.showQuickActions
);
