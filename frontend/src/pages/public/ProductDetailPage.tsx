import { Heart, Share2, Minus, Plus, ChevronDown, Loader2 } from '@/components/icons';

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCartIsSyncing, useCartStore } from "@/store/cart";
import { useProductsStore, useProductsError } from "@/store/products";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SizeSelector } from "@/components/ui/SizeSelector";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { ColorSwatch } from "@/components/ui/ColorSwatch";
import type { Product } from "../../../../shared/src/index";
import { showToast } from "@/components/ui/Toast";
import { BackButton } from '@/components/ui/BackButton';


// Accordion Section Component

// Accordion Section Component
const AccordionSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <details className="group py-6 border-b border-dashed border-outline-variant/40">
    <summary className="flex justify-between items-center cursor-pointer list-none">
      <span className="text-sm font-bold uppercase tracking-widest font-label">
        {title}
      </span>
      <ChevronDown className="transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-4 text-sm text-on-surface-variant leading-relaxed space-y-2">
      {children}
    </div>
  </details>
);

// Related Product Card Component
const RelatedProductCard = ({ product }: { product: Product }) => {
   const totalStock = product.variants && product.variants.length > 0
      ? product.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
      : product.stock;

  return (
    <div className="min-w-[160px] sm:min-w-[280px] bg-surface-container-highest rounded-xl p-3 sm:p-4 snap-start group transition-all duration-300 hover:shadow-lg">
     
      <div className="aspect-[3/4] overflow-hidden mb-3 sm:mb-4 rounded-lg relative">
        <img
          src={
            product.images?.[0] ||
            "https://placehold.co/400x500/fdfae9/99452c?text=Product"
          }
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            totalStock === 0 ? "grayscale opacity-60" : ""
          }`}
          width={400}
          height={500}
          loading="eager"
        />
        {totalStock === 0 && (
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-error text-on-primary text-[10px] uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-label">
            Agotado
          </div>
        )}
      </div>
      <h3 className="text-base sm:text-lg font-serif text-on-surface line-clamp-1">{product.name}</h3>
      <p className="text-sm mt-1 text-on-surface-variant font-serif">
        ${product.price.toFixed(2)}
      </p>
    </div>
  );
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const product = useProductsStore((state) => state.product);
  const isLoadingDetail = useProductsStore((state) => state.isLoadingDetail);
  const productsError = useProductsError();
  const { products: allProducts } = useProductsStore();
  const { addToCart, isSyncing } = useCartStore();

  // Fetch product when id changes
  useEffect(() => {
    if (id) {
      useProductsStore.getState().fetchProduct(id);
    }
  }, [id]);

  // Fetch related products on mount only
  useEffect(() => {
    useProductsStore.getState().fetchProducts();
  }, []);

// Default sizes if not provided by product - only use variants or original sizes
     const sizes = product?.variants?.map(v => v.size) || product?.sizes || [];
     
     // Calculate total stock
     const totalStock = product?.variants && product.variants.length > 0
       ? product.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
       : product?.stock ?? 0;
     
     // Get stock for selected size
     const getSelectedSizeStock = () => {
       if (!selectedSize) {
         // If no size selected and no variants, return base stock
         if (!product?.variants || product.variants.length === 0) {
           return product?.stock ?? 0;
         }
         return 0;
       }
       if (product?.variants) {
         const variant = product.variants.find(v => v.size === selectedSize);
         return variant?.stock ?? 0;
       }
       return product?.stock ?? 0;
     };
     
     const selectedSizeStock = getSelectedSizeStock();
     const availableStock = product?.variants && product.variants.length > 0 ? selectedSizeStock : totalStock;

const handleAddToCart = async () => {
      if (!product || isAddingToCart || isSyncing) return;
      
      // Validate stock
      if (product.variants && product.variants.length > 0) {
        // Size-based product: require selected size
        if (!selectedSize) return;
        const selectedVariant = product.variants.find(v => v.size === selectedSize);
        if (!selectedVariant || (selectedVariant.stock ?? 0) < quantity) {
          showToast({ type: 'error', title: 'Stock insuficiente' });
          return;
        }
      } else if (product.stock < quantity) {
        // Non-size-based product: check base stock
        showToast({ type: 'error', title: 'Stock insuficiente' });
        return;
      }
     
 setIsAddingToCart(true);
      try {
        await addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
        showToast({ type: 'success', title: 'Producto agregado al carrito' });
      } catch (err) {
       console.error("Failed to add to cart:", err);
        showToast({ type: 'error', title: 'Error al agregar al carrito' });
     } finally {
       setIsAddingToCart(false);
     }
   };

  if (isLoadingDetail && !product) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[600px] bg-background">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </>
    );
  }

  if (productsError || !product) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="p-4 bg-primary-container text-on-primary rounded-lg text-center">
            Producto no encontrado o error al cargar.
          </div>
        </div>
      </>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://placehold.co/800x1000/fdfae9/1c1c12?text=Product"];

return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 mt-8 sm:mt-12">
      <div className="text-center mt-6">
        <BackButton label="Volver" showLabelOnMobile={true} page='product-detail' />
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
          {/* Product Image Section */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Main Image */}
            <div className="relative bg-surface-container-low overflow-hidden rounded-lg">
              <img
                src={images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-auto object-cover"
                width={800}
                height={1000}
                loading="eager"
              />
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`bg-surface-container rounded-lg overflow-hidden h-32 sm:h-64 transition-all ${
                      selectedImageIndex === index ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={200}
                      height={200}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 lg:border-l lg:border-dashed lg:border-outline-variant/40 lg:pl-16">
            {/* Breadcrumbs */}
            <nav className="mb-6 sm:mb-8">
              <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant font-label">
                Colecciones / Knitwear
              </span>
            </nav>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-on-surface mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-2xl sm:text-3xl font-serif text-primary mb-6 sm:mb-8">
              ${product.price.toFixed(2)}
            </p>

            {/* Product Description */}
            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
              <p className="text-on-surface-variant leading-relaxed text-base">
                {product.description ||
                  "Cosecha de altas montañas donde el aire es puro. Esta prenda es una conversación entre la tierra y quien la lleva."}
              </p>
              <p className="text-on-surface-variant italic border-l-2 border-primary/20 pl-4">
                "Una pieza que no solo se lleva, sino que se vive."
              </p>
            </div>

{/* Selectors & Add to Cart */}
              <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
{/* Stock Indicator - only for size-based products */}
              {sizes.length > 0 && selectedSizeStock === 0 && selectedSize && (
                <p className="text-sm text-error font-medium mb-4">
                  Agotado - Próximamente disponible
                </p>
              )}
              {sizes.length > 0 && selectedSizeStock > 0 && selectedSizeStock <= 5 && (
                <p className="text-sm text-verde-bosque-600 font-medium mb-4">
                  ¡Últimas {selectedSizeStock} unidades disponibles!
                </p>
              )}
              {/* Low stock for non-size products */}
              {sizes.length === 0 && totalStock <= 5 && totalStock > 0 && (
                <p className="text-sm text-verde-bosque-600 font-medium mb-4">
                  ¡Últimas {totalStock} unidades disponibles!
                </p>
              )}

{/* Size Selector - only show if product has variants */}
               {sizes.length > 0 && (
                 <SizeSelector
                   sizes={sizes}
                   selectedSize={selectedSize}
                   onSelectSize={setSelectedSize}
                   variants={product.variants}
                 />
               )}

               {/* Color Selector */}
               {product.colors && product.colors.length > 0 && (
                 <ColorSwatch
                   colors={product.colors}
                   selectedColor={selectedColor}
                   onSelectColor={setSelectedColor}
                 />
               )}

{/* Quantity Selector */}
                <div className="mt-6 sm:mt-8">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-label">
                    Cantidad
                  </span>
                  <QuantitySelector
                    quantity={quantity}
                    maxStock={availableStock}
                    onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
                    onIncrement={() => setQuantity(Math.min(quantity + 1, availableStock))}
                    disabled={availableStock === 0}
                  />
                </div>

{/* Add to Cart Button */}
                 <button
                   onClick={handleAddToCart}
                   disabled={(sizes.length > 0 && !selectedSize) || isSyncing || isAddingToCart || availableStock === 0}
                   className="w-full bg-primary-container text-on-primary-container py-4 sm:py-5 rounded-lg font-bold uppercase tracking-widest font-label hover:bg-primary transition-all duration-300 shadow-md disabled:opacity-50 mt-6 sm:mt-8 min-h-[44px]"
               >
                 {availableStock === 0
                   ? "Agotado"
                   : isSyncing || isAddingToCart
                   ? "Añadiendo..."
                   : "Añadir al Carrito"}
               </button>
              </div>

             {/* Social & Wishlist */}
             <div className="flex items-center gap-6 pt-6 sm:pt-8 border-t border-dashed border-outline-variant/40">
               <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors min-h-[44px]">
                 <Heart size={16} />
                 Guardar en favoritos
               </button>
               <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors min-h-[44px]">
                 <Share2 size={16} />
                 Compartir
               </button>
             </div>

             {/* Accordions */}
             <div className="space-y-0 border-t border-dashed border-outline-variant/40 pt-6 sm:pt-8">
               <AccordionSection title="Material & Cuidado">
                 <p>
                   {product.materials ||
                     "100% Wool orgánico. Lavar a mano con agua fría y jabón neutro. Secar a la sombra."}
                 </p>
               </AccordionSection>

               <AccordionSection title="Información de Envío">
                 <p>
                   Entrega estándar en 5-7 días hábiles. Nuestro embalaje es 100%
                   libre de plástico.
                 </p>
               </AccordionSection>
             </div>
           </div>
         </div>

         {/* Complete the Look Section */}
         {allProducts && allProducts.length > 1 && (
           <section className="mt-24 sm:mt-32">
             <h2 className="text-2xl sm:text-3xl font-serif mb-8 sm:mb-12 italic">
               Completa el Look
             </h2>
             <div className="bg-surface-container-low p-4 sm:p-8 rounded-xl overflow-x-auto flex gap-4 sm:gap-8 snap-x">
               {allProducts.slice(0, 3).map((relatedProduct) => (
                 <RelatedProductCard
                   key={relatedProduct._id}
                   product={relatedProduct}
                 />
               ))}
             </div>
           </section>
         )}
       </main>
       <Footer />
       {/* <BottomNav /> */}
     </>
   );
}
