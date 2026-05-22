import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdersStore } from '@/store/orders';
import { showToast } from '@/components/ui/Toast';
import type { Order } from '@shared/index';
import { MoreVertical, Eye, Printer, CreditCard, RefreshCw, Mail, ArrowRight, X } from '@/components/icons';

interface OrderActionsProps {
  orderId: string;
  status: Order['status'];
  galioPaymentId?: string;
  onPrintLabel?: (orderId: string) => void;
}

export function OrderActions({ orderId, status, galioPaymentId, onPrintLabel }: OrderActionsProps) {
  const hasGalioPaymentId = !!galioPaymentId && !galioPaymentId.startsWith('http');
  const [open, setOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleView = () => {
    navigate(`/admin/orders/${orderId}`);
    setOpen(false);
  };

  const handleChangeStatus = async (newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast({ type: 'success', title: `Estado actualizado a ${STATUS_LABELS[newStatus]}` });
    } catch (error) {
      showToast({ type: 'error', title: 'Error al actualizar estado' });
    }
    setOpen(false);
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/orders/${orderId}/resend-email`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        showToast({ type: 'success', title: 'Email reenviado correctamente' });
      } else {
        showToast({ type: 'error', title: 'Error al reenviar email' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error al reenviar email' });
    } finally {
      setResending(false);
      setOpen(false);
    }
  };

  const handleCheckGalioPayment = async () => {
    if (!hasGalioPaymentId) return;
    
    try {
      setCheckingPayment(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/orders/${orderId}/galio-payment`,
        { method: 'GET', credentials: 'include' }
      );
      
      if (response.ok) {
        const payment = await response.json();
        showToast({ type: 'success', title: `Pago ${payment.status}` });
      } else {
        showToast({ type: 'error', title: 'No se pudo verificar el pago' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error al verificar pago' });
    } finally {
      setCheckingPayment(false);
      setOpen(false);
    }
  };

  const handleRefundGalioPayment = async () => {
    if (!hasGalioPaymentId) return;
    
    if (!confirm('¿Reembolsar este pago?')) return;
    
    try {
      setRefunding(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/orders/${orderId}/refund-galio`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Reembolso administrativo', refundType: 'total' }),
        }
      );
      
      if (response.ok) {
        showToast({ type: 'success', title: 'Reembolso procesado' });
      } else {
        showToast({ type: 'error', title: 'Error al reembolsar' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error al reembolsar' });
    } finally {
      setRefunding(false);
      setOpen(false);
    }
  };

  const nextStatus = (): Order['status'] | null => {
    const flow: Order['status'][] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    const idx = flow.indexOf(status);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-on-surface-variant hover:text-primary transition-colors p-1"
        aria-label={`Acciones para pedido ${orderId.slice(-8)}`}
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-outline-variant z-10 py-1">
          <button
            onClick={handleView}
            className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            Ver Detalle
          </button>
          
          {onPrintLabel && (
            <button
              onClick={() => { onPrintLabel(orderId); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center gap-2"
            >
              <Printer size={16} />
              Imprimir Etiqueta
            </button>
          )}
          
          {/* GalioPay actions */}
          {hasGalioPaymentId && (
            <>
              <button
                onClick={handleCheckGalioPayment}
                disabled={checkingPayment}
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center gap-2"
              >
                <CreditCard size={16} />
                {checkingPayment ? 'Verificando...' : 'Verificar Pago'}
              </button>
              
              {status === 'paid' && (
                <button
                  onClick={handleRefundGalioPayment}
                  disabled={refunding}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors text-terracota-600 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  {refunding ? 'Reembolsando...' : 'Reembolsar'}
                </button>
              )}
            </>
          )}
          
          {!open && resending && (
            <div className="border-t border-outline-variant my-1" />
          )}
          
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center gap-2"
          >
            <Mail size={16} />
            {resending ? 'Enviando...' : 'Reenviar Email'}
          </button>
          
          {status !== 'delivered' && status !== 'cancelled' && nextStatus() && (
            <button
              onClick={() => handleChangeStatus(nextStatus()!)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center gap-2"
            >
              <ArrowRight size={16} />
              Marcar como {STATUS_LABELS[nextStatus()!]}
            </button>
          )}
          
          {status !== 'cancelled' && (
            <button
              onClick={() => handleChangeStatus('cancelled')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors text-terracota-600 flex items-center gap-2"
            >
              <X size={16} />
              Cancelar Pedido
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Status labels for next status display
const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};