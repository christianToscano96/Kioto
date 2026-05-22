import { useCallback, useRef } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { prefetchRoute } from '@/hooks/usePrefetchRoute';

export function getProductDetailPath(productId: string) {
  return `/products/${productId}`;
}

export function usePrefetchProductDetail(productId: string) {
  const { isMobile } = useDeviceType();
  const hasPrefetched = useRef(false);

  const prefetch = useCallback(() => {
    if (!productId || hasPrefetched.current) return;
    hasPrefetched.current = true;
    prefetchRoute(getProductDetailPath(productId));
  }, [productId]);

  const prefetchProps = {
    onMouseEnter: () => {
      if (!isMobile) prefetch();
    },
    onFocus: prefetch,
    onTouchStart: () => {
      if (isMobile) prefetch();
    },
  };

  return { prefetch, prefetchProps };
}
