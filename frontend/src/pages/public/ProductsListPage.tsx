import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductsStore } from "@/store/products";
import { useCategoriesStore } from "@/store/categories";
import { useQuickAddSidebar, useOpenQuickAddSidebar, useResetSidebar } from "@/store/ui";
import { useOpenQuickAdd } from "@/store/ui";
import { productsApi } from "@/lib/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCardUnified } from "@/components/ui/ProductCardUnified";
import { Drawer } from "@/components/ui/Drawer";
import { CartSidebar } from "@/components/ui/CartSidebar";
import { QuickAddBottomSheet } from "@/components/ui/QuickAddBottomSheet";
import { SidebarFilters } from "@/components/public/SidebarFilters";
import { PageContainer } from "@/components/ui/Container";
import {
  ActiveFilters,
  type ActiveFilter,
} from "@/components/ui/ActiveFilters";
import { SortDropdown, type SortOption } from "@/components/ui/SortDropdown";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { PriceRangeFilter } from "@/components/ui/PriceRangeFilter";
import { BackButton } from "@/components/ui/BackButton";
import { Filter, ArrowLeft } from "@/components/icons";
import { ProductSkeleton } from "@/components/ui/ProductSkeleton";
import { useDeviceType } from "@/hooks/useDeviceType";
import { productHasColor, productHasSize } from "@shared/index";
import { useDebounce } from "@/hooks/useDebounce";

export function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Debounce search to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || null,
  );
  // Filtros de la lista de productos (independientes del Quick Add panel)
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { isMobile } = useDeviceType();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 60000]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { products, isLoadingList, isRefreshingList, error } = useProductsStore();
  const fetchProducts = useProductsStore.getState().fetchProducts;
  // Quick Add Sidebar (right drawer — desktop)
  const quickAddSidebar = useQuickAddSidebar();
  const openQuickAddSidebar = useOpenQuickAddSidebar();
  const resetSidebar = useResetSidebar();

  // Quick Add BottomSheet (mobile)
  const openQuickAdd = useOpenQuickAdd();
  const { categories: allCategories, fetchCategories } = useCategoriesStore();

  // Fetch categories and colors on mount
  useEffect(() => {
    fetchCategories();
    productsApi.getColors().then(setAvailableColors).catch(console.error);
  }, [fetchCategories]);

  // Price bounds
  const minPrice = useMemo(
    () => products?.reduce((min, p) => Math.min(min, p.price), Infinity) || 0,
    [products],
  );
  const maxPrice = useMemo(
    () => products?.reduce((max, p) => Math.max(max, p.price), 0) || 60000,
    [products],
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (params.toString()) {
      setSearchParams(params);
    } else {
      setSearchParams({});
    }
  }, [searchQuery, selectedCategory, setSearchParams]);

  const categories = useMemo(() => {
    // Count products per category
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

    // Map all categories from store with product counts
    return allCategories.map((cat) => ({
      name: cat.name,
      count: productCounts.get(cat.name) || 0,
      active: cat.name === selectedCategory,
    }));
  }, [products, selectedCategory, allCategories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];

    // Category filter - handle both populated object and ObjectId
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

    // Search filter - using debounced value
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query),
      );
    }

    // Size filter
    if (filterSize) {
      filtered = filtered.filter((p) => productHasSize(p, filterSize));
    }

    if (filterColor) {
      filtered = filtered.filter((p) => productHasColor(p, filterColor));
    }

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    // Sort
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
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [products, selectedCategory, debouncedSearchQuery, filterSize, filterColor, priceRange, sortBy]);

  // Infinite scroll
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

  const handleQuickAdd = useCallback((productId: string) => {
    // Desktop → sidebar derecho; Mobile (y tablet chica) → BottomSheet
    if (isMobile) {
      openQuickAdd(productId);
    } else {
      openQuickAddSidebar(productId);
    }
  }, [isMobile, openQuickAdd, openQuickAddSidebar]);

  // Active filters for display
  const activeFilters: ActiveFilter[] = useMemo(() => [
    ...(selectedCategory
      ? [{ id: "category", label: "Categoría", value: selectedCategory }]
      : []),
    ...(filterSize
      ? [{ id: "size", label: "Talla", value: filterSize }]
      : []),
    ...(filterColor
      ? [{ id: "color", label: "Color", value: filterColor }]
      : []),
  ], [selectedCategory, filterSize, filterColor]);

  const removeFilter = useCallback((id: string) => {
    if (id === "category") setSelectedCategory(null);
    if (id === "size") setFilterSize(null);
    if (id === "color") setFilterColor(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setFilterSize(null);
    setFilterColor(null);
    setSearchQuery("");
  }, []);

  const handleCategoryClick = useCallback((categoryName: string) => {
    setSelectedCategory(prevCategory =>
      prevCategory === categoryName ? null : categoryName
    );
  }, []);

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

  const effectiveVariant = view;

  return (
    <>
      <PublicHeader />

      {isRefreshingList && (
        <div className="bg-primary-container/30 text-primary text-center text-xs py-1.5 font-label uppercase tracking-wider">
          Actualizando catálogo…
        </div>
      )}

      <PageContainer>
      
            <div className="text-center mt-8">
                <BackButton label="Volver" showLabelOnMobile={true} />
            </div>

        {/* Active Filters */}
        <ActiveFilters
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={activeFilters.length > 1 ? clearAllFilters : undefined}
        />

      <div className="flex flex-col lg:flex-row gap-8 md:gap-16">
        {/* Mobile Filter Button */}
          <div className="lg:hidden px-4">
            <button
              onClick={() => setShowFiltersDrawer(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-outline-variant/40 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-surface-container min-h-[44px]"
            >
              <Filter size={18} />
              Filtrar productos
            </button>
          </div>

            {/* Filtros Laterales */}
            <div className="hidden lg:block">
            <SidebarFilters
              categories={categories}
              colors={availableColors}
              sizes={["XS", "S", "M", "L", "XL"]}
              selectedSize={filterSize || undefined}
              selectedColor={filterColor}
              onSizeChange={(size) => setFilterSize(size || null)}
              onColorChange={setFilterColor}
              onCategoryClick={handleCategoryClick}
            />
            </div>

           {/* Drawer for mobile filters */}
           <Drawer
             isOpen={showFiltersDrawer}
             onClose={() => setShowFiltersDrawer(false)}
             title="Filtros"
           >
             <div className="space-y-6">
                <SidebarFilters
                  categories={categories}
                  colors={availableColors}
                  sizes={["XS", "S", "M", "L", "XL"]}
                  selectedSize={filterSize || undefined}
                  selectedColor={filterColor}
                  onSizeChange={(size) => setFilterSize(size || null)}
                  onColorChange={setFilterColor}
                  onCategoryClick={handleCategoryClick}
                />
               <PriceRangeFilter
                 minPrice={minPrice}
                 maxPrice={maxPrice}
                 value={priceRange}
                 onChange={setPriceRange}
               />
             </div>
           </Drawer>

          {/* Grid de Productos */}
          <section className="flex-1 px-4 lg:px-0">
            {/* Top Bar with count, sort and view toggle */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-on-surface-variant font-body">
                  Mostrando {filteredProducts.length} producto
                  {filteredProducts.length !== 1 ? "s" : ""}
                </p>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
              <ViewToggle view={view} onChange={setView} />
            </div>

            {isInitialLoad ? (
              <div aria-busy="true" aria-label="Cargando productos">
                <p className="text-sm text-on-surface-variant text-center mb-6">
                  Preparando nuestro catálogo…
                </p>
                <ProductSkeleton count={12} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-on-surface-variant font-body text-lg">
                  {searchQuery || selectedCategory
                    ? "Ningún producto coincide con tus filtros."
                    : "Aún no hay productos disponibles."}
                </p>
                {/* Clear filters button */}
                     {(searchQuery || selectedCategory || filterSize || filterColor) && (
                       <button
                         onClick={clearAllFilters}
                         className="mt-4 font-label text-sm uppercase tracking-widest text-primary hover:underline min-h-[44px]"
                       >
                         Ver todos los productos
                       </button>
                     )}
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                      ? "grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-y-12 stagger-children"
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
                      variant={effectiveVariant}
                      onAddToCart={handleQuickAdd}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {visibleCount < filteredProducts.length && (
              <div ref={loadMoreRef} className="h-10" />
            )}
          </section>
        </div>
        </PageContainer>

      {/* ══ Cart Sidebar (derecho, desktop) ══ */}
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
