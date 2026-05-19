import { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  priority?: boolean;
}

// Validate image URL
const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  // Check if it's a valid URL format
  try {
    // Local paths
    if (url.startsWith('/') || url.startsWith('./')) return true;
    
    // External URLs
    if (url.startsWith('http')) {
      new URL(url);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// Helper to use Vercel Image Optimization
const getOptimizedImageUrl = (
  src: string, 
  width?: number, 
  quality = 75
): string => {
  // If already using Vercel image optimization path
  if (src.startsWith('/_vercel/image')) return src;
  
  // For local assets, return as-is (Vercel will optimize at build)
  if (src.startsWith('/') || src.startsWith('./')) return src;
  
  // For remote URLs, use Vercel image optimizer in production
  if (import.meta.env.PROD && !src.startsWith('http')) return src;
  
  // External URLs - skip Vercel optimization for Cloudinary (already optimized)
  if (src.startsWith('http')) {
    // Skip optimization for Cloudinary URLs (they're already optimized)
    if (src.includes('cloudinary.com')) return src;
    
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    params.set('q', quality.toString());
    return `/_vercel/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }
  
  return src;
};

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  quality = 75,
  priority = false,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Validate URL before attempting to load
  const isValid = isValidImageUrl(src);
  const optimizedSrc = isValid ? getOptimizedImageUrl(src, width, quality) : '';

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(!isValid);
  }, [src, isValid]);

  if (!isValid || hasError) {
    return (
      <div className={`bg-surface-container-low flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-on-surface-variant/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={(e) => {
        // Suppress console error in production
        if (import.meta.env.DEV) {
          console.warn(`Failed to load image: ${src}`);
        }
        setHasError(true);
        // Prevent default error handling
        e.preventDefault();
      }}
      {...props}
    />
  );
}