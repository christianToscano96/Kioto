import type { OrderStatus } from '@shared/index';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-terracota-100 text-terracota-800',
  paid: 'bg-verde-bosque-100 text-verde-bosque-800',
  failed: 'bg-error-container text-error',
  processing: 'bg-primary-container text-on-primary-container',
  shipped: 'bg-secondary-container text-on-secondary-container',
  delivered: 'bg-verde-bosque-600 text-white',
  cancelled: 'bg-terracota-600 text-white',
};
