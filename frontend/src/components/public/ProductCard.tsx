import { Plus } from '@/components/icons';

import { Link } from 'react-router-dom';
import { usePrefetchProductDetail } from '@/hooks/usePrefetchProductDetail';
import type { Product } from '../../../../shared/src/index';
import { getTotalStock } from '@shared/index';
import { ProductBadges } from '@/components/ui/ProductBadges';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (productId: string) => void;
  view?: 'grid' | 'list';
}

export function ProductCard({ product, onQuickAdd, view = 'grid' }: ProductCardProps) {
  const { prefetchProps } = usePrefetchProductDetail(product._id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    onQuickAdd?.(product._id);
  };

  // Determine if product is "new" (created in last 30 days)
  const isNew = product.createdAt && (new Date().getTime() - new Date(product.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;

  const totalStock = getTotalStock(product);

  if (view === 'list') {
    return (
      <div
        className="group relative border border-outline-variant/40 rounded-lg p-4 hover:shadow-lg transition-shadow"
        {...prefetchProps}
      >
        <Link to={`/products/${product._id}`} className="flex gap-6">
          <div className="w-32 h-40 bg-surface-container overflow-hidden rounded-lg flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-xl text-on-surface">{product.name}</h3>
                <span className="font-serif text-primary text-lg">${product.price.toFixed(2)}</span>
              </div>
              <p className="text-on-surface-variant font-body text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
            </div>

            <button
              onClick={handleQuickAdd}
              className="self-start bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-primary-container transition-colors"
            >
              Agregar
            </button>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group relative stitch-border-left pl-6" {...prefetchProps}>
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-[3/4] bg-surface-container overflow-hidden mb-6 rounded-lg relative">
          <ProductBadges isNew={isNew} stock={totalStock} />
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-xl text-on-surface">{product.name}</h3>
          <span className="font-serif text-primary">${product.price.toFixed(2)}</span>
        </div>

        <p className="text-on-surface-variant font-body text-sm mb-6 line-clamp-2">
          {product.description}
        </p>

        <button
          onClick={handleQuickAdd}
          className="w-full bg-primary text-on-primary font-label text-sm uppercase tracking-widest py-3 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Agregar
        </button>
      </Link>
    </div>
  );
}