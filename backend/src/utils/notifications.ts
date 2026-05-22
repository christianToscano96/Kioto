import { Notification, NotificationType } from '../models/notification';
import Order from '../models/Order';
import Product from '../models/Product';
import { emitNotification } from '../socket';
import type { PaymentFailureReason } from './galioPaymentStatus';

interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  productSnapshot?: { name: string; stock: number };
}

/**
 * Create a notification and emit via socket
 */
export const createNotification = async (data: CreateNotificationData) => {
  const notification = await Notification.create(data);
  
  // Emit via Socket.IO to all admins
  emitNotification(notification);
  
  return notification;
};

/**
 * Notify admin when payment is confirmed
 */
export const notifyOrderPaid = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  return createNotification({
    type: 'order',
    title: 'Pago confirmado',
    message: `Pedido #${order._id.toString().slice(-8)} pagado · $${order.total.toFixed(2)}`,
    orderId: order._id.toString(),
  });
};

const PAYMENT_FAILURE_COPY: Record<
  PaymentFailureReason,
  { title: string; message: (orderLabel: string, total: number) => string }
> = {
  expired: {
    title: 'Link de pago expirado',
    message: (orderLabel, total) =>
      `Pedido #${orderLabel} · el link de GalioPay venció (15 min) · $${total.toFixed(2)}`,
  },
  rejected: {
    title: 'Pago rechazado',
    message: (orderLabel, total) =>
      `Pedido #${orderLabel} · GalioPay rechazó el pago · $${total.toFixed(2)}`,
  },
  cancelled: {
    title: 'Pago cancelado',
    message: (orderLabel, total) =>
      `Pedido #${orderLabel} · el pago fue cancelado · $${total.toFixed(2)}`,
  },
  failed: {
    title: 'Pago no completado',
    message: (orderLabel, total) =>
      `Pedido #${orderLabel} · el pago no se concretó · $${total.toFixed(2)}`,
  },
};

/**
 * Notify admin when Galio payment fails or expires
 */
export const notifyOrderPaymentFailed = async (
  orderId: string,
  reason: PaymentFailureReason = 'failed',
) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  const orderLabel = order._id.toString().slice(-8);
  const copy = PAYMENT_FAILURE_COPY[reason] ?? PAYMENT_FAILURE_COPY.failed;

  return createNotification({
    type: 'order',
    title: copy.title,
    message: copy.message(orderLabel, order.total),
    orderId: order._id.toString(),
  });
};

/**
 * Notify admin of new pending checkout (optional, lightweight)
 */
export const notifyNewOrder = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  return createNotification({
    type: 'order',
    title: 'Checkout iniciado',
    message: `Pedido #${order._id.toString().slice(-8)} pendiente de pago · $${order.total.toFixed(2)}`,
    orderId: order._id.toString(),
  });
};

/**
 * Notify admin of low stock
 */
export const notifyLowStock = async (productId: string, currentStock: number) => {
  const product = await Product.findById(productId);
  if (!product) return;

  return createNotification({
    type: 'low_stock',
    title: 'Stock Bajo',
    message: `${product.name}: quedan ${currentStock} unidades`,
    productId: product._id.toString(),
    productSnapshot: {
      name: product.name,
      stock: currentStock,
    },
  });
};

/**
 * Notify admin of out of stock
 */
export const notifyOutOfStock = async (productId: string) => {
  const product = await Product.findById(productId);
  if (!product) return;

  return createNotification({
    type: 'out_of_stock',
    title: 'Agotado',
    message: `${product.name} está agotado`,
    productId: product._id.toString(),
    productSnapshot: {
      name: product.name,
      stock: 0,
    },
  });
};

/**
 * Get unread count for admin
 */
export const getUnreadCount = async () => {
  return Notification.countDocuments({ read: false });
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};

/**
 * Mark all as read
 */
export const markAllAsRead = async () => {
  return Notification.updateMany({ read: false }, { read: true });
};