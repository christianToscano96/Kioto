import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { X, Loader2, Clock, CheckCircle, AlertCircle } from '@/components/icons';
import { checkoutApi } from '@/lib/api';
import { formatPaymentCountdown } from '@/hooks/usePendingOrder';
import { showToast } from '@/components/ui/Toast';

type CancelView = 'loading' | 'pending' | 'paid' | 'expired' | 'failed' | 'generic';

export function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const [view, setView] = useState<CancelView>(orderId ? 'loading' : 'generic');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setView('generic');
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await checkoutApi.getOrderStatus(orderId);
        if (cancelled) return;

        setTotal(status.total);
        setSecondsRemaining(status.secondsRemaining ?? 0);

        if (status.status === 'paid') {
          setView('paid');
          return;
        }

        if (status.status === 'failed' || status.reason === 'expired') {
          setView('expired');
          return;
        }

        if (status.status === 'pending' && status.canResume) {
          setView('pending');
          return;
        }

        if (status.status === 'failed') {
          setView('failed');
          return;
        }

        setView('generic');
      } catch {
        if (!cancelled) setView('generic');
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (view !== 'pending' || secondsRemaining <= 0) return;

    const tick = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          setView('expired');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [view, secondsRemaining]);

  const handleResumePayment = async () => {
    if (!orderId) return;

    setIsResuming(true);
    try {
      const result = await checkoutApi.resumePayment(orderId);
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      showToast({
        type: 'error',
        title: 'No se pudo generar el link de pago',
      });
    } catch {
      setView('expired');
      showToast({
        type: 'error',
        title: 'El tiempo para pagar expiró',
        message: 'Volvé al carrito e iniciá checkout de nuevo.',
      });
    } finally {
      setIsResuming(false);
    }
  };

  if (view === 'loading') {
    return (
      <>
        <PublicHeader />
        <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (view === 'paid') {
    return (
      <>
        <PublicHeader />
        <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-on-surface mb-4">
              Pago confirmado
            </h1>
            <p className="text-on-surface-variant mb-8">
              Este pedido ya fue pagado. Te llevamos al resumen de la compra.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/checkout/success?orderId=${orderId}`)}
            >
              Ver confirmación
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (view === 'pending') {
    return (
      <>
        <PublicHeader />
        <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <Clock className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-on-surface mb-4">
              Pago no completado
            </h1>
            <p className="text-on-surface-variant mb-4">
              Tu carrito sigue reservado. Podés retomar el pago antes de que expire el link.
            </p>
            {total != null ? (
              <p className="mb-2 font-serif text-xl text-primary">${total.toFixed(2)}</p>
            ) : null}
            <p className="mb-8 font-mono text-sm text-on-surface-variant">
              Tiempo restante: {formatPaymentCountdown(secondsRemaining)}
            </p>
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full"
                disabled={isResuming}
                onClick={() => void handleResumePayment()}
              >
                {isResuming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando link...
                  </>
                ) : (
                  'Reintentar pago'
                )}
              </Button>
              <Link to="/cart">
                <Button variant="outline" className="w-full">
                  Volver al carrito
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (view === 'expired' || view === 'failed') {
    return (
      <>
        <PublicHeader />
        <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <AlertCircle className="mx-auto mb-6 h-16 w-16 text-terracota-600" />
            <h1 className="text-3xl font-serif font-bold text-on-surface mb-4">
              {view === 'expired' ? 'Link de pago expirado' : 'Pago no completado'}
            </h1>
            <p className="text-on-surface-variant mb-8">
              {view === 'expired'
                ? 'Pasaron 15 minutos sin confirmar el pago. Volvé al carrito e iniciá checkout de nuevo.'
                : 'No se pudo procesar el pago. Tu carrito sigue disponible para intentarlo otra vez.'}
            </p>
            <div className="space-y-4">
              <Link to="/cart">
                <Button size="lg" className="w-full">
                  Volver al carrito
                </Button>
              </Link>
              <Link to="/checkout">
                <Button variant="outline" className="w-full">
                  Ir a checkout
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
