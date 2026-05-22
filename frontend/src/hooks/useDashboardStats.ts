import { useState, useEffect } from "react";
import { ordersApi, adminProductsApi, cartApi } from "@/lib/api";
import type { Order, Product } from "@shared/index";
import { getTotalStock } from "@shared/index";
import { formatChartShortDate, getStatusChartLabel } from "@/lib/dashboardCharts";

export interface DashboardTrendPoint {
  isoDate: string;
  date: string;
  sales: number;
  orders: number;
}

export interface DashboardStatusSlice {
  status: string;
  label: string;
  count: number;
  value: number;
}

export interface DashboardStats {
  totalSales: number;
  orders: number;
  avgOrder: number;
  trendData: DashboardTrendPoint[];
  salesData: Array<{ isoDate: string; date: string; sales: number }>;
  statusDistribution: DashboardStatusSlice[];
  orderTrend: Array<{ isoDate: string; date: string; orders: number }>;
  funnelData?: { stage: string; value: number; fill: string }[];
  topProducts?: { name: string; sales: number }[];
  lowStockProducts?: { _id: string; name: string; stock: number }[];
  cartStats?: {
    totalCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    conversionRate: string;
  };
}

export interface RecentOrder {
  customer: string;
  status: Order["status"];
  date: string;
  total: number;
  _id: string;
}

type TimeRange = "7d" | "30d" | "90d" | "custom";

interface UseDashboardStatsProps {
  timeRange: TimeRange;
  customFrom?: string;
  customTo?: string;
  currentPage: number;
  itemsPerPage?: number;
}

export function useDashboardStats({
  timeRange,
  customFrom,
  customTo,
  currentPage,
  itemsPerPage = 5,
}: UseDashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { days?: number; from?: string; to?: string } = {};
      if (timeRange === "custom" && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      } else if (timeRange !== "custom") {
        const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
        params.days = daysMap[timeRange];
      }

      const [ordersResponse, productsResponse, cartStatsResponse] = await Promise.all([
        ordersApi.list(params),
        adminProductsApi.list(),
        cartApi.getStats(),
      ]);

      const orders = ordersResponse;
      const products = productsResponse;
      const cartStats = cartStatsResponse.data;

      // Calculate stats from real orders
      const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
      const ordersCount = orders.length;
      const avgOrder = ordersCount > 0 ? totalSales / ordersCount : 0;

      // Group sales and orders by ISO date for charts
      const salesByDate = orders.reduce<Record<string, number>>((acc, o: Order) => {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        acc[key] = (acc[key] || 0) + o.total;
        return acc;
      }, {});

      const ordersByDate = orders.reduce<Record<string, number>>((acc, o: Order) => {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const isoDates = Array.from(
        new Set([...Object.keys(salesByDate), ...Object.keys(ordersByDate)]),
      ).sort();

      const trendData: DashboardTrendPoint[] = isoDates.map((isoDate) => ({
        isoDate,
        date: formatChartShortDate(isoDate),
        sales: salesByDate[isoDate] ?? 0,
        orders: ordersByDate[isoDate] ?? 0,
      }));

      const salesData = trendData.map(({ isoDate, date, sales }) => ({
        isoDate,
        date,
        sales,
      }));

      const orderTrend = trendData.map(({ isoDate, date, orders: dayOrders }) => ({
        isoDate,
        date,
        orders: dayOrders,
      }));

      // Status distribution for pie chart
      const statusCount = orders.reduce<Record<string, number>>((acc, o: Order) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});

      const statusDistribution: DashboardStatusSlice[] = Object.entries(statusCount)
        .map(([status, count]) => ({
          status,
          label: getStatusChartLabel(status),
          count,
          value: count,
        }))
        .sort((a, b) => b.count - a.count);

      // Top products from order items
      const productSales: Record<string, { name: string; sales: number }> = {};
      orders.forEach((o: Order) => {
        o.items.forEach((item: any) => {
          const pid = item.productId as any;
          const key = typeof pid === "string" ? pid : (pid?._id?.toString() || pid?.name || "unknown");
          const name = pid?.name || (typeof pid === "string" ? pid : "Producto");
          if (!productSales[key]) productSales[key] = { name, sales: 0 };
          productSales[key].sales += item.quantity;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      const lowStockProducts = products
        .map((p: Product) => ({ _id: p._id, name: p.name, stock: getTotalStock(p) }))
        .filter((p) => p.stock < 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      setStats({
        totalSales,
        orders: ordersCount,
        avgOrder,
        trendData,
        salesData,
        statusDistribution,
        orderTrend,
        topProducts,
        lowStockProducts,
        cartStats,
        funnelData: cartStats
          ? [
              { stage: "Carritos", value: cartStats.totalCarts, fill: "#99452c" },
              { stage: "Abandonados", value: cartStats.abandonedCarts, fill: "#dc2626" },
              { stage: "Convertidos", value: cartStats.convertedCarts, fill: "#2e6b4f" },
              { stage: "Pedidos", value: ordersCount, fill: "#c27e41" },
            ]
          : undefined,
      });

      // Paginate recent orders
      const sorted = [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTotalPages(Math.ceil(sorted.length / itemsPerPage));

      const recent = sorted
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((o: Order) => ({
          customer: o.shippingDetails?.name || "Cliente",
          status: o.status,
          date: new Date(o.createdAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
          }),
          total: o.total,
          _id: o._id,
        }));
      setRecentOrders(recent);
    } catch (fetchError) {
      console.error("Failed to fetch dashboard data:", fetchError);
      setStats(null);
      setError("No se pudieron cargar los datos del tablero.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, customFrom, customTo, currentPage]);

  return {
    stats,
    recentOrders,
    loading,
    error,
    totalPages,
    refetch: fetchDashboardData,
  };
}