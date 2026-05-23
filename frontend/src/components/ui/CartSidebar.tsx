import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import {
  useQuickAddSidebar,
  useSetSidebarSize,
  useSetSidebarColor,
  useSetSidebarQuantity,
  useResetSidebar,
} from '@/store/ui';
import type { Product } from '@shared/index';
import { getQuickAddError } from '@/lib/quickAddStock';
import {
  ADD_TO_CART_FAILURE_MESSAGE,
  getAddToCartSuccessToast,
  getResolvedSelection,
} from '@/lib/variantSelection';
import { ProductVariantPicker } from '@/components/ui/ProductVariantPicker';

interface CartSidebarProps {
  products: Product[] | undefined;
}

export function CartSidebar({ products }: CartSidebarProps) {
  const state = useQuickAddSidebar();
  const addToCart = useCartStore((s) => s.addToCart);
  const { addToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const setSidebarSize = useSetSidebarSize();
  const setSidebarColor = useSetSidebarColor();
  const setSidebarQuantity = useSetSidebarQuantity();
  const resetSidebar = useResetSidebar();

  const product = useMemo(
    () => products?.find((p) => p._id === state.productId),
    [products, state.productId],
  );

  const images = useMemo(() => product?.images || [], [product?.images]);

  const handleSubmit = useCallback(async () => {
    if (!product) return;
    const error = getQuickAddError(product, state);
    if (error) {
      addToast({ type: 'error', title: error });
      return;
    }

    const { size, color } = getResolvedSelection(product, state);

    try {
      await addToCart(product, state.quantity, size, color);
      const successToast = getAddToCartSuccessToast(product, state);
      addToast({ type: 'success', ...successToast });
      resetSidebar();
      setCurrentImageIndex(0);
    } catch {
      addToast({ type: 'error', title: ADD_TO_CART_FAILURE_MESSAGE });
    }
  }, [product, state, addToCart, addToast, resetSidebar]);

  if (!product) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-outline-variant/20 min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{product.name}</p>
            <p className="text-sm text-on-surface-variant font-label">${product.price.toFixed(2)}</p>
          </div>
        </div>
        <Link
          to={`/products/${product._id}`}
          onClick={resetSidebar}
          className="shrink-0 text-[10px] uppercase tracking-wider text-primary font-label hover:underline"
        >
          Ver detalle
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {images.length > 0 && (
          <div className="space-y-2">
            <Link
              to={`/products/${product._id}`}
              onClick={resetSidebar}
              className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container"
            >
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - imagen ${currentImageIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </Link>
          </div>
        )}

        <ProductVariantPicker
          product={product}
          selection={{
            selectedSize: state.selectedSize,
            selectedColor: state.selectedColor,
            quantity: state.quantity,
          }}
          onSizeChange={setSidebarSize}
          onColorChange={setSidebarColor}
          onQuantityChange={setSidebarQuantity}
          onSubmit={handleSubmit}
          layout="compact"
        />
      </div>
    </div>
  );
}
