import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, StatusBadge } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { DashboardChartCard, DashboardChartEmpty } from "@/components/admin/DashboardChartCard";
import { formatPrice, rowsToCsv } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import {
  CHART_ACCENT,
  CHART_GRID,
  CHART_MUTED,
  CHART_PRIMARY,
  CHART_SECONDARY,
  DashboardChartTooltip,
  formatCountTooltipValue,
  formatSalesTooltipValue,
  getStatusChartColor,
} from "@/lib/dashboardCharts";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardStats, type RecentOrder } from "@/hooks/useDashboardStats";
import { AlertCircle, Download, Package, RefreshCw } from "@/components/icons";

type TimeRange = "7d" | "30d" | "90d" | "custom";

function getPeriodLabel(timeRange: TimeRange, customFrom?: string, customTo?: string): string {
  if (timeRange === "custom" && customFrom && customTo) {
    return `${customFrom} – ${customTo}`;
  }
  if (timeRange === "30d") return "Últimos 30 días";
  if (timeRange === "90d") return "Últimos 90 días";
  return "Últimos 7 días";
}

export function DashboardOverview() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { stats, recentOrders, loading, totalPages, refetch, error } = useDashboardStats({
    timeRange,
    customFrom,
    customTo,
    currentPage,
  });

  // Keep custom range in sync with timeRange
  useEffect(() => {
    if (timeRange !== "custom" && showCustomRange) {
      setShowCustomRange(false);
    }
  }, [timeRange, showCustomRange]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container-low rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-container-low rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-on-surface-variant mb-4">
          {error ?? "Error al cargar los datos del tablero."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const periodLabel = getPeriodLabel(timeRange, customFrom, customTo);

  const statCards = [
    {
      label: "Ventas Totales",
      value: formatPrice(stats.totalSales),
      sparklineData: stats.salesData?.map((d) => ({ date: d.date, value: d.sales })),
    },
    {
      label: "Pedidos",
      value: stats.orders.toString(),
      sparklineData: stats.orderTrend?.map((d) => ({ date: d.date, value: d.orders })),
    },
    {
      label: "Ticket Promedio",
      value: formatPrice(stats.avgOrder),
      sparklineData: undefined,
    },
    {
      label: "Stock Bajo",
      value: stats.lowStockProducts?.length || 0,
      change: { value: 0, label: "Productos con menos de 5 unidades", type: "stable" as const },
      sparklineData: undefined,
      variant:
        stats.lowStockProducts && stats.lowStockProducts.length > 0 ? ("primary" as const) : ("default" as const),
    },
  ];

  const funnelMax = Math.max(
    stats.cartStats?.totalCarts ?? 0,
    stats.cartStats?.abandonedCarts ?? 0,
    stats.cartStats?.convertedCarts ?? 0,
    stats.orders,
    1,
  );

  const funnelSteps = stats.funnelData ?? [];

  const chartTickStyle = { fontSize: 11, fill: CHART_MUTED };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Panel de Administración"
        title="Tablero"
        description="Ventas, pedidos e inventario en un solo lugar. Filtrá por período para analizar tendencias."
        className="mb-0"
      />

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Período de análisis
            </p>
            <p className="mt-1 text-sm font-medium text-on-surface">{periodLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  timeRange === range && !showCustomRange
                    ? "bg-primary text-on-primary shadow-sm"
                    : "border border-outline-variant/40 bg-surface text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {range === "7d" ? "7 días" : range === "30d" ? "30 días" : "90 días"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowCustomRange(!showCustomRange);
                setTimeRange("custom");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                timeRange === "custom" && showCustomRange
                  ? "bg-primary text-on-primary shadow-sm"
                  : "border border-outline-variant/40 bg-surface text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Personalizado
            </button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
              Actualizar
            </Button>
          </div>
        </div>

        {showCustomRange && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline-variant/20 pt-4">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-sm"
            />
            <span className="text-on-surface-variant">hasta</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            sparklineData={stat.sparklineData}
            variant={stat.variant}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-4 font-serif text-xl font-bold text-on-surface">Análisis del período</h2>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <DashboardChartCard
            title="Rendimiento comercial"
            subtitle={`Ventas y pedidos · ${periodLabel}`}
            className="xl:col-span-2"
            heightClassName="h-80"
          >
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.trendData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardSalesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="date" tick={chartTickStyle} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis
                    yAxisId="sales"
                    tick={chartTickStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                    width={56}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={chartTickStyle}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={32}
                  />
                  <Tooltip
                    content={
                      <DashboardChartTooltip
                        valueFormatter={(value, key) =>
                          key === "sales"
                            ? formatSalesTooltipValue(value)
                            : formatCountTooltipValue(value)
                        }
                      />
                    }
                  />
                  <Area
                    yAxisId="sales"
                    type="monotone"
                    dataKey="sales"
                    name="Ventas"
                    stroke={CHART_PRIMARY}
                    fill="url(#dashboardSalesFill)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    name="Pedidos"
                    fill={CHART_SECONDARY}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    opacity={0.9}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <DashboardChartEmpty />
            )}
          </DashboardChartCard>

          <DashboardChartCard
            title="Estado de pedidos"
            subtitle="Distribución en el período seleccionado"
            heightClassName="h-80"
          >
            {stats.statusDistribution.length > 0 ? (
              <div className="flex h-full flex-col gap-5 lg:flex-row lg:items-center">
                <div className="mx-auto h-44 w-full max-w-[220px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {stats.statusDistribution.map((entry) => (
                          <Cell key={entry.status} fill={getStatusChartColor(entry.status)} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={
                          <DashboardChartTooltip valueFormatter={(value) => `${value} pedidos`} />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {stats.statusDistribution.map((entry) => (
                    <li key={entry.status} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: getStatusChartColor(entry.status) }}
                        />
                        <span className="truncate">{entry.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-on-surface">{entry.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <DashboardChartEmpty />
            )}
          </DashboardChartCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardChartCard
            title="Productos más vendidos"
            subtitle="Unidades vendidas en el período"
          >
            {stats.topProducts && stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  layout="vertical"
                  data={stats.topProducts}
                  margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" tick={chartTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={chartTickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={96}
                  />
                  <Tooltip
                    content={
                      <DashboardChartTooltip
                        valueFormatter={(value) => `${value} unidades`}
                      />
                    }
                  />
                  <Bar dataKey="sales" name="Unidades" fill={CHART_ACCENT} radius={[0, 4, 4, 0]} barSize={18} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <DashboardChartEmpty message="Aún no hay ventas registradas" />
            )}
          </DashboardChartCard>

          <DashboardChartCard
            title="Embudo de checkout"
            subtitle="Del carrito al pedido confirmado"
            heightClassName="min-h-[18rem]"
            contentClassName="h-auto"
          >
            {funnelSteps.length > 0 ? (
              <div className="space-y-4">
                {stats.cartStats && (
                  <div className="rounded-lg bg-surface px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                      Tasa de conversión
                    </p>
                    <p className="mt-1 text-2xl font-serif font-bold text-primary">
                      {stats.cartStats.conversionRate}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {funnelSteps.map((step) => {
                    const width = Math.max(8, (step.value / funnelMax) * 100);
                    return (
                      <div key={step.stage}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-on-surface-variant">{step.stage}</span>
                          <span className="font-semibold tabular-nums text-on-surface">{step.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${width}%`, backgroundColor: step.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <DashboardChartEmpty message="Sin datos de carritos" />
            )}
          </DashboardChartCard>
        </div>
      </div>

      {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <DashboardChartCard
          title="Alertas de inventario"
          subtitle={`${stats.lowStockProducts.length} productos con stock crítico`}
          className="border-l-4 border-l-warning"
          heightClassName="h-auto"
          contentClassName="h-auto"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/products")}>
              Ver catálogo
            </Button>
          }
        >
          <div className="flex items-start gap-3 mb-5 rounded-lg bg-warning/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="text-warning" size={20} />
            </div>
            <p className="text-sm text-on-surface-variant">
              Reponé estos productos para evitar quedar sin stock en la tienda.
            </p>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((product) => {
                  const stockPercent = Math.max(0, Math.min(100, (product.stock / 5) * 100));
                  const urgencyLevel = product.stock <= 0 ? 'critical' : product.stock <= 2 ? 'high' : 'medium';
                  
                  return (
                    <tr 
                      key={product._id} 
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                            <Package className="text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{product.name}</p>
                            <p className="text-xs text-on-surface-variant">ID: …{product._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold ${
                          product.stock === 0 ? 'bg-error-container text-error' :
                          product.stock <= 2 ? 'bg-warning-container text-warning' :
                          'bg-surface-container text-on-surface'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden max-w-[120px]">
                            <div 
                              className={`h-full transition-all ${
                                urgencyLevel === 'critical' ? 'bg-error' :
                                urgencyLevel === 'high' ? 'bg-warning' : 'bg-secondary'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant w-16">
                            {stockPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                            className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5 transition-colors"
                          >
                            Editar Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {stats.lowStockProducts.map((product) => {
              const stockPercent = Math.max(0, Math.min(100, (product.stock / 5) * 100));
              
              return (
                <div 
                  key={product._id} 
                  className="bg-surface-container rounded-lg p-4 border border-outline-variant/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center">
                        <Package size={18} className="text-on-surface-variant" />
                      </div>
                      <div>
                        <p className="font-medium text-on-surface text-sm">{product.name}</p>
                        <p className="text-xs text-on-surface-variant">Stock: {product.stock} unidades</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.stock === 0 ? 'bg-error-container text-error' :
                      'bg-warning-container text-warning'
                    }`}>
                      {product.stock === 0 ? 'Sin Stock' : 'Bajo'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Nivel de inventario</span>
                      <span>{stockPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${product.stock === 0 ? 'bg-error' : 'bg-warning'}`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                    className="w-full py-2 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5 transition-colors"
                  >
                    Editar Stock
                  </button>
                </div>
              );
            })}
          </div>
        </DashboardChartCard>
      )}

      <DashboardChartCard
        title="Pedidos recientes"
        subtitle="Últimos movimientos del período filtrado"
        heightClassName="h-auto"
        contentClassName="h-auto"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = rowsToCsv([
                ["Cliente", "Estado", "Fecha", "Total"],
                ...recentOrders.map((o) => [
                  o.customer,
                  ORDER_STATUS_LABELS[o.status],
                  o.date,
                  o.total,
                ]),
              ]);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `pedidos-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} />
            Exportar CSV
          </Button>
        }
      >
        {recentOrders.length > 0 ? (
          <>
            <DataTable
              columns={[
                { key: "customer", label: "Cliente" },
                {
                  key: "status",
                  label: "Estado",
                  render: (value) => <StatusBadge status={value as RecentOrder["status"]} />,
                },
                { key: "date", label: "Fecha" },
                {
                  key: "total",
                  label: "Total",
                  render: (value) => (
                    <span className="font-serif font-bold text-primary">
                      {formatPrice(Number(value))}
                    </span>
                  ),
                },
              ]}
              data={recentOrders}
            />

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-outline-variant/40 px-3 py-1 text-sm hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-on-surface-variant">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-outline-variant/40 px-3 py-1 text-sm hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <DashboardChartEmpty message="No hay pedidos en este período" />
        )}
      </DashboardChartCard>
    </div>
  );
}