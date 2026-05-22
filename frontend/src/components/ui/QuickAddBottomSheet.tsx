import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from '@/components/icons';
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
import { ProductAddToCartCta, ProductVariantPicker } from '@/components/ui/ProductVariantPicker';
import { getMaxStock, getQuickAddError } from '@/lib/quickAddStock';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () => products?.find((item) => item._id === state.productId),
    [products, state.productId],
  );

  const images = useMemo(() => product?.images || [], [product?.images]);

  const quickAddSelection = useMemo(
    () => ({
      selectedSize: state.selectedSize,
      selectedColor: state.selectedColor,
      quantity: state.quantity,
    }),
    [state.selectedColor, state.selectedSize, state.quantity],
  );

  const maxStock = useMemo(
    () => (product ? getMaxStock(product, quickAddSelection) : 0),
    [product, quickAddSelection],
  );

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

  useEffect(() => {
    if (!state.productId || (!state.selectedSize && !state.selectedColor)) return;

    const scrollContainer = scrollRef.current;
    const variantsNode = variantsRef.current;
    if (!scrollContainer || !variantsNode) return;

    requestAnimationFrame(() => {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const variantsTop = variantsNode.getBoundingClientRect().top;
      const offset = variantsTop - containerTop;

      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + offset - 8,
        behavior: 'smooth',
      });
    });
  }, [state.productId, state.selectedSize, state.selectedColor]);

  if (!enabled || !state.productId || !product) return null;

  const quantityDisabled = maxStock === 0;

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleClose}
      scrollContainerRef={scrollRef}
      title={
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xl font-medium">{product.name}</p>
            <p className="font-label text-sm text-on-surface-variant">${product.price.toFixed(2)}</p>
          </div>
          <Link
            to={`/products/${product._id}`}
            onClick={handleClose}
            className="shrink-0 font-label text-[10px] uppercase tracking-wider text-primary hover:underline"
          >
            Ver detalle
          </Link>
        </div>
      }
      maxHeight="92dvh"
      fullHeight
      closable
      contentClassName="pb-4 pt-1"
      footer={
        <div className="flex items-center justify-between px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, state.quantity - 1))}
              disabled={quantityDisabled || state.quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant transition-all active:scale-95 disabled:opacity-40"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{state.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxStock || 1, state.quantity + 1))}
              disabled={quantityDisabled || state.quantity >= (maxStock || 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant transition-all active:scale-95 disabled:opacity-40"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <ProductAddToCartCta
            product={product}
            selection={quickAddSelection}
            onSubmit={handleSubmit}
            short
            className="rounded-lg bg-primary px-5 py-2.5 font-label text-xs uppercase tracking-wider text-on-primary transition-all active:scale-95 disabled:opacity-40"
          />
        </div>
      }
    >
      <div className="space-y-4">
        {images.length > 0 && (
          <Link
            to={`/products/${product._id}`}
            onClick={handleClose}
            className="relative block aspect-[5/4] max-h-[32dvh] w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container"
          >
            <img
              src={images[currentImageIndex]}
              alt={`${product.name} - imagen ${currentImageIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </Link>
        )}

        <div ref={variantsRef}>
          <ProductVariantPicker
            product={product}
            selection={quickAddSelection}
            onSizeChange={setSize}
            onColorChange={setColor}
            onQuantityChange={setQuantity}
            onSubmit={handleSubmit}
            layout="compact"
            showSubmit={false}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
