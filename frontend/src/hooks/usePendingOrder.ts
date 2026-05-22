import { useCallback, useEffect, useState } from 'react';
import { checkoutApi, type PendingOrderInfo } from '@/lib/api';

const PENDING_ORDER_STORAGE_KEY = 'kioto:pending-order-id';

export function clearStoredPendingOrderId(orderId?: string) {
  const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
  if (!stored) return;
  if (!orderId || stored === orderId) {
    sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
  }
}

export function usePendingOrder(options?: { pollMs?: number; enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const pollMs = options?.pollMs ?? 15_000;
  const [pending, setPending] = useState<PendingOrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return null;

    try {
      let data = await checkoutApi.getPendingOrder();

      if (!data) {
        const storedOrderId = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
        if (storedOrderId) {
          try {
            const status = await checkoutApi.getOrderStatus(storedOrderId);
            if (status.status === 'paid' || status.status === 'failed') {
              clearStoredPendingOrderId(storedOrderId);
            } else if (status.canResume && (status.secondsRemaining ?? 0) > 0) {
              data = {
                orderId: storedOrderId,
                total: status.total,
                subtotal: status.total,
                shipping: 0,
                paymentUrl: status.paymentUrl,
                deliveryMethod: status.deliveryMethod,
                expiresAt: status.expiresAt ?? new Date(Date.now() + 15 * 60_000).toISOString(),
                ttlMinutes: 15,
                minutesRemaining: Math.ceil((status.secondsRemaining ?? 0) / 60),
                secondsRemaining: status.secondsRemaining ?? 0,
                matchesCart: true,
              };
            }
          } catch {
            // Ignore fallback errors and keep pending null.
          }
        }
      }

      setPending(data);
      setSecondsRemaining(data?.secondsRemaining ?? 0);
      setError(null);

      if (data?.orderId) {
        sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, data.orderId);
      } else {
        clearStoredPendingOrderId();
      }

      return data;
    } catch {
      setError('No se pudo cargar el pago pendiente');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, pollMs);

    const handleReturn = () => {
      void refresh();
    };

    window.addEventListener('pageshow', handleReturn);
    window.addEventListener('focus', handleReturn);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      }
    });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pageshow', handleReturn);
      window.removeEventListener('focus', handleReturn);
    };
  }, [enabled, pollMs, refresh]);

  useEffect(() => {
    if (!pending || secondsRemaining <= 0) return;

    const tick = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [pending?.orderId, secondsRemaining]);

  useEffect(() => {
    if (pending?.secondsRemaining != null) {
      setSecondsRemaining(pending.secondsRemaining);
    }
  }, [pending?.secondsRemaining]);

  const resumePayment = useCallback(async () => {
    const orderId = pending?.orderId || sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (!orderId) return null;

    const result = await checkoutApi.resumePayment(orderId);
    await refresh();
    return result.paymentUrl;
  }, [pending?.orderId, refresh]);

  return {
    pending: pending && secondsRemaining > 0 ? { ...pending, secondsRemaining } : null,
    isLoading,
    error,
    secondsRemaining,
    refresh,
    resumePayment,
  };
}

export function formatPaymentCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
