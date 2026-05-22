import type { Order, OrderStatus, PaymentFailureReason } from '@shared/index';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const PAYMENT_FAILURE_LABELS: Record<PaymentFailureReason, string> = {
  expired: 'Expirado',
  rejected: 'Rechazado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
};

export function getOrderStatusLabel(
  status: OrderStatus,
  paymentFailureReason?: PaymentFailureReason,
): string {
  if (status === 'failed' && paymentFailureReason) {
    return PAYMENT_FAILURE_LABELS[paymentFailureReason] ?? ORDER_STATUS_LABELS.failed;
  }
  return ORDER_STATUS_LABELS[status];
}

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-terracota-100 text-terracota-800',
  paid: 'bg-verde-bosque-100 text-verde-bosque-800',
  failed: 'bg-error-container text-error',
  processing: 'bg-primary-container text-on-primary-container',
  shipped: 'bg-secondary-container text-on-secondary-container',
  delivered: 'bg-verde-bosque-600 text-white',
  cancelled: 'bg-terracota-600 text-white',
};
