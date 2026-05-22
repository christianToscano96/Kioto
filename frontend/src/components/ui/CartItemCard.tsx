import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import type { CartItem } from '@shared/index';
import { showToast } from '@/components/ui/Toast';
import { Plus, Minus, ImageOff, Loader2 } from '@/components/icons';

interface CartItemCardProps {
  item: CartItem;
}

function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  disabled,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= 1}
        className="w-9 h-9 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-50 rounded border border-outline-variant"
        aria-label="Disminuir cantidad"
      >
        <Minus size={14} />
      </button>
      <span className="text-on-surface font-bold text-sm min-w-[1.5ch] text-center tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className="w-9 h-9 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-50 rounded border border-outline-variant"
        aria-label="Aumentar cantidad"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function CartItemCard({ item }: CartItemCardProps) {
  const updateCartItem = useCartStore((state) => state.updateCartItem);
  const removeCartItem = useCartStore((state) => state.removeCartItem);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const cartItemId = item._id || item.productId;
  const product = item.product;
  const name = product?.name || 'Producto';
  const price = item.price || product?.price || 0;
  const lineTotal = price * item.quantity;
  const image = product?.images?.[0] ?? null;
  const size = item.size;
  const color = item.color;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateCartItem(cartItemId, newQuantity);
    } catch {
      showToast({ type: 'error', title: 'Error al actualizar cantidad' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await removeCartItem(cartItemId);
      showToast({ type: 'success', title: 'Producto eliminado' });
    } catch {
      showToast({ type: 'error', title: 'Error al eliminar producto' });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-dashed border-outline-variant/40">
      <Link
        to={`/products/${item.productId}`}
        className="w-24 sm:w-36 aspect-square bg-surface-container overflow-hidden rounded-lg shrink-0"
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant bg-surface-container-high">
            <ImageOff size={24} className="opacity-30" />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2">
            <Link to={`/products/${item.productId}`} className="min-w-0">
              <h3 className="text-base sm:text-xl font-serif leading-tight line-clamp-2 hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <p className="text-base sm:text-xl font-serif text-primary shrink-0">
              ${lineTotal.toFixed(2)}
            </p>
          </div>

          {(size || color) && (
            <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs uppercase tracking-widest text-on-surface-variant mb-3">
              {size && (
                <span>
                  Talla <strong className="text-on-surface">{size}</strong>
                </span>
              )}
              {color && (
                <span className="inline-flex items-center gap-1.5">
                  Color
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-outline-variant inline-block"
                    style={{ backgroundColor: color.startsWith('#') ? color : color }}
                  />
                  <strong className="text-on-surface">{color}</strong>
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <QuantitySelector
              quantity={item.quantity}
              onDecrease={() => handleQuantityChange(item.quantity - 1)}
              onIncrease={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating || isSyncing}
            />
            <p className="text-xs text-on-surface-variant hidden sm:block">
              ${price.toFixed(2)} c/u
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving || isSyncing}
          className="self-start mt-3 font-label text-[10px] sm:text-xs uppercase tracking-widest text-primary border-b border-dashed border-primary/40 pb-0.5 hover:border-primary transition-all disabled:opacity-50"
        >
          {isRemoving && <Loader2 size={10} className="animate-spin inline mr-1" />}
          {isRemoving ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}
