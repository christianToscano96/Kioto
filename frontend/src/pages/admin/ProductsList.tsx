import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Input } from "@/components/ui/Input";
import { useProductsStore } from "@/store/products";
import { showToast } from "@/components/ui/Toast";
import { getTotalStock } from '@shared/index';
import {
  Package,
  AlertCircle,
  Tags,
  Store,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
} from '@/components/icons';

// Items per page options
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

export function ProductsList() {
  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoadingAdmin);
  const error = useProductsStore((state) => state.error);
  const fetchAdminProducts = useProductsStore(
    (state) => state.fetchAdminProducts,
  );
  const deleteProduct = useProductsStore((state) => state.deleteProduct);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">(
    "all",
  );

  // Sorting
  const [sortField, setSortField] = useState<"name" | "price" | "stock">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchAdminProducts();
  }, [fetchAdminProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

      const getProductTotalStock = (p: Parameters<typeof getTotalStock>[0]) => getTotalStock(p);

      return products.filter((product) => {
        // Search
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        const totalStock = getProductTotalStock(product);

        // Stock filter
        if (stockFilter === "low" && totalStock > 5) return false;
        if (stockFilter === "out" && totalStock !== 0) return false;

        // Published filter
        if (publishedFilter === "published" && !product.published) return false;
        if (publishedFilter === "draft" && product.published) return false;

        return true;
      });
  }, [products, searchTerm, stockFilter, publishedFilter]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      if (sortField === "stock") {
        return (getTotalStock(a) - getTotalStock(b)) * multiplier;
      }

      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * multiplier;
      }
      return String(aValue).localeCompare(String(bValue)) * multiplier;
    });
  }, [filteredProducts, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
    setSelectedProducts([]);
  };

  const handleSort = (field: "name" | "price" | "stock") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p._id));
    }
  };

  const handleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar ${selectedProducts.length} productos?`,
      )
    ) {
      try {
        for (const id of selectedProducts) {
          await deleteProduct(id);
        }
        showToast({ type: 'success', title: `${selectedProducts.length} productos eliminados` });
        setSelectedProducts([]);
      } catch (error) {
        showToast({ type: 'error', title: 'Error al eliminar productos' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const product = products?.find((p) => p._id === id);
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar "${product?.name}"?`,
      )
    ) {
try {
      await deleteProduct(id);
      showToast({ type: 'success', title: 'Producto eliminado' });
    } catch (error) {
      showToast({ type: 'error', title: 'Error al eliminar producto' });
    }
    }
  };

  // Calculate metrics
  const totalItems = products?.length || 0;
  const lowStock = products?.filter((p) => getTotalStock(p) <= 5).length || 0;
  const categories =
    new Set(products?.map((p) => p.slug?.split("-")[0])).size || 0;
  const activeSales = products?.filter((p) => p.published).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-verde-bosque-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-terracota-50 text-terracota-700 rounded-lg">
        Error al cargar productos. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <div>
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-on-surface">
          Productos
        </h1>
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 />
              Eliminar seleccionados ({selectedProducts.length})
            </Button>
          )}
          <Link to="/admin/products/new">
            <Button>
              <Plus />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 stitch-border-b pb-4">
        <Input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleFilterChange();
          }}
          className="max-w-sm"
        />
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as typeof stockFilter);
            handleFilterChange();
          }}
          className="h-10 rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos los stock</option>
          <option value="low">Stock bajo (≤5)</option>
          <option value="out">Agotados</option>
        </select>
        <select
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value as typeof publishedFilter);
            handleFilterChange();
          }}
          className="h-10 rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="h-10 rounded-lg border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {ITEMS_PER_PAGE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total de Artículos"
          value={totalItems}
          icon={<Package size={48} className="text-primary/10" />}
        />
        <MetricCard
          label="Stock Bajo"
          value={lowStock}
          icon={<AlertCircle size={48} className="text-terracota-600/10" />}
        />
        <MetricCard
          label="Categorías"
          value={categories}
          icon={<Tags size={48} className="text-verde-bosque-600/10" />}
        />
        <MetricCard
          label="Ventas Activas"
          value={activeSales}
          icon={<Store size={48} className="text-primary/10" />}
        />
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-outline-variant"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                Imagen
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container-low"
                onClick={() => handleSort("name")}
              >
                Nombre {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4 inline-block ml-1" /> : <ChevronDown className="h-4 w-4 inline-block ml-1" />)}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container-low"
                onClick={() => handleSort("price")}
              >
                Precio {sortField === "price" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4 inline-block ml-1" /> : <ChevronDown className="h-4 w-4 inline-block ml-1" />)}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container-low"
                onClick={() => handleSort("stock")}
              >
                Stock {sortField === "stock" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4 inline-block ml-1" /> : <ChevronDown className="h-4 w-4 inline-block ml-1" />)}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {paginatedProducts.map((product) => (
              <tr key={product._id} className="hover:bg-surface-container-low">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => handleSelectProduct(product._id)}
                    className="h-4 w-4 rounded border-outline-variant"
                  />
                </td>
                <td className="px-6 py-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-surface-container rounded flex items-center justify-center">
                      <span className="text-xs text-on-surface-variant">
                        Sin imagen
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-on-surface">
                      {product.name}
                    </div>
                    <div className="text-sm text-on-surface-variant">
                      /{product.slug}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-on-surface">
                  ${product.price.toFixed(2)}
                </td>
<td className="px-6 py-4">
                   {(() => {
                     const totalStock = getTotalStock(product);
                     return (
                       <Badge variant={totalStock > 5 ? "default" : totalStock === 0 ? "outline" : "destructive"}>
                         {totalStock} disponibles
                       </Badge>
                     );
                   })()}
                 </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/products/${product._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 />
                        </Button>
                    </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 />
                      </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {paginatedProducts.length === 0 && (
          <div className="p-8 text-center text-on-surface-variant">
            <p className="mb-4">
              {searchTerm || stockFilter !== "all" || publishedFilter !== "all"
                ? "No se encontraron productos con esos filtros."
                : "No se encontraron productos. Crea tu primer producto para comenzar."}
            </p>
            {!searchTerm && stockFilter === "all" && publishedFilter === "all" && (
              <Link to="/admin/products/new">
                <Button>Crear primer producto</Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/40">
            <p className="text-sm text-on-surface-variant">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, sortedProducts.length)} de{" "}
              {sortedProducts.length} productos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-on-surface-variant">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}