import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from '@/components/icons';
import { BackButton } from "@/components/ui/BackButton";
import {
  useCartItems,
  useCartTotal,
  useCartItemCount,
  useCartIsLoading,
  useCartError,
  useCartStore,
} from "@/store/cart";
import { useState } from "react";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CartItemCard } from "@/components/ui/CartItemCard";
import { Footer } from "@/components/layout/Footer";
import { showToast } from "@/components/ui/Toast";

export function CartPage() {
  const items = useCartItems();
  const cartTotal = useCartTotal();
  const cartItemCount = useCartItemCount();
  const isLoading = useCartIsLoading();
  const error = useCartError();
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    fetchCart();
  }, []); // Empty deps - fetch only on mount

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
            Error al cargar el carrito. Por favor, intenta de nuevo.
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
                Canastas
              </h1>
              <div className="flex items-center gap-2 sm:gap-4">
                  <BackButton 
                    label="Volver" 
                    showLabelOnMobile={true}
                  />
              </div>
            </div>
            <p className="font-label text-sm uppercase tracking-[0.2em] text-on-surface-variant">
              Tu carrito está vacío
            </p>
          </header>
          <div className="text-center py-12 sm:py-16 animate-fade-in">
            <p className="text-on-surface-variant mb-6 sm:mb-8 max-w-md mx-auto">
              No tienes productos en tu carrito. Explora nuestra selección de canastas y
            </p>
            <Link to="/products">
              <button className="bg-primary text-on-primary px-6 sm:px-8 py-3 rounded-lg font-label font-bold uppercase tracking-widest hover:bg-primary-container transition-colors animate-fade-in min-h-[44px]" style={{ animationDelay: '200ms' }}>
                Ver Productos
              </button>
            </Link>
          </div>
        </main>
        <Footer />
        {/* <BottomNav /> */}
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-32 overflow-visible">
        {/* Spacer for fixed header */}
        <div className="h-16 lg:h-20"></div>
        <div className="text-center mt-6">
            <BackButton label="Volver" showLabelOnMobile={true} page='cart' />
          </div>
        <header className="mb-8 sm:mb-12 mt-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight animate-fade-in">
              Canastas
            </h1>
          </div>
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant animate-fade-in" style={{ animationDelay: '100ms' }}>
            {cartItemCount} {cartItemCount === 1 ? "artículo" : "artículos"} en
            tu carrito
          </p>
         </header>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
             {/* Cart Items List */}
             <div className="lg:col-span-8 space-y-8 sm:space-y-12">
               {items.map((item, index) => {
                 const key = (item as any)._id || item.productId;
                 return (
                   <div
                     key={key}
                     className="animate-fade-in"
                     style={{ animationDelay: `${index * 100}ms` }}
                   >
                     <CartItemCard item={item} />
                   </div>
                 );
               })}
             </div>

{/* Order Summary - Below on mobile */}
             <aside className="lg:col-span-4">
               <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                 <div className="bg-surface-container-low p-6 sm:p-8 rounded-xl border-l border-outline-variant/40">
                 <h2 className="font-serif text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
                   Resumen del pedido
                 </h2>

                 <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                   <div className="flex justify-between font-body text-on-surface-variant">
                     <span>Subtotal</span>
                     <span className="font-serif text-on-surface">
                       ${cartTotal.toFixed(2)}
                     </span>
                   </div>
                   <div className="flex justify-between font-body text-on-surface-variant">
                     <span>Envío</span>
                     <span className="font-serif text-on-surface text-xs">
                       Calculado en el siguiente paso
                     </span>
                   </div>
                   <div className="flex justify-between font-body text-on-surface-variant">
                     <span>Impuestos</span>
                     <span className="font-serif text-on-surface">$0.00</span>
                   </div>
                   <div className="pt-3 sm:pt-4 border-t border-dashed border-outline-variant/40 flex justify-between items-center">
                     <span className="font-label text-xs uppercase tracking-widest font-bold">
                       Total
                     </span>
                     <span className="font-serif text-2xl sm:text-3xl font-bold text-primary">
                       ${cartTotal.toFixed(2)}
                     </span>
                   </div>
                 </div>

                 <Link to="/checkout">
                   <button className="w-full bg-primary text-on-primary py-4 sm:py-5  font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-primary-container transition-colors shadow-sm min-h-[44px]">
                     Ir a pagar
                   </button>
                 </Link>

                 <div className="mt-6 sm:mt-8 space-y-4">
<button
                     onClick={() => {
                       if (confirm("¿Vaciar el carrito?")) {
                         useCartStore.getState().clearCart();
                         showToast({ type: 'success', title: 'Carrito vaciado' });
                       }
                     }}
                     className="font-label text-xs uppercase tracking-widest text-terracota-600 border-b border-dashed border-terracota-600/40 pb-1 hover:border-terracota-600 transition-all min-h-[44px]"
                   >
                     Vaciar Carrito
                   </button>
                 </div>

                 <div className="mt-6 sm:mt-8 space-y-4">
                   <div className="flex items-start gap-3">
                     <span className="material-symbols-outlined text-primary text-lg">
                       local_shipping
                     </span>
                     <p className="font-body text-xs text-on-surface-variant">
                       Envío neutro en carbono complementario en pedidos sobre
                       $300.
                     </p>
                   </div>
                   <div className="flex items-start gap-3">
                     <span className="material-symbols-outlined text-primary text-lg">
                       verified
                     </span>
                     <p className="font-body text-xs text-on-surface-variant">
                       Fabricado éticamente con garantía de reparación de por
                       vida.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Promo Code Section */}
               <div className="mt-6 px-2 sm:px-4">
                 <details className="group">
                   <summary className="list-none flex items-center justify-between cursor-pointer font-label text-xs uppercase tracking-widest text-on-surface-variant group-open:mb-4 min-h-[44px]">
                     <span>¿Tienes un código promocional?</span>
                     <span className="material-symbols-outlined group-open:rotate-180 transition-transform">
                       expand_more
                     </span>
                   </summary>
                   <div className="flex gap-2">
                     <input
                       className="flex-1 bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-sm font-body px-0 py-2"
                       placeholder="Ingresa código"
                       type="text"
                       inputMode="text"
                     />
                     <button className="font-label text-xs uppercase tracking-widest text-primary font-bold min-h-[44px]">
                       Aplicar
                     </button>
                   </div>
                 </details>
               </div>
             </div>
           </aside>
         </div>
       </main>
       <Footer />
       {/* <BottomNav /> */}
     </>
   );
}
