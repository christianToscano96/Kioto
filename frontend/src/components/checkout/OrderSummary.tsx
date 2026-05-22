import type { CartItem } from '../../../../shared/src/index';
import { formatShippingQuote, type DeliveryMethod, type ShippingQuote } from '@shared/index';

interface OrderItemProps {
  item: CartItem;
}

export function OrderItem({ item }: OrderItemProps) {
  const product = item.product;
  
  return (
    <div className="flex gap-6 items-start">
      <div className="w-24 h-32 bg-surface-container rounded-lg overflow-hidden">
        {product && product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="font-serif text-lg mb-1">{product?.name || 'Producto'}</p>
        {item.size && (
          <p className="font-label text-xs uppercase tracking-widest text-on-surface/60 mb-1">
            Talla: {item.size}
          </p>
        )}
        {item.color && (
          <p className="font-label text-xs uppercase tracking-widest text-on-surface/60 mb-1">
            Color: {item.color}
          </p>
        )}
        <p className="font-label text-xs uppercase tracking-widest text-on-surface/60 mb-4">
          Cantidad: {item.quantity}
        </p>
        <p className="font-serif text-lg text-primary">${item.price.toFixed(2)}</p>
      </div>
    </div>
  );
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingQuote?: ShippingQuote;
  deliveryMethod?: DeliveryMethod;
  total: number;
}

export function OrderSummary({
  items,
  subtotal,
  shippingQuote,
  deliveryMethod,
  total,
}: OrderSummaryProps) {
  const shippingDisplay = shippingQuote
    ? formatShippingQuote(shippingQuote)
    : 'Calculado en el siguiente paso';

  return (
    <aside className="lg:col-span-5 sticky top-32 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="bg-surface-container p-8 lg:p-10 border-l border-outline-variant/40">
        <h2 className="font-serif text-2xl mb-10">Resumen del Pedido</h2>
        
        <div className="space-y-8 mb-12">
          {items.map((item, index) => (
            <div
              key={item._id || item.product?._id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <OrderItem item={item} />
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-dashed border-outline-variant/40 pt-8">
          <div className="flex justify-between font-label text-sm uppercase tracking-widest">
            <span className="text-on-surface/60">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-label text-sm uppercase tracking-widest">
            <span className="text-on-surface/60">Envío</span>
            <span>{shippingDisplay}</span>
          </div>
          {shippingQuote?.label && (
            <p className="text-xs text-on-surface-variant">{shippingQuote.label}</p>
          )}
          {deliveryMethod === 'pickup' && (
            <p className="text-xs text-primary">Retiro en punto de entrega</p>
          )}
          <div className="flex justify-between font-serif text-xl pt-4">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}