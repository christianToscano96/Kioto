import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart";
import { LazyVideo } from '@/components/ui/LazyVideo';
import { Loader2, ShoppingBag } from '@/components/icons';
import { PICKUP_POINT } from '@shared/index';
import { api } from "@/lib/api";

type PaymentStatus = 'confirming' | 'paid' | 'pending';

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const delivery = searchParams.get("delivery");
  const clear = useCartStore((state) => state.clear);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('confirming');

  useEffect(() => {
    if (paymentStatus === 'paid') {
      clear();
    }
  }, [paymentStatus, clear]);

  useEffect(() => {
    if (!orderId) {
      setPaymentStatus('pending');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const syncPayment = async () => {
      try {
        await api.post(`/checkout/order/${orderId}/confirm-payment`, {
          paymentId: searchParams.get('paymentId') || undefined,
        });
      } catch {
        // Webhook may still confirm the payment.
      }
    };

    const pollStatus = async () => {
      if (cancelled) return;

      try {
        const response = await api.get(`/checkout/order/${orderId}/status`);
        const status = response.data?.status;

        if (status === 'paid') {
          setPaymentStatus('paid');
          return;
        }

        if (status === 'failed') {
          setPaymentStatus('pending');
          return;
        }
      } catch {
        // Keep polling while payment confirmation is in progress.
      }

      attempts += 1;
      if (attempts < 15 && !cancelled) {
        window.setTimeout(pollStatus, 2000);
        return;
      }

      setPaymentStatus('pending');
    };

    void syncPayment().finally(() => {
      void pollStatus();
    });

    return () => {
      cancelled = true;
    };
  }, [orderId, searchParams]);

  const isPickup = delivery === 'pickup';

  return (
    <>
      <PublicHeader />

      <main className="max-w-screen-2xl mx-auto px-4 py-20 mt-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative w-64 h-64 mx-auto mb-8 rounded-full overflow-hidden bg-primary-container animate-fade-in">
            <LazyVideo
              src="/assets/success.webm"
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-on-surface mb-4">
            {paymentStatus === 'confirming'
              ? 'Confirmando tu pago...'
              : paymentStatus === 'paid'
                ? '¡Gracias por tu compra!'
                : 'Pedido registrado'}
          </h1>

          {paymentStatus === 'confirming' && (
            <div className="flex justify-center mb-4">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          )}

          <p className="text-on-surface-variant text-lg mb-2">
            {paymentStatus === 'paid'
              ? 'Tu pago fue confirmado. Estamos preparando tu pedido.'
              : paymentStatus === 'confirming'
                ? 'Estamos verificando el pago con GalioPay.'
                : 'Recibimos tu pedido. Te avisaremos por email cuando se confirme el pago.'}
          </p>

          {orderId && (
            <p className="text-on-surface-variant mb-8">
              Número de orden: <strong className="text-on-surface">#{orderId.slice(-8).toUpperCase()}</strong>
            </p>
          )}

          {isPickup && paymentStatus === 'paid' && (
            <div className="text-left rounded-xl border border-outline-variant/30 bg-surface-container p-6 mb-8 space-y-2 text-sm text-on-surface-variant">
              <p className="font-medium text-on-surface">Retiro en punto de entrega</p>
              <p>{PICKUP_POINT.name}</p>
              <p>{PICKUP_POINT.address}</p>
              <p>{PICKUP_POINT.hours}</p>
              <p className="text-primary pt-2">{PICKUP_POINT.notes}</p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-medium px-8 py-3.5 rounded-full hover:bg-primary-hover transition-colors"
            >
              <ShoppingBag size={20} />
              Seguir comprando
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
