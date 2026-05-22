import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProductsStore } from "@/store/products";
import { useCategoriesStore } from "@/store/categories";
import { useQuickAddSidebar, useOpenQuickAddSidebar, useResetSidebar } from "@/store/ui";
import { useOpenQuickAdd } from "@/store/ui";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/ui/Container";
import { ProductCardUnified } from "@/components/ui/ProductCardUnified";
import { Drawer } from "@/components/ui/Drawer";
import { CartSidebar } from "@/components/ui/CartSidebar";
import { QuickAddBottomSheet } from "@/components/ui/QuickAddBottomSheet";
import { Heart } from '@/components/icons';
import { 
  ProductSkeleton,
  CategorySkeleton 
} from '@/components/ui/ProductSkeleton';
import { LazyVideo } from '@/components/ui/LazyVideo';
import { CategorySection } from '@/components/home/CategorySection';
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePrefetchCriticalRoutes } from "@/hooks/usePrefetchRoute";

export function HomePage() {
  const { products, isLoadingList, isRefreshingList, error, fetchProducts } = useProductsStore();
  const { categories, isLoadingList: categoriesLoading, fetchCategories } = useCategoriesStore();
  const { isMobile } = useDeviceType();
  
  // Prefetch critical routes
  usePrefetchCriticalRoutes();

  // Quick Add Sidebar (right drawer — desktop)
  const quickAddSidebar = useQuickAddSidebar();
  const openQuickAddSidebar = useOpenQuickAddSidebar();
  const resetSidebar = useResetSidebar();

  // Quick Add BottomSheet (mobile — existente)
  const openQuickAdd = useOpenQuickAdd();

  const handleQuickAdd = (productId: string) => {
    if (isMobile) {
      openQuickAdd(productId);
    } else {
      openQuickAddSidebar(productId);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const newProducts = useMemo(
    () => products?.slice(0, 10) || [],
    [products]
  );

  const saleProducts = useMemo(
    () => products?.filter((p) => p.price < 50).slice(0, 6) || [],
    [products]
  );

  const showProductSkeleton = isLoadingList && products.length === 0;
  const showCategorySkeleton = categoriesLoading && categories.length === 0;

  return (
    <>
      <Header />

      {isRefreshingList && (
        <div className="bg-primary-container/30 text-primary text-center text-xs py-1.5 font-label uppercase tracking-wider">
          Actualizando catálogo…
        </div>
      )}

      <main>
      

        {/* Welcome Banner - Feminine Elegant Style */}
        <PageContainer>
          <section className="bg-surface py-16 border-b border-outline-variant/10">
            <div className="flex flex-col lg:flex-row gap-12 items-center justify-beteween">
              {/* Left Content */}
              <div className="flex-1 max-w-xl">
                {/* Soft Badge */}
                <div className="inline-flex items-center gap-2 bg-primary-container/30 text-primary font-medium text-xs px-4 py-2 rounded-md mb-6 animate-fade-in">
                  <Heart size={14} className="text-primary text-sm" />
                  Prendas elegidas con amor 
                </div>
                
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-on-surface mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Tu Momento, <span className="text-primary">Tu Estilo</span>
                </h1>
                
                <p className="text-on-surface-variant text-base md:text-lg mb-8 max-w-md animate-fade-in" style={{ animationDelay: '200ms' }}>
                  Prendas únicas para realzar tu esencia. Calidad premium y detalles que amas.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-medium text-sm px-8 py-3.5 rounded-md hover:bg-primary-hover transition-all shadow-md hover:shadow-lg"
                  >
                    Ver Catálogo
                  </Link>
                </div>
              </div>
              
              {/* Right Video */}
                <div className="flex-1 relative w-full max-w-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="relative rounded-2xl overflow-hidden max-w-lg">
                      <div className="aspect-video">
                        <LazyVideo
                          src="/assets/kioto.webm"
                          autoPlay
                          muted
                          loop
                          playsInline
                          disablePictureInPicture
                          poster="/assets/logo-C0h7ZzoF.png"
                          className="w-full h-full object-cover"
                        />
                    </div>
                  </div>
                </div>
            </div>
          </section>
  
          {/* Categories Section */}
          {showCategorySkeleton ? (
            <section className="py-8" aria-busy="true" aria-label="Cargando categorías">
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            </section>
          ) : (
            <CategorySection categories={categories} />
          )}

          {/* Sale Banner */}
          {saleProducts.length > 0 && (
            <section className="bg-gradient-to-r from-amber-500 to-amber-400 text-white py-8 animate-on-scroll">
              <div className="text-center mb-6">
                <h2 className="font-serif text-3xl font-bold mb-2">
                  ¡Ofertas del Día!
                </h2>
                <p className="font-body">
                  Descuentos exclusivos por tiempo limitado
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 stagger-children">
                {saleProducts.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="bg-white/10 backdrop-blur-sm rounded-md p-3 text-center hover:bg-white/20 transition-colors"
                  >
                    <div className="aspect-square bg-white/20 rounded mb-2 overflow-hidden">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          width={200}
                          height={200}
                          loading="lazy"
                        />
                      )}
                    </div>
                    <p className="text-xs font-bold">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs line-through opacity-70">
                      ${(product.price * 1.5).toFixed(2)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* New Arrivals Grid */}
          <section className="py-12 relative animate-on-scroll">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-on-surface">
                  Nuevos Ingresos
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Descubre las últimas tendencias
                </p>
              </div>
              <Link
                to="/products?sort=newest"
                className="text-primary font-label uppercase tracking-wider text-xs hover:underline"
              >
                Ver todo
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
              {showProductSkeleton ? (
                <div className="col-span-full" aria-busy="true" aria-label="Cargando productos">
                  <p className="text-sm text-on-surface-variant text-center mb-4">
                    Preparando nuestro catálogo…
                  </p>
                  <ProductSkeleton count={10} />
                </div>
              ) : error && products.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-on-surface-variant mb-4">
                    No pudimos cargar los productos. El servidor puede estar despertando.
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchProducts()}
                    className="inline-flex items-center justify-center bg-primary text-on-primary font-medium text-sm px-6 py-2.5 rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                newProducts.map((product) => (
                  <ProductCardUnified
                    key={product._id}
                    product={product}
                    onAddToCart={handleQuickAdd}
                  />
                ))
              )}
            </div>
          </section>

          {/* Promotional Banner */}
            <div className="flex flex-col lg:flex-row gap-4 animate-on-scroll">
              {/* Video */}
              <div className="flex-1 rounded-md overflow-hidden aspect-video">
                 <LazyVideo
                   src="/assets/comprando.webm"
                   autoPlay
                   muted
                   loop
                   playsInline
                   disablePictureInPicture
                   poster="/assets/logo-C0h7ZzoF.png"
                   className="w-full h-full object-cover"
                 />
              </div>
              {/* Text Content */}
              <div className="flex-1 bg-surface-container rounded-md p-6 flex items-center">
                <div className="max-w-md">
                  <h2 className="font-serif text-2xl font-bold text-on-surface mb-3">
                    La magia de encontrar el detalle ideal
                  </h2>
                  <p className="text-on-surface-variant mb-4 text-sm">
                    Sabemos que quieres sorprender, y nosotros estamos aquí para ayudarte a lograrlo. Hemos traído este producto a nuestra tienda porque combina todo lo que buscas: estilo, utilidad y esa chispa de emoción. Es la forma más sencilla de entregar un abrazo en forma de paquete.
                  </p>
                  <Link
                    to="/products"
                    className="inline-block bg-primary text-on-primary font-label uppercase tracking-widest text-xs px-4 py-2 rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Ver Catálogo
                  </Link>
                </div>
              </div>
            </div>
          {/* Shipping Banner - Todo el País */}
            <div className="flex flex-col lg:flex-row gap-4 mt-2 animate-on-scroll">
              {/* Text Content */}
              <div className="flex-1 bg-surface-container rounded-md p-6 flex items-center">
                <div className="max-w-md">
                  <div className="inline-flex items-center gap-2 bg-primary-container/20 rounded-md px-3 py-1 mb-3">
                    <span className="material-symbols-outlined text-base text-primary">
                      local_shipping
                    </span>
                    <span className="font-label uppercase tracking-wider text-xs text-primary font-medium">
                      Envíos a Todo el País
                    </span>
                  </div>
                  
                  <h2 className="font-serif text-2xl font-bold text-on-surface mb-2">
                    Recibe en Casa
                  </h2>
                  
                  <p className="text-on-surface-variant mb-4 text-sm">
                    Envíos gratis en compras mayores a $70000. 
                    Entrega en 24-48 horas en zonas cercanas.
                  </p>
                  
                  <div className="space-y-2 stagger-children">
                    {[
                      { icon: 'check_circle', text: 'Seguimiento en tiempo real' },
                      { icon: 'check_circle', text: 'Empaque seguro' },
                      { icon: 'check_circle', text: 'Garantía de satisfacción' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-on-surface text-sm">
                        <span className="material-symbols-outlined text-primary text-sm">
                          {item.icon}
                        </span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 rounded-md overflow-hidden aspect-video">
                <LazyVideo
                  src="/assets/flete.webm"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/logo-C0h7ZzoF.png"
                  className="w-full h-full object-cover"
                />
              </div>
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

        <QuickAddBottomSheet products={products} />

      </main>
      <Footer />
      {/* <BottomNav /> */}
    </>
  );
}
