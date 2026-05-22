import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { X } from '@/components/icons';

export function CheckoutCancelPage() {
  return (
    <>
      <PublicHeader />

      <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <X className="h-16 w-16 text-terracota-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-on-surface mb-4">
            Pago cancelado
          </h1>
          <p className="text-on-surface-variant mb-8">
            No se procesó el pago. Tu carrito sigue disponible para que puedas completar la compra cuando quieras.
          </p>
          <div className="space-y-4">
            <Link to="/cart">
              <Button size="lg" className="w-full">
                Volver al carrito
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full">
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
