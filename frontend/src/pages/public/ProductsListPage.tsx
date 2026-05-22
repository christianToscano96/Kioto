import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductsStore } from "@/store/products";
import { useCategoriesStore } from "@/store/categories";
import { useQuickAddSidebar, useOpenQuickAddSidebar, useResetSidebar } from "@/store/ui";
import { useOpenQuickAdd } from "@/store/ui";
import { productsApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCardUnified } from "@/components/ui/ProductCardUnified";
import { Drawer } from "@/components/ui/Drawer";
import { CartSidebar } from "@/components/ui/CartSidebar";
import { QuickAddBottomSheet } from "@/components/ui/QuickAddBottomSheet";
import { SidebarFilters } from "@/components/public/SidebarFilters";
import { ProductsFilterToolbar } from "@/components/public/ProductsFilterToolbar";
import { PageContainer } from "@/components/ui/Container";
import {
  ActiveFilters,
  type ActiveFilter,
} from "@/components/ui/ActiveFilters";
import { type SortOption } from "@/components/ui/SortDropdown";
import { BackButton } from "@/components/ui/BackButton";
import { ProductSkeleton } from "@/components/ui/ProductSkeleton";
import { useDeviceType } from "@/hooks/useDeviceType";
import { productHasColor, productHasSize } from "@shared/index";
import { useDebounce } from "@/hooks/useDebounce";

const DEFAULT_MAX_PRICE = 60000;

export function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || null,
  );
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { isMobile } = useDeviceType();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, DEFAULT_MAX_PRICE]);
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { products, isLoadingList, isRefreshingList, error } = useProductsStore();
  const fetchProducts = useProductsStore.getState().fetchProducts;
  const quickAddSidebar = useQuickAddSidebar();
  const openQuickAddSidebar = useOpenQuickAddSidebar();
  const resetSidebar = useResetSidebar();
  const openQuickAdd = useOpenQuickAdd();
  const { categories: allCategories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
    productsApi.getColors().then(setAvailableColors).catch(console.error);
  }, [fetchCategories]);

  const minPrice = useMemo(
    () => products?.reduce((min, p) => Math.min(min, p.price), Infinity) || 0,
    [products],
  );
  const maxPrice = useMemo(
    () => products?.reduce((max, p) => Math.max(max, p.price), 0) || DEFAULT_MAX_PRICE,
    [products],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!priceRangeInitialized && products.length > 0 && Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
      setPriceRange([minPrice, maxPrice]);
      setPriceRangeInitialized(true);
    }
  }, [minPrice, maxPrice, priceRangeInitialized, products.length]);

  useEffect(() => {
    setVisibleCount(12);
  }, [
    selectedCategory,
    debouncedSearchQuery,
    filterSize,
    filterColor,
    priceRange,
    sortBy,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    setSearchParams(params.toString() ? params : {});
  }, [searchQuery, selectedCategory, setSearchParams]);

  const categories = useMemo(() => {
    const productCounts = new Map<string, number>();
    products?.forEach((p) => {
      const catName =
        typeof p.category === "object" &&
        p.category !== null &&
        "name" in p.category
          ? p.category.name
          : p.category;
      if (catName) {
        productCounts.set(String(catName), (productCounts.get(String(catName)) || 0) + 1);
      }
    });

    return allCategories.map((cat) => ({
      name: cat.name,
      count: productCounts.get(cat.name) || 0,
      active: cat.name === selectedCategory,
    }));
  }, [products, selectedCategory, allCategories]);

  const isPriceFiltered =
    priceRangeInitialized &&
    (priceRange[0] > minPrice || priceRange[1] < maxPrice);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter((p) => {
        const catName =
          typeof p.category === "object" &&
          p.category !== null &&
          "name" in p.category
            ? p.category.name
            : p.category;
        return String(catName) === selectedCategory;
      });
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query),
      );
    }

    if (filterSize) {
      filtered = filtered.filter((p) => productHasSize(p, filterSize));
    }

    if (filterColor) {
      filtered = filtered.filter((p) => productHasColor(p, filterColor));
    }

    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [
    products,
    selectedCategory,
    debouncedSearchQuery,
    filterSize,
    filterColor,
    priceRange,
    sortBy,
  ]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleCount < filteredProducts.length
        ) {
          setVisibleCount((prev) =>
            Math.min(prev + 6, filteredProducts.length),
          );
        }
      },
      { threshold: 1.0 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredProducts.length, visibleCount]);

  const handleQuickAdd = useCallback(
    (productId: string) => {
      if (isMobile) {
        openQuickAdd(productId);
      } else {
        openQuickAddSidebar(productId);
      }
    },
    [isMobile, openQuickAdd, openQuickAddSidebar],
  );

  const activeFilters: ActiveFilter[] = useMemo(
    () => [
      ...(debouncedSearchQuery.trim()
        ? [{ id: "search", label: "Búsqueda", value: debouncedSearchQuery.trim() }]
        : []),
      ...(selectedCategory
        ? [{ id: "category", label: "Categoría", value: selectedCategory }]
        : []),
      ...(filterSize ? [{ id: "size", label: "Talla", value: filterSize }] : []),
      ...(filterColor ? [{ id: "color", label: "Color", value: filterColor }] : []),
      ...(isPriceFiltered
        ? [{
            id: "price",
            label: "Precio",
            value: `${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`,
          }]
        : []),
    ],
    [
      debouncedSearchQuery,
      selectedCategory,
      filterSize,
      filterColor,
      isPriceFiltered,
      priceRange,
    ],
  );

  const activeFilterCount = activeFilters.length;

  const resetPriceRange = useCallback(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const removeFilter = useCallback(
    (id: string) => {
      if (id === "search") setSearchQuery("");
      if (id === "category") setSelectedCategory(null);
      if (id === "size") setFilterSize(null);
      if (id === "color") setFilterColor(null);
      if (id === "price") resetPriceRange();
    },
    [resetPriceRange],
  );

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setFilterSize(null);
    setFilterColor(null);
    setSearchQuery("");
    resetPriceRange();
  }, [resetPriceRange]);

  const handleCategoryClick = useCallback((categoryName: string) => {
    if (!categoryName) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory((prevCategory) =>
      prevCategory === categoryName ? null : categoryName,
    );
  }, []);

  const filterPanelProps = {
    categories,
    colors: availableColors,
    sizes: ["XS", "S", "M", "L", "XL"] as string[],
    selectedSize: filterSize,
    selectedColor: filterColor,
    onSizeChange: setFilterSize,
    onColorChange: setFilterColor,
    onCategoryClick: handleCategoryClick,
    priceRange: {
      minPrice,
      maxPrice,
      value: priceRange,
      onChange: setPriceRange,
    },
  };

  const hasAnyFilters =
    activeFilterCount > 0 ||
    Boolean(searchQuery || selectedCategory || filterSize || filterColor);

  if (error && products.length === 0) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <PageContainer>
            <div className="p-6 bg-surface-container rounded-lg text-center max-w-md mx-auto">
              <p className="text-on-surface-variant mb-4">
                Error al cargar los productos. El servidor puede estar despertando; intenta de nuevo en unos segundos.
              </p>
              <button
                type="button"
                onClick={() => fetchProducts()}
                className="inline-flex items-center justify-center bg-primary text-on-primary font-medium text-sm px-6 py-2.5 rounded-md hover:bg-primary-hover transition-colors"
              >
                Reintentar
              </button>
            </div>
          </PageContainer>
        </div>
        <Footer />
      </>
    );
  }

  const isInitialLoad = isLoadingList && products.length === 0;

  return (
    <>
      <PublicHeader />

      {isRefreshingList && (
        <div className="bg-primary-container/30 text-primary text-center text-xs py-1.5 font-label uppercase tracking-wider">
          Actualizando catálogo…
        </div>
      )}

      <PageContainer className="pb-16 pt-24 md:pt-28">
        <div className="mb-4">
          <BackButton label="Volver" showLabelOnMobile />
        </div>

        <ProductsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          view={view}
          onViewChange={setView}
          resultCount={filteredProducts.length}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setShowFiltersDrawer(true)}
        />

        <ActiveFilters
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={activeFilters.length > 0 ? clearAllFilters : undefined}
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="hidden lg:block">
            <SidebarFilters {...filterPanelProps} />
          </div>

          <Drawer
            isOpen={showFiltersDrawer}
            onClose={() => setShowFiltersDrawer(false)}
            title="Filtrar productos"
            footer={
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowFiltersDrawer(false)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary font-label text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-hover"
                >
                  Ver {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
                </button>
                {hasAnyFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex min-h-[44px] w-full items-center justify-center font-label text-[11px] uppercase tracking-widest text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            }
          >
            <SidebarFilters {...filterPanelProps} />
          </Drawer>

          <section className="min-w-0 flex-1">
            {isInitialLoad ? (
              <div aria-busy="true" aria-label="Cargando productos">
                <p className="mb-6 text-center text-sm text-on-surface-variant">
                  Preparando nuestro catálogo…
                </p>
                <ProductSkeleton count={12} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-low/30 px-6 py-16 text-center">
                <p className="font-serif text-xl text-on-surface">
                  No encontramos productos
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  {hasAnyFilters
                    ? "Probá ajustando los filtros o la búsqueda."
                    : "Aún no hay productos disponibles."}
                </p>
                {hasAnyFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-primary/30 px-5 font-label text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
                  >
                    Ver todos los productos
                  </button>
                )}
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 gap-x-4 gap-y-8 md:gap-y-12 lg:grid-cols-3 stagger-children"
                    : "flex flex-col gap-5"
                }
              >
                {visibleProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCardUnified
                      product={product}
                      variant={view}
                      onAddToCart={handleQuickAdd}
                    />
                  </div>
                ))}
              </div>
            )}

            {visibleCount < filteredProducts.length && (
              <div ref={loadMoreRef} className="h-10" aria-hidden />
            )}
          </section>
        </div>
      </PageContainer>

      <Drawer
        isOpen={!!products?.some((p) => p._id === quickAddSidebar.productId)}
        onClose={resetSidebar}
        position="right"
        hideOnDesktop={false}
        title=""
      >
        <CartSidebar products={products} />
      </Drawer>

      <QuickAddBottomSheet products={products} enabled={isMobile} />

      <Footer />
    </>
  );
}
