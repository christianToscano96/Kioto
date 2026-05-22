import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, Loader2 } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { formatPaymentCountdown, usePendingOrder } from '@/hooks/usePendingOrder';
import { showToast } from '@/components/ui/Toast';

type PendingPaymentBannerProps = {
  className?: string;
  variant?: 'cart' | 'checkout';
};

export function PendingPaymentBanner({
  className = '',
  variant = 'cart',
}: PendingPaymentBannerProps) {
  const { pending, isLoading, secondsRemaining, resumePayment } = usePendingOrder();
  const [isResuming, setIsResuming] = useState(false);

  if (isLoading || !pending) {
    return null;
  }

  const handleContinue = async () => {
    setIsResuming(true);
    try {
      const paymentUrl = await resumePayment();

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      if (pending.paymentUrl) {
        window.location.href = pending.paymentUrl;
        return;
      }

      showToast({
        type: 'error',
        title: 'No se pudo abrir el pago',
        message: 'Intentá de nuevo desde checkout.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'El link de pago expiró',
        message: 'Volvé a checkout para generar uno nuevo.',
      });
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-primary-container/40 p-4 sm:p-5 ${className}`}
      role="status"
      aria-live="polite"
    >
      {variant === 'checkout' ? (
        <div className="mb-4 border-b border-primary/20 pb-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracota-600/10">
              <AlertCircle className="h-5 w-5 text-terracota-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-on-surface sm:text-xl">
                Volviste sin completar el pago
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tu pedido sigue reservado. Retomalo con un clic; no hace falta volver a cargar los datos.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-widest text-primary">
              Pago pendiente
            </p>
            <p className="mt-1 font-body text-sm text-on-surface">
              {pending.matchesCart
                ? 'Tenés un pedido esperando pago. El link vence en'
                : 'Tenés un pago pendiente de otro pedido. El link vence en'}{' '}
              <span className="font-mono font-semibold text-primary">
                {formatPaymentCountdown(secondsRemaining)}
              </span>
              .
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Total: ${pending.total.toFixed(2)}
              {!pending.matchesCart ? ' · Si cambiaste el carrito, iniciá checkout de nuevo.' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[180px]">
          <Button
            type="button"
            className="w-full"
            disabled={isResuming}
            onClick={() => void handleContinue()}
          >
            {isResuming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abriendo pago...
              </>
            ) : (
              'Continuar pago'
            )}
          </Button>
          {!pending.matchesCart ? (
            <Link to="/checkout" className="text-center text-xs text-primary hover:underline">
              Ir a checkout
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
