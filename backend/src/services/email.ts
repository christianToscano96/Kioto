import { IOrder } from '../models/Order';
import { ICartItem } from '../models/types';
import Settings from '../models/Settings';

// Cache for settings
let cachedSettings: any = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get settings with caching
const getSettings = async () => {
  const now = Date.now();
  if (cachedSettings && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return cachedSettings;
  }
  
  const settings = await Settings.findOne().lean();
  cachedSettings = settings;
  settingsCacheTime = now;
  return settings;
};

// Reset cache (useful after settings update)
export const resetSettingsCache = () => {
  cachedSettings = null;
  settingsCacheTime = 0;
};

interface EmailRuntimeConfig {
  apiKey: string;
  fromEmail: string;
  adminEmail: string;
}

async function getEmailConfig(): Promise<EmailRuntimeConfig> {
  const settings = await getSettings();
  const apiKey = settings?.email?.pass || process.env.EMAIL_PASS || '';
  const fromEmail = settings?.email?.from || process.env.EMAIL_FROM || 'noreply@kioto.com';
  const adminEmail = settings?.email?.user || fromEmail;

  return { apiKey, fromEmail, adminEmail };
}

// Send email via Brevo API REST
const sendBrevoEmail = async (to: string, subject: string, html: string, senderName?: string) => {
  const { apiKey, fromEmail } = await getEmailConfig();

  if (!apiKey) {
    throw new Error('Brevo API key not configured');
  }

  console.log('[BREVO API] Sending email:', {
    to,
    from: fromEmail,
    subject,
    hasApiKey: !!apiKey
  });

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'KIOTO INDU',
        email: fromEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }

  const result = await response.json() as { messageId?: string };
  console.log('[BREVO API] Email sent successfully:', result.messageId);
  return result;
};

// Status labels in Spanish
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En preparación',
    paid: 'Pagado',
    failed: 'Fallido',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return labels[status] || 'En preparación';
};

// Email template for order confirmation
const getOrderConfirmationTemplate = (
  customerName: string,
  order: IOrder & { items: Array<ICartItem & { productName?: string }> },
  orderId: string
): string => {
  const itemsRows = order.items
    .map((item: any) => {
      // Handle populated product
      const productName = item.productName || 'Producto';
      // Handle price - could be from populated product or cart item
      const price = typeof item.price === 'number' ? item.price : (item.productId?.price || 0);
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      const itemTotal = price * quantity;
      
      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-weight: 500; color: #1f2937;">${productName}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
        ${quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
        $${itemTotal.toFixed(2)}
      </td>
    </tr>
  `;
    })
    .join('');

  const subtotal = order.subtotal ?? 0;
  const shipping = order.shipping ?? 0;
  const total = order.total ?? 0;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 40px 30px; text-align: center;">
      <img src="https://kioto-ecommerce.vercel.app/logo.png" alt="KIOTO INDU" style="height: 40px; margin-bottom: 16px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
        ¡Gracias por tu compra!
      </h1>
      <p style="margin: 8px 0 0; color: #e5e7eb; font-size: 16px;">
        Tu pedido ha sido confirmado
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
        Hola <strong>${customerName}</strong>,
      </p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Gracias por elegir KIOTO INDU. Aquí están los detalles de tu pedido:
      </p>

      <!-- Order Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
          <strong style="color: #374151;">Número de pedido:</strong> #${orderId.slice(-8).toUpperCase()}
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong style="color: #374151;">Estado:</strong> 
          <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; margin-left: 8px;">
            ${getStatusLabel(order.status || 'pending')}
          </span>
        </p>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Producto</th>
            <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151;">Cant.</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="border-top: 2px solid #334155; padding-top: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Subtotal:</span>
          <span style="color: #1f2937; font-weight: 500;">$${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Envío:</span>
          <span style="color: #1f2937; font-weight: 500;">$${shipping.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <span style="color: #374151; font-weight: 600; font-size: 18px;">Total:</span>
          <span style="color: #dc2626; font-weight: 600; font-size: 18px;">$${total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Shipping Details -->
      ${order.shippingDetails ? `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px;">Dirección de envío</h3>
        <p style="margin: 0; color: #374151; line-height: 1.6;">
          ${order.shippingDetails.name}<br>
          ${order.shippingDetails.address.line1}${order.shippingDetails.address.line2 ? `<br>${order.shippingDetails.address.line2}` : ''}<br>
          ${order.shippingDetails.address.city}, ${order.shippingDetails.address.state || ''} ${order.shippingDetails.address.postal_code}<br>
          ${order.shippingDetails.address.country}
        </p>
      </div>
      ` : ''}

      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1e293b; padding: 20px 30px; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} KIOTO INDU. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (
  order: IOrder & { items: ICartItem[] },
  orderId: string
): Promise<void> => {
  try {
    // Populate product names and prices for the email
    await order.populate('items.productId', 'name price');

    const itemsWithEmail = order.items.map((item: any) => ({
      ...item,
      productName: item.productId?.name || 'Producto',
      price: typeof item.price === 'number' ? item.price : (item.productId?.price || 0),
    }));

    const emailHtml = getOrderConfirmationTemplate(
      order.shippingDetails?.name || 'Cliente',
      { 
        ...order, 
        items: itemsWithEmail,
        subtotal: order.subtotal ?? 0,
        shipping: order.shipping ?? 0,
        total: order.total ?? 0,
      } as any,
      orderId
    );

    const toEmail = order.shippingDetails?.email || 'customer@example.com';
    await sendBrevoEmail(
      toEmail,
      `Confirmación de Pedido #${orderId.slice(-8).toUpperCase()}`,
      emailHtml
    );
  } catch (error: any) {
    console.error('[EMAIL-ERROR] Failed to send order confirmation:', {
      orderId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Send email to admin
export const sendAdminNotificationEmail = async (
  order: IOrder & { items: ICartItem[] },
  orderId: string,
  customerName: string
): Promise<void> => {
  try {
    // Populate product info
    await order.populate('items.productId', 'name price');

    const itemsWithEmail = order.items.map((item: any) => ({
      ...item,
      productName: item.productId?.name || 'Producto',
      price: typeof item.price === 'number' ? item.price : (item.productId?.price || 0),
    }));

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; background: #f3f4f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <h2 style="color: #1e293b; margin-top: 0;">🔔 Nuevo Pedido Recibido</h2>
    <p><strong>Pedido:</strong> #${orderId.slice(-8).toUpperCase()}</p>
    <p><strong>Cliente:</strong> ${customerName}</p>
    <p><strong>Email:</strong> ${order.shippingDetails?.email || 'N/A'}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <h3>Productos:</h3>
    <ul>
      ${itemsWithEmail.map((item: any) => `<li>${item.productName} x ${item.quantity} - $${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</li>`).join('')}
    </ul>
    <p><strong>Total:</strong> $${(order.total || 0).toFixed(2)}</p>
    <p style="color: #6b7280; font-size: 12px;">KIOTO INDU - Notificación automática</p>
  </div>
</body>
</html>`;

    const { adminEmail } = await getEmailConfig();
    await sendBrevoEmail(
      adminEmail,
      `Nuevo Pedido #${orderId.slice(-8).toUpperCase()}`,
      emailHtml
    );
  } catch (error: any) {
    console.error('[EMAIL-ERROR] Failed to send admin notification:', {
      orderId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Resend order confirmation email
export const resendOrderConfirmationEmail = async (
  order: IOrder & { items: ICartItem[] },
  orderId: string
): Promise<void> => {
  await sendOrderConfirmationEmail(order, orderId);
};