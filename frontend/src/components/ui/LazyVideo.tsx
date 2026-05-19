import { useEffect, useRef, useState } from 'react';

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  threshold?: number;
}

/**
 * LazyVideo - Only loads video when it enters viewport
 * Reduces initial bundle size and improves page load performance
 */
export function LazyVideo({ 
  src, 
  poster,
  threshold = 0.1,
  className = '',
  ...props 
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          // Load the video source when in view
          setVideoSrc(src);
        }
      },
      { threshold, rootMargin: '50px' }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, isInView]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={poster}
      className={className}
      preload="none"
      {...props}
    />
  );
}
