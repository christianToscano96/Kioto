import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProductsStore } from "@/store/products";
import { useCategoriesStore } from "@/store/categories";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useQuickAddSidebar, useOpenQuickAddSidebar, useCloseQuickAddSidebar } from "@/store/ui";
import { useQuickAddPanel, useOpenQuickAdd, useCloseQuickAdd } from "@/store/ui";
import { useSetQuickAddSize, useSetQuickAddColor, useSetQuickAddQuantity, useResetQuickAdd } from "@/store/ui";
import { useToast } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/ui/Container";
import { ProductCardUnified } from "@/components/ui/ProductCardUnified";
import { Drawer } from "@/components/ui/Drawer";
import { CartSidebar } from "@/components/ui/CartSidebar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ProductVariant } from "@shared/index";
import { Heart, Minus, Plus } from '@/components/icons';
import { 
  Skeleton, 
  ProductSkeleton,
  CategorySkeleton 
} from '@/components/ui/ProductSkeleton';
import comprandoVideo from '../../../assets/comprando.webm';
import fleteVideo from '../../../assets/flete.webm';
import kiotoVideo from '../../../assets/kioto.webm';
import { CategorySection } from '@/components/home/CategorySection';
import { useDeviceType } from "@/hooks/useDeviceType";

export function HomePage() {
  const { products, isLoading, fetchProducts } = useProductsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const { isMobile } = useDeviceType();

  // Quick Add Sidebar (right drawer — desktop)
  const quickAddSidebar = useQuickAddSidebar();
  const openQuickAddSidebar = useOpenQuickAddSidebar();
  const resetSidebar = useUiStore.getState().resetSidebar;

  // Quick Add BottomSheet (mobile — existente)
  const quickAddPanel = useQuickAddPanel();
  const openQuickAdd = useOpenQuickAdd();
  const closeQuickAdd = useCloseQuickAdd();
  const setQuickAddSize = useSetQuickAddSize();
  const setQuickAddColor = useSetQuickAddColor();
  const setQuickAddQuantity = useSetQuickAddQuantity();
  const resetQuickAdd = useResetQuickAdd();
  const { addToast } = useToast();

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

  if (isLoading) {
    return (
      <>
        <Header />
        <main>
          <PageContainer>
            {/* Hero Banner Skeleton */}
            <section className="py-16 border-b border-outline-variant/10">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="flex-1 max-w-xl space-y-4">
                  <Skeleton className="h-10 w-36 rounded-full mb-6" />
                  <Skeleton className="h-12 w-full rounded mb-4" />
                  <Skeleton className="h-8 w-full rounded mb-4" />
                  <Skeleton className="h-8 w-3/4 rounded mb-8" />
                  <Skeleton className="h-12 w-40 rounded-full" />
                </div>
                <div className="flex-1 w-full">
                  <Skeleton className="aspect-video w-full max-w-lg rounded-2xl" />
                </div>
              </div>
            </section>

            {/* Categories Skeleton */}
            <section className="py-8">
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            </section>

            {/* New Arrivals Skeleton */}
            <section className="py-12">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <ProductSkeleton count={10} />
            </section>
          </PageContainer>
        </main>
        <Footer />
        {/* <BottomNav /> */}
      </>
    );
  }

  return (
    <>
      <Header />

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
                      <video
                        src={kiotoVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        disablePictureInPicture
                        preload="none"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
            </div>
          </section>
  
          {/* Categories Section */}
          <CategorySection categories={categories} />

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
              {newProducts.map((product) => (
                <ProductCardUnified
                  key={product._id}
                  product={product}
                  onAddToCart={handleQuickAdd}
                />
              ))}
            </div>
          </section>

          {/* Promotional Banner */}
            <div className="flex flex-col lg:flex-row gap-4 animate-on-scroll">
              {/* Video */}
              <div className="flex-1 rounded-md overflow-hidden aspect-video">
                <video
                  src={comprandoVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  preload="none"
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
                <video
                  src={fleteVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  preload="none"
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

        {/* ══ BottomSheet de Quick Add (mobile) ══ */}
        {quickAddPanel.productId && (() => {
          const product = products?.find((p) => p._id === quickAddPanel.productId);
          if (!product) return null;

          const variants = (product.variants as ProductVariant[]) || [];
          const activeVariants = variants.filter(v => (v.colorStock || []).length > 0);

          const getColorStockMap = (size: string): Record<string, number> => {
            const variant = variants.find(v => v.size === size);
            if (!variant) return {};
            return (variant.colorStock || []).reduce((acc, c) => {
              acc[c.name] = c.stock || 0;
              return acc;
            }, {} as Record<string, number>);
          };

          const availableColors = quickAddPanel.selectedSize
            ? Object.keys(getColorStockMap(quickAddPanel.selectedSize))
            : [];

          const getMaxStock = () => {
            if (!quickAddPanel.selectedSize) return 0;
            const map = getColorStockMap(quickAddPanel.selectedSize);
            if (quickAddPanel.selectedColor) return map[quickAddPanel.selectedColor] ?? 0;
            return Object.values(map).reduce((s, n) => s + n, 0);
          };

          const maxStock = getMaxStock();

          const canAddToCart = (): string | null => {
            if (!quickAddPanel.selectedSize) return 'Seleccioná una talla';
            if (availableColors.length > 1 && !quickAddPanel.selectedColor) return 'Seleccioná un color';
            if (maxStock === 0) return 'Sin stock disponible';
            if (quickAddPanel.quantity > maxStock) return 'Stock insuficiente';
            return null;
          };

          const handleSubmit = async () => {
            const error = canAddToCart();
            if (error) {
              addToast({ type: 'error', title: error });
              return;
            }
            const finalColor = quickAddPanel.selectedColor
              || (availableColors.length === 1 ? availableColors[0] : undefined);

            try {
              await addToCart(product, quickAddPanel.quantity, quickAddPanel.selectedSize, finalColor || undefined);
              addToast({ type: 'success', title: '¡Agregado!', message: `${product.name} fue agregado al carrito` });
              resetQuickAdd();
            } catch {
              addToast({ type: 'error', title: 'Error', message: 'No se pudo agregar' });
            }
          };

          return (
            <BottomSheet
              isOpen={true}
              onClose={resetQuickAdd}
              title={
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-on-surface-variant">
                        Sin img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">{product.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-label">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              }
              maxHeight="90%"
              closable
            >
              <div className="space-y-4 py-2">
                {activeVariants.length > 0 && (
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Talla</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeVariants.map((v) => {
                        const totalStock = (v.colorStock || []).reduce((s, c) => s + (c.stock || 0), 0);
                        const isOut = totalStock === 0;
                        const isActive = quickAddPanel.selectedSize === v.size;
                        return (
                          <button
                            key={v.size}
                            onClick={() => {
                              setQuickAddSize(v.size);
                              setQuickAddColor("");
                              setQuickAddQuantity(1);
                            }}
                            disabled={isOut}
                            className={`
                              min-w-[40px] h-9 px-3 text-sm rounded-lg border transition-all font-medium
                              ${isActive
                                ? "bg-primary text-on-primary border-primary"
                                : isOut
                                  ? "border-outline-variant/30 text-on-surface-variant/40 opacity-50 cursor-not-allowed line-through"
                                  : "border-outline-variant active:scale-95"
                              }
                            `}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quickAddPanel.selectedSize && availableColors.length > 0 && (
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => {
                        const cs = getColorStockMap(quickAddPanel.selectedSize)[color] ?? 0;
                        const isOut = cs === 0;
                        const isActive = quickAddPanel.selectedColor === color;
                        return (
                          <button
                            key={color}
                            onClick={() => !isOut && setQuickAddColor(color)}
                            disabled={isOut}
                            className={`
                              w-9 h-9 rounded-full border-2 transition-all
                              ${isActive
                                ? "border-primary scale-110 ring-2 ring-primary/25"
                                : isOut
                                  ? "border-outline-variant/25 opacity-35 cursor-not-allowed grayscale"
                                  : "border-outline-variant active:scale-90"
                              }
                            `}
                            style={{ backgroundColor: color }}
                            title={`${color}${cs > 0 ? ` · ${cs} en stock` : ' · Agotado'}`}
                          />
                        );
                      })}
                    </div>
                    {quickAddPanel.selectedColor && (
                      <p className="mt-1.5 text-[10px] font-mono text-primary">
                        {quickAddPanel.selectedColor} · {getColorStockMap(quickAddPanel.selectedSize)[quickAddPanel.selectedColor]} unidades
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuickAddQuantity(Math.max(1, quickAddPanel.quantity - 1))}
                      disabled={quickAddPanel.quantity <= 1}
                      className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center tabular-nums">{quickAddPanel.quantity}</span>
                    <button
                      onClick={() => setQuickAddQuantity(Math.min(maxStock || 99, quickAddPanel.quantity + 1))}
                      disabled={quickAddPanel.quantity >= (maxStock || 99)}
                      className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!!canAddToCart()}
                    className="bg-primary text-on-primary font-label text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </BottomSheet>
          );
        })()}

      </main>
      <Footer />
      {/* <BottomNav /> */}
    </>
  );
}
