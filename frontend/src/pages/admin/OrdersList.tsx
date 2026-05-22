import { Eye, Plus, Grid, X, Minus, Search, User, ClipboardList, Truck, DollarSign, RefreshCw, Loader2 } from '@/components/icons';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { useOrdersStore } from '@/store/orders';
import { OrderActions } from '@/components/ui/OrderActions';
import { ManualOrderModal } from '@/components/ui/ManualOrderModal';
import { ShippingLabelModal } from '@/components/ui/ShippingLabelModal';
import type { Order } from '../../../../shared/src';
import { showToast } from '@/components/ui/Toast';
import { rowsToCsv } from '@/lib/utils';

const ORDER_STATUS: Order['status'][] = ['pending', 'paid', 'failed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ITEMS_PER_PAGE = 10;
const PAID_REVENUE_STATUSES: Order['status'][] = ['paid', 'processing', 'shipped', 'delivered'];

function getStatusBadgeVariant(status: Order['status']): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending': return 'warning';
    case 'paid': return 'success';
    case 'processing': return 'default';
    case 'shipped': return 'secondary';
    case 'delivered': return 'outline';
    case 'failed':
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
}

export function OrdersList() {
  const orders = useOrdersStore((state) => state.orders);
  const isLoading = useOrdersStore((state) => state.isLoading);
  const error = useOrdersStore((state) => state.error);
  const fetchOrders = useOrdersStore((state) => state.fetchOrders);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const orderMetrics = useMemo(() => {
    const allOrders = orders ?? [];
    return {
      pendingPayment: allOrders.filter((order) => order.status === 'pending').length,
      awaitingShipment: allOrders.filter((order) => order.status === 'paid').length,
      totalRevenue: allOrders
        .filter((order) => PAID_REVENUE_STATUSES.includes(order.status))
        .reduce((sum, order) => sum + order.total, 0),
      cancelled: allOrders.filter((order) => order.status === 'cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.createdAt);
        if (dateFrom && orderDate < new Date(dateFrom)) matchesDate = false;
        if (dateTo && orderDate > new Date(dateTo)) matchesDate = false;
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const handleFilterChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: Order['status'] | 'all') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleBulkStatusUpdate = async (status: Order['status']) => {
    try {
      for (const orderId of selectedOrders) {
        await updateOrderStatus(orderId, status);
      }
      showToast({ type: 'success', title: `${selectedOrders.length} pedidos actualizados` });
      setSelectedOrders([]);
    } catch (error) {
      showToast({ type: 'error', title: 'Error al actualizar pedidos' });
    }
  };

  const handlePrintLabel = (orderId: string) => {
    setSelectedOrderForLabel(orderId);
    setShowLabelModal(true);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-terracota-50 text-terracota-700 rounded-lg">
        Error al cargar pedidos. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description="Gestionar y seguir los pedidos de clientes" eyebrow="Panel de Administración" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pendientes de pago" value={orderMetrics.pendingPayment}
          icon={<ClipboardList size={48} className="text-primary/10" />} />
        <MetricCard label="En Espera de Envío" value={orderMetrics.awaitingShipment}
          icon={<Truck size={48} className="text-verde-bosque-600/10" />} />
        <MetricCard label="Ingresos confirmados" value={`$${orderMetrics.totalRevenue.toFixed(2)}`}
          icon={<DollarSign size={48} className="text-primary/10" />} />
        <MetricCard label="Devoluciones" value={orderMetrics.cancelled}
          icon={<RefreshCw size={48} className="text-terracota-600/10" />} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-b pb-4">
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Input type="text" placeholder="Buscar por ID, email o nombre..." value={searchTerm}
            onChange={(e) => handleFilterChange(e.target.value)} className="max-w-sm" />
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} />
          <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value as Order['status'] | 'all')}
            className="h-10 rounded-lg border border-outline bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Todos los Estados</option>
            {ORDER_STATUS.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <>
              <select onChange={(e) => {
                const status = e.target.value as Order['status'];
                if (status) handleBulkStatusUpdate(status);
              }} className="h-10 rounded-lg border border-outline bg-white px-3 py-2 text-sm">
                <option value="">Acciones en lote ({selectedOrders.length})</option>
                <option value="paid">Marcar como Pagado</option>
                <option value="processing">Marcar como Procesando</option>
                <option value="shipped">Marcar como Enviado</option>
                <option value="delivered">Marcar como Entregado</option>
                <option value="cancelled">Cancelar</option>
              </select>
              <Button variant="outline" onClick={() => setSelectedOrders([])}>Limpiar</Button>
            </>
          )}
          <Button variant="outline" onClick={() => {
            const csv = rowsToCsv([
              ['ID', 'Cliente', 'Email', 'Total', 'Estado', 'Fecha'],
              ...filteredOrders.map((o) => [
                o._id,
                o.shippingDetails?.name || '',
                o.shippingDetails?.email || '',
                o.total.toFixed(2),
                STATUS_LABELS[o.status],
                new Date(o.createdAt).toLocaleDateString('es-ES'),
              ]),
            ]);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>Exportar CSV</Button>
          <Button onClick={() => setShowManualModal(true)}>
            <Plus size={20} />Crear Pedido Manual
          </Button>
        </div>
      </div>

      <ManualOrderModal open={showManualModal} onClose={() => setShowManualModal(false)} 
        onSubmit={async (data) => {
          await useOrdersStore.getState().createManualOrder(data);
          setShowManualModal(false);
        }} />
      <ShippingLabelModal open={showLabelModal} onClose={() => setShowLabelModal(false)} orderId={selectedOrderForLabel} />

      <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <p className="mb-4">
              {hasActiveFilters
                ? 'Ningún pedido coincide con tus filtros.'
                : 'Aún no hay pedidos registrados.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
        <DataTable
          columns={[
            { key: undefined, label: '', render: (_, row) => (
              <input type="checkbox" checked={selectedOrders.includes(row._id)}
                onChange={() => {
                  setSelectedOrders(prev => prev.includes(row._id)
                    ? prev.filter(id => id !== row._id)
                    : [...prev, row._id]);
                }} className="rounded" />
            )},
            { key: '_id', label: 'ID de Pedido', render: (_, row) => <span className="font-mono">#{row._id.slice(-8)}</span> },
            { key: undefined, label: 'Cliente', render: (_, row) => (
              <div className="text-sm">
                <p className="font-medium">{row.shippingDetails?.name || 'Cliente anónimo'}</p>
                <p className="text-xs text-on-surface-variant">{row.shippingDetails?.email || '-'}</p>
              </div>
            )},
            { key: 'items', label: 'Productos', render: (_, row) => {
              const itemCount = row.items?.length || 0;
              const totalQty = row.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
              return <span className="text-sm">{itemCount} {itemCount === 1 ? 'producto' : 'productos'} ({totalQty} unidades)</span>;
            }},
            { key: 'createdAt', label: 'Fecha', render: (value) => {
              const date = new Date(value as string);
              return <span>{date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
            }},
            { key: 'total', label: 'Total', render: (value) => <span className="font-semibold">${(value as number).toFixed(2)}</span> },
            { key: 'status', label: 'Estado', render: (value) => {
              const status = value as Order['status'];
              return <Badge variant={getStatusBadgeVariant(status)} size="md">{STATUS_LABELS[status]}</Badge>;
            }},
          ]}
          data={paginatedOrders}
          actions={(row) => <OrderActions orderId={row._id} status={row.status} galioPaymentId={row.galioPaymentId} onPrintLabel={handlePrintLabel} />}
        />
        )}
      </div>

      {totalPages > 1 && filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} al {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded-lg border border-outline hover:bg-surface-container disabled:opacity-50">
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded-lg border ${currentPage === page ? 'bg-primary text-white border-primary' : 'border-outline hover:bg-surface-container'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded-lg border border-outline hover:bg-surface-container disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}