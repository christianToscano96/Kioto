import { Eye, ChevronLeft, ChevronRight, Heart } from '@/components/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrefetchProductDetail } from '@/hooks/usePrefetchProductDetail';
import type { Product } from '../../../../shared/src/index';
import { getAvailableSizes, getInventoryMode, getTotalStock } from '@shared/index';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (productId: string, quantity: number, size: string, color?: string) => void;
}

// Stock status indicator
const StockBadge = ({ stock }: { stock: number }) => {
  if (stock === 0) {
    return (
      <span className="text-[10px] uppercase tracking-widest text-terracota-600 font-bold">
        Agotado
      </span>
    );
  }
  if (stock < 5) {
    return (
      <span className="text-[10px] uppercase tracking-widest text-verde-bosque-600 font-bold">
        Últimas unidades
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
      En stock
    </span>
  );
};

// Color swatches
const ColorSwatches = ({ 
  colors, 
  selectedColor, 
  onSelectColor 
}: { 
  colors?: string[];
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
}) => {
  if (!colors || colors.length === 0) return null;
  
  return (
    <div className="flex gap-2">
      {colors.map((color, index) => {
        const isSelected = selectedColor === color;
        return (
          <button
            key={index}
            onClick={() => onSelectColor?.(color)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              isSelected ? 'border-primary scale-110' : 'border-outline-variant'
            }`}
            style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
            title={color}
          />
        );
      })}
    </div>
  );
};

export function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const inventoryMode = getInventoryMode(product);
  const hasSizes = inventoryMode === 'size_color';
  const requiresSelection = hasSizes || inventoryMode === 'color';
  
  // Image carousel logic
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://placehold.co/400x500/fdfae9/1c1c12?text=Producto"];
  const hasMultipleImages = images.length > 1;
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stock === 0) return;
    
    // Show options panel if sizes are required
    if (requiresSelection && !selectedSize) {
      setShowOptions(true);
      return;
    }
    
    onQuickAdd?.(product._id, quantity, selectedSize || '', selectedColor || undefined);
    resetForm();
    setShowOptions(false);
  };

  const handleConfirm = () => {
    if (stock === 0) return;
    onQuickAdd?.(product._id, quantity, selectedSize, selectedColor);
    setShowOptions(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
  };

  const handleCancel = () => {
    setShowOptions(false);
    resetForm();
  };

  // Use product's sizes if available, otherwise default
  const sizes = getAvailableSizes(product);
  const stock = getTotalStock(product);
  const { prefetchProps } = usePrefetchProductDetail(product._id);

  return (
    <div
      className="group bg-surface-container rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl border-l-2 border-dashed border-outline-variant"
      {...prefetchProps}
    >
      {/* Image Section */}
      <div className="aspect-[3/4] overflow-hidden relative">
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          <img
            src={images[currentImageIndex]}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        
        {/* Carousel Navigation - only if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-surface/80 backdrop-blur-md p-1 rounded-full text-on-surface hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface/80 backdrop-blur-md p-1 rounded-full text-on-surface hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Image indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Overlay with view icon on hover */}
        <Link to={`/products/${product._id}`} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Eye size={20} />
          </div>
        </Link>
        
        {/* Top right buttons */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <button 
            className="bg-surface/80 backdrop-blur-md p-2 rounded-full text-on-surface hover:text-primary transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Heart size={16} />
          </button>
        </div>
        
        {/* Stock badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <StockBadge stock={stock} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <Link to={`/products/${product._id}`} className="block">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-serif text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
              <p className="text-on-surface-variant text-sm font-light mt-1 line-clamp-2">
                {product.description || 'Descripción del producto'}
              </p>
            </div>
            <span className="font-serif text-lg text-primary">${product.price.toFixed(2)}</span>
          </div>
        </Link>

        {/* Colors */}
        {product.inventoryMode === 'color' && product.colors && product.colors.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Colores
            </span>
            <ColorSwatches
              colors={product.colors.map((line) => line.color)}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          </div>
        )}

        {/* Sizes */}
        <div className={`space-y-2 ${showOptions ? 'block' : 'hidden'}`}>
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Seleccionar Talla
          </span>
          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-10 h-10 border rounded-lg text-xs transition-all ${
                  selectedSize === size 
                    ? 'border-primary bg-primary-container text-on-primary-container' 
                    : 'border-outline-variant hover:border-primary'
                }`}
                disabled={stock === 0}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selector - only shown when options modal is open */}
        {showOptions && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Cantidad
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 border border-outline-variant rounded-lg hover:border-primary transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-serif">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="w-8 h-8 border border-outline-variant rounded-lg hover:border-primary transition-colors"
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Add to Cart */}
        {!showOptions ? (
          <button
            onClick={handleQuickAdd}
            disabled={stock === 0}
            className="w-full bg-[#e27d60] text-white py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-primary transition-colors shadow-lg shadow-[#e27d60]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 border border-outline-variant text-on-surface py-2 rounded-lg font-label uppercase text-xs hover:border-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedSize && sizes.length > 0}
              className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}