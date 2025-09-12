import { useRef, useEffect, useCallback } from 'react';

interface UseChartHostReadyOptions {
  onReady?: () => void;
  onResize?: (width: number, height: number) => void;
}

export function useChartHostReady(options: UseChartHostReadyOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const resizeTimeoutRef = useRef<number>();

  const checkReady = useCallback(() => {
    if (!containerRef.current) return false;
    
    const { clientWidth, clientHeight } = containerRef.current;
    const isVisible = clientWidth > 0 && clientHeight > 0;
    
    if (isVisible && !isReadyRef.current) {
      isReadyRef.current = true;
      options.onReady?.();
      return true;
    }
    
    return isVisible;
  }, [options.onReady]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup ResizeObserver for size changes
    resizeObserver.current = new ResizeObserver((entries) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          if (width > 0 && height > 0) {
            if (!isReadyRef.current) {
              checkReady();
            }
            options.onResize?.(width, height);
          }
        }
      }, 150);
    });

    // Setup IntersectionObserver for visibility
    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && entry.boundingClientRect.height > 0) {
          checkReady();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      resizeObserver.current.observe(containerRef.current);
      intersectionObserver.current.observe(containerRef.current);
      
      // Initial check
      requestAnimationFrame(() => {
        checkReady();
      });
    }

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      isReadyRef.current = false;
    };
  }, [checkReady, options.onResize]);

  return {
    containerRef,
    isReady: isReadyRef.current
  };
}