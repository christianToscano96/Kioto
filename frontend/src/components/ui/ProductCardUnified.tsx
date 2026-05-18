import { useState, useCallback } from "react";
import { useCartStore } from "../../store/cart";
import { useToast } from "./Toast";
import { useProductStock } from "../../hooks/useProductStock";
import { ProductCardGrid } from "./ProductCardGrid";
import { ProductCardList } from "./ProductCardList";
import type { Product } from "../../../../shared/src";

interface ProductCardUnifiedProps {
  product: Product;
  variant?: "grid" | "list" | "compact";
  showQuickActions?: boolean;
  /** Se dispara al tocar el botón de carrito — la página decide si abre sidebar o bottom sheet */
  onAddToCart: (productId: string) => void;
}

export function ProductCardUnified({
  product,
  variant = "grid",
  showQuickActions = true,
  onAddToCart,
}: ProductCardUnifiedProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const { addToast } = useToast();

  // ── estado local ──────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // ── derivados ─────────────────────────────────────────────
  const images = product.images || [];
  const availableSizes = product?.variants?.map(v => v.size) || product?.sizes || [];
  const availableColors = product?.colors || [];

  const { totalStock, getVariantStock, hasVariants } = useProductStock(product);
  const hasSizes = availableSizes.length > 0;

  // ── acciones ──────────────────────────────────────────────
  const handleAddToCart = useCallback(async (
    selectedSize: string,
    selectedColor: string,
    quantity: number,
    onSuccess?: () => void,
  ) => {
    if (hasSizes && !selectedSize) return;

    try {
      await addToCart(product, quantity, selectedSize, selectedColor);
      addToast({
        type: 'success',
        title: '¡Agregado!',
        message: `${product.name} fue agregado al carrito`,
      });
      onSuccess?.();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo agregar al carrito',
      });
    }
  }, [addToCart, addToast, hasSizes, product]);

  // ── delegación por variante ────────────────────────────────
  if (variant === "list") {
    return (
      <ProductCardList
        product={product}
        showQuickActions={showQuickActions}
        totalStock={totalStock}
        availableSizes={availableSizes}
        hasSizes={hasSizes}
        onAddToCart={onAddToCart}
      />
    );
  }

  // Grid / Compact
  return (
    <ProductCardGrid
      product={product}
      showQuickActions={showQuickActions}
      currentImageIndex={currentImageIndex}
      imageError={imageError}
      setCurrentImageIndex={setCurrentImageIndex}
      setImageError={setImageError}
      images={images}
      availableSizes={availableSizes}
      availableColors={availableColors}
      totalStock={totalStock}
      getVariantStock={getVariantStock}
      hasVariants={hasVariants}
      availableStock={totalStock}
      handleAddToCart={handleAddToCart}
      hasSizes={hasSizes}
      onAddToCart={onAddToCart}
    />
  );
}
