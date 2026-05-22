import { Link } from "react-router-dom";
import { Loader2, ShoppingBag } from '@/components/icons';
import { BackButton } from "@/components/ui/BackButton";
import {
  useCartItems,
  useCartTotal,
  useCartItemCount,
  useCartIsLoading,
  useCartError,
  useCartStore,
} from "@/store/cart";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CartItemCard } from "@/components/ui/CartItemCard";
import { Footer } from "@/components/layout/Footer";
import { showToast } from "@/components/ui/Toast";
import { ShippingEstimate } from "@/components/checkout/ShippingEstimate";
import { PendingPaymentBanner } from "@/components/checkout/PendingPaymentBanner";

export function CartPage() {
  const items = useCartItems();
  const cartTotal = useCartTotal();
  const cartItemCount = useCartItemCount();
  const isLoading = useCartIsLoading();
  const error = useCartError();
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[600px] bg-background">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 mt-8 sm:mt-12">
          <div className="p-4 bg-primary-container text-on-primary rounded-lg text-center">
            Error al cargar el carrito. Por favor, intentá de nuevo.
          </div>
          <div className="text-center mt-6">
            <BackButton label="Volver" showLabelOnMobile={true} />
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
          <header className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mt-8 sm:mt-10">
                Tu carrito
              </h1>
              <BackButton label="Volver" showLabelOnMobile={true} />
            </div>
            <p className="font-label text-sm uppercase tracking-[0.2em] text-on-surface-variant">
              Todavía no agregaste productos
            </p>
          </header>
          <div className="text-center py-12 sm:py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-container flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-on-surface-variant" />
            </div>
            <p className="text-on-surface-variant mb-6 sm:mb-8 max-w-md mx-auto">
              Explorá la colección y agregá piezas desde la tienda o el detalle de cada producto.
            </p>
            <Link to="/products">
              <button className="bg-primary text-on-primary px-6 sm:px-8 py-3 rounded-lg font-label font-bold uppercase tracking-widest hover:bg-primary-container transition-colors min-h-[44px]">
                Ver productos
              </button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-32 lg:pb-16 overflow-visible">
        <div className="h-16 lg:h-20" />
        <div className="text-center mt-6">
          <BackButton label="Volver" showLabelOnMobile={true} page="cart" />
        </div>

        <header className="mb-8 sm:mb-12 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3 sm:mb-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight animate-fade-in">
                Tu carrito
              </h1>
              <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant animate-fade-in mt-2">
                {cartItemCount} {cartItemCount === 1 ? "artículo" : "artículos"}
              </p>
            </div>
            <Link
              to="/products"
              className="font-label text-xs uppercase tracking-widest text-primary hover:underline"
            >
              Seguir comprando
            </Link>
          </div>
        </header>

        <PendingPaymentBanner className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-8 space-y-2">
            {items.map((item, index) => (
              <div
                key={item._id || item.productId}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CartItemCard item={item} />
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4">
            <div className="animate-fade-in lg:sticky lg:top-28" style={{ animationDelay: '200ms' }}>
              <div className="bg-surface-container-low p-6 sm:p-8 rounded-xl border border-outline-variant/20">
                <h2 className="font-serif text-xl sm:text-2xl font-bold mb-6">
                  Resumen
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-body text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-serif text-on-surface">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body text-on-surface-variant text-sm">
                    <span>Envío</span>
                    <span>Se calcula en checkout</span>
                  </div>
                </div>

                <ShippingEstimate subtotal={cartTotal} compact />

                <div className="pt-4 mt-4 border-t border-dashed border-outline-variant/40 flex justify-between items-center mb-6">
                  <span className="font-label text-xs uppercase tracking-widest font-bold">
                    Subtotal
                  </span>
                  <span className="font-serif text-2xl font-bold text-primary">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <Link to="/checkout" className="block">
                  <button className="w-full bg-primary text-on-primary py-4 font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-primary-container transition-colors shadow-sm min-h-[44px] rounded-lg">
                    Finalizar compra
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Vaciar el carrito?")) {
                      useCartStore.getState().clearCart();
                      showToast({ type: 'success', title: 'Carrito vaciado' });
                    }
                  }}
                  className="mt-6 font-label text-xs uppercase tracking-widest text-terracota-600 border-b border-dashed border-terracota-600/40 pb-1 hover:border-terracota-600 transition-all"
                >
                  Vaciar carrito
                </button>

                <div className="mt-6 space-y-3 text-xs text-on-surface-variant">
                  <p>CP 4512: envío local gratis o retiro en punto de entrega. Pago por transferencia con GalioPay.</p>
                  <p>Envío neutro en carbono en pedidos sobre $300.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-outline-variant/20 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label">
              {cartItemCount} {cartItemCount === 1 ? 'artículo' : 'artículos'}
            </p>
            <p className="text-lg font-serif text-primary">${cartTotal.toFixed(2)}</p>
          </div>
          <Link to="/checkout" className="shrink-0">
            <button className="bg-primary text-on-primary px-5 py-3 rounded-lg font-label text-xs uppercase tracking-wider font-bold min-h-[44px]">
              Checkout
            </button>
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
