import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart';
import {
  useQuickAddPanel,
  useSetQuickAddSize,
  useSetQuickAddColor,
  useSetQuickAddQuantity,
  useResetQuickAdd,
} from '@/store/ui';
import { useToast } from '@/components/ui/Toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProductVariantPicker } from '@/components/ui/ProductVariantPicker';
import { getQuickAddError } from '@/lib/quickAddStock';
import {
  ADD_TO_CART_FAILURE_MESSAGE,
  getAddToCartSuccessToast,
  getResolvedSelection,
} from '@/lib/variantSelection';
import type { Product } from '@shared/index';

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
      reset();
      setCurrentImageIndex(0);
    } catch {
      addToast({ type: 'error', title: ADD_TO_CART_FAILURE_MESSAGE });
    }
  }, [product, state, addToCart, addToast, reset]);

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
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{product.name}</p>
            <p className="text-sm text-on-surface-variant font-label">${product.price.toFixed(2)}</p>
          </div>
          <Link
            to={`/products/${product._id}`}
            onClick={handleClose}
            className="shrink-0 text-[10px] uppercase tracking-wider text-primary font-label hover:underline"
          >
            Ver detalle
          </Link>
        </div>
      }
      maxHeight="90%"
      closable
    >
      <div className="space-y-4 py-2">
        {images.length > 0 && (
          <div className="space-y-2">
            <Link
              to={`/products/${product._id}`}
              onClick={handleClose}
              className="relative block aspect-square rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20"
            >
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
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
          onSizeChange={setSize}
          onColorChange={setColor}
          onQuantityChange={setQuantity}
          onSubmit={handleSubmit}
          layout="compact"
        />
      </div>
    </BottomSheet>
  );
}
