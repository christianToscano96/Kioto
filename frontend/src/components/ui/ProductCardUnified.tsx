import { useState, useCallback, memo } from 'react';
import { useCartStore } from '../../store/cart';
import { useToast } from './Toast';
import { useProductStock } from '../../hooks/useProductStock';
import { ProductCardGrid } from './ProductCardGrid';
import { ProductCardList } from './ProductCardList';
import type { Product } from '@shared/index';

interface ProductCardUnifiedProps {
  product: Product;
  variant?: 'grid' | 'list' | 'compact';
  showQuickActions?: boolean;
  onAddToCart: (productId: string) => void;
}

export function ProductCardUnified({
  product,
  variant = 'grid',
  showQuickActions = true,
  onAddToCart,
}: ProductCardUnifiedProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const { addToast } = useToast();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const images = product.images || [];
  const {
    inventoryMode,
    totalStock,
    sizes,
    getSizeStock,
    getAvailableColors,
  } = useProductStock(product);

  const hasSizes = inventoryMode === 'size_color';
  const availableSizes = sizes;
  const availableColors = inventoryMode === 'color'
    ? getAvailableColors()
    : [];

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

  if (variant === 'list') {
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
      getVariantStock={getSizeStock}
      hasVariants={hasSizes}
      availableStock={totalStock}
      handleAddToCart={handleAddToCart}
      hasSizes={hasSizes}
      onAddToCart={onAddToCart}
    />
  );
}

export default memo(ProductCardUnified, (prevProps, nextProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.inventoryMode === nextProps.product.inventoryMode &&
    prevProps.variant === nextProps.variant &&
    prevProps.showQuickActions === nextProps.showQuickActions
  );
});
