import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart";
import { LazyVideo } from '@/components/ui/LazyVideo';
import { ShoppingBag } from '@/components/icons';

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const clear = useCartStore((state) => state.clear);

  // Clear cart on mount
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <>
      <PublicHeader />
      
      <main className="max-w-screen-2xl mx-auto px-4 py-20 mt-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Video */}
          <div className="relative w-64 h-64 mx-auto mb-8 rounded-full overflow-hidden bg-primary-container animate-fade-in">
            <LazyVideo
              src="/assets/success.webm"
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-on-surface mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            ¡Gracias por tu compra!
          </h1>
          
          <p className="text-on-surface-variant text-lg mb-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            Tu pedido ha sido recibido y está siendo procesado.
          </p>
          
          {orderId && (
            <p className="text-on-surface-variant mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
              Número de orden: <strong className="text-on-surface">#{orderId.slice(-8)}</strong>
            </p>
          )}

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-medium px-8 py-3.5 rounded-full hover:bg-primary-hover transition-colors"
            >
              <ShoppingBag size={20} />
              Seguir Comprando
            </Link>
            
            <div>
              <Link
                to="/"
                className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              >
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}