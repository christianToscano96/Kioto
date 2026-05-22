import { Heart, Share2, ChevronDown, Loader2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCartStore } from '@/store/cart';
import { useProductsStore, useProductsError } from '@/store/products';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductVariantPicker, ProductAddToCartCta } from '@/components/ui/ProductVariantPicker';
import type { Product } from '@shared/index';
import { showToast } from '@/components/ui/Toast';
import { BackButton } from '@/components/ui/BackButton';
import { useProductStock } from '@/hooks/useProductStock';
import { usePrefetchProductDetail } from '@/hooks/usePrefetchProductDetail';
import { getTotalStock } from '@shared/index';
import { getQuickAddError } from '@/lib/quickAddStock';
import {
  ADD_TO_CART_FAILURE_MESSAGE,
  getAddToCartSuccessToast,
  getSelectionSummary,
} from '@/lib/variantSelection';

const AccordionSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <details className="group py-6 border-b border-dashed border-outline-variant/40">
    <summary className="flex justify-between items-center cursor-pointer list-none">
      <span className="text-sm font-bold uppercase tracking-widest font-label">{title}</span>
      <ChevronDown className="transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-4 text-sm text-on-surface-variant leading-relaxed space-y-2">{children}</div>
  </details>
);

const RelatedProductCard = ({ product }: { product: Product }) => {
  const totalStock = getTotalStock(product);
  const { prefetchProps } = usePrefetchProductDetail(product._id);

  return (
    <Link
      to={`/products/${product._id}`}
      className="min-w-[160px] sm:min-w-[280px] bg-surface-container-highest rounded-xl p-3 sm:p-4 snap-start group transition-all duration-300 hover:shadow-lg block"
      {...prefetchProps}
    >
      <div className="aspect-[3/4] overflow-hidden mb-3 sm:mb-4 rounded-lg relative">
        <img
          src={product.images?.[0] || 'https://placehold.co/400x500/fdfae9/99452c?text=Product'}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            totalStock === 0 ? 'grayscale opacity-60' : ''
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
      <p className="text-sm mt-1 text-on-surface-variant font-serif">${product.price.toFixed(2)}</p>
    </Link>
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
  const isLoading = useProductsStore((state) => state.isLoading);
  const productsError = useProductsError();
  const { products: allProducts } = useProductsStore();
  const { addToCart, isSyncing } = useCartStore();

  const { resolveSelection } = useProductStock(product);

  useEffect(() => {
    if (id) {
      useProductsStore.getState().fetchProduct(id);
    }
  }, [id]);

  useEffect(() => {
    useProductsStore.getState().fetchProducts();
  }, []);

  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  }, [product?._id]);

  const handleAddToCart = async () => {
    if (!product || isAddingToCart || isSyncing) return;

    const selection = {
      selectedSize: selectedSize || '',
      selectedColor: selectedColor || '',
      quantity,
    };

    const error = getQuickAddError(product, selection);
    if (error) {
      showToast({ type: 'error', title: error });
      return;
    }

    try {
      const resolved = resolveSelection({
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      });

      setIsAddingToCart(true);
      await addToCart(
        product,
        quantity,
        resolved.resolvedSize,
        resolved.resolvedColor,
      );
      showToast({ type: 'success', ...getAddToCartSuccessToast(product, selection) });
    } catch (err) {
      console.error('Failed to add to cart:', err);
      showToast({ type: 'error', title: ADD_TO_CART_FAILURE_MESSAGE });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
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
      : ['https://placehold.co/800x1000/fdfae9/1c1c12?text=Product'];

  const selection = {
    selectedSize: selectedSize || '',
    selectedColor: selectedColor || '',
    quantity,
  };

  const selectionSummary = getSelectionSummary(product, selection);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 mt-8 sm:mt-12 pb-28 lg:pb-12">
        <div className="text-center mt-6">
          <BackButton label="Volver" showLabelOnMobile={true} page="product-detail" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
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

            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`bg-surface-container rounded-lg overflow-hidden h-32 sm:h-64 transition-all ${
                      selectedImageIndex === index ? 'ring-2 ring-primary' : ''
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

          <div className="lg:col-span-5 lg:border-l lg:border-dashed lg:border-outline-variant/40 lg:pl-16">
            <nav className="mb-6 sm:mb-8">
              <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant font-label">
                Colecciones / Knitwear
              </span>
            </nav>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-on-surface mb-4 leading-tight">
              {product.name}
            </h1>

            <p className="text-2xl sm:text-3xl font-serif text-primary mb-6 sm:mb-8">
              ${product.price.toFixed(2)}
            </p>

            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
              <p className="text-on-surface-variant leading-relaxed text-base">
                {product.description ||
                  'Cosecha de altas montañas donde el aire es puro. Esta prenda es una conversación entre la tierra y quien la lleva.'}
              </p>
              <p className="text-on-surface-variant italic border-l-2 border-primary/20 pl-4">
                "Una pieza que no solo se lleva, sino que se vive."
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
              <ProductVariantPicker
                product={product}
                selection={selection}
                onSizeChange={(size) => {
                  setSelectedSize(size);
                  setSelectedColor(null);
                  setQuantity(1);
                }}
                onColorChange={(color) => {
                  setSelectedColor(color);
                  setQuantity(1);
                }}
                onQuantityChange={setQuantity}
                onSubmit={handleAddToCart}
                isSubmitting={isAddingToCart}
                isSyncing={isSyncing}
                layout="detail"
              />
            </div>

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

            <div className="space-y-0 border-t border-dashed border-outline-variant/40 pt-6 sm:pt-8">
              <AccordionSection title="Material & Cuidado">
                <p>
                  {product.materials ||
                    '100% Wool orgánico. Lavar a mano con agua fría y jabón neutro. Secar a la sombra.'}
                </p>
              </AccordionSection>

              <AccordionSection title="Información de Envío">
                <p>
                  Entrega estándar en 5-7 días hábiles. Nuestro embalaje es 100% libre de plástico.
                </p>
              </AccordionSection>
            </div>
          </div>
        </div>

        {allProducts && allProducts.length > 1 && (
          <section className="mt-24 sm:mt-32">
            <h2 className="text-2xl sm:text-3xl font-serif mb-8 sm:mb-12 italic">Completa el Look</h2>
            <div className="bg-surface-container-low p-4 sm:p-8 rounded-xl overflow-x-auto flex gap-4 sm:gap-8 snap-x">
              {allProducts.slice(0, 3).map((relatedProduct) => (
                <RelatedProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-outline-variant/20 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-serif text-primary">${product.price.toFixed(2)}</p>
            {selectionSummary && (
              <p className="text-[10px] text-on-surface-variant truncate">{selectionSummary}</p>
            )}
          </div>
          <ProductAddToCartCta
            product={product}
            selection={selection}
            onSubmit={handleAddToCart}
            isSubmitting={isAddingToCart}
            isSyncing={isSyncing}
            short
            className="shrink-0 bg-primary-container text-on-primary-container px-5 py-3 rounded-lg font-bold uppercase tracking-wider font-label text-xs disabled:opacity-50 min-h-[44px]"
          />
        </div>
      </div>

      <Footer />
    </>
  );
}
