import { useEffect, useRef, useState, useCallback } from 'react';

interface HeightMeasurement {
  timestamp: number;
  height: number;
  deltaFromInitial: number;
}

interface StableModalHeightOptions {
  enabled?: boolean;
  debounceMs?: number;
  measurementDelays?: number[]; // Time points to measure (default: [200, 1200])
}

export function useStableModalHeight(options: StableModalHeightOptions = {}) {
  const { enabled = true, debounceMs = 150, measurementDelays = [200, 1200] } = options;
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const measurementTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const [measurements, setMeasurements] = useState<HeightMeasurement[]>([]);
  const [initialHeight, setInitialHeight] = useState<number | null>(null);
  const [deltaPixels, setDeltaPixels] = useState<number>(0);
  
  const takeMeasurement = useCallback((height: number) => {
    const timestamp = Date.now();
    const deltaFromInitial = initialHeight ? Math.abs(height - initialHeight) : 0;
    
    const measurement: HeightMeasurement = {
      timestamp,
      height,
      deltaFromInitial
    };
    
    setMeasurements(prev => [...prev, measurement]);
    
    // Update delta if we have initial height
    if (initialHeight) {
      setDeltaPixels(deltaFromInitial);
    }
    
    return measurement;
  }, [initialHeight]);
  
  const startMeasuring = useCallback(() => {
    if (!containerRef.current || !enabled) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const currentHeight = rect.height;
    
    // Set initial height
    if (initialHeight === null) {
      setInitialHeight(currentHeight);
    }
    
    // Clear any existing timeouts
    measurementTimeoutsRef.current.forEach(clearTimeout);
    measurementTimeoutsRef.current = [];
    
    // Schedule measurements at specified delays
    measurementDelays.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const measurement = takeMeasurement(rect.height);
          
          // Save measurement to localStorage with descriptive key
          const measurementKey = index === 0 ? 'h200' : 'h1200';
          localStorage.setItem(
            `diag:funilModal:last`,
            JSON.stringify({
              ts: Date.now(),
              [measurementKey]: measurement.height,
              delta_px: measurement.deltaFromInitial,
              dpr: window.devicePixelRatio || 1
            })
          );
        }
      }, delay);
      
      measurementTimeoutsRef.current.push(timeout);
    });
  }, [enabled, measurementDelays, takeMeasurement, initialHeight]);
  
  const setupResizeObserver = useCallback(() => {
    if (!containerRef.current || !enabled) return;
    
    // Cleanup existing observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    
    // Create new observer with debouncing
    let debounceTimeout: NodeJS.Timeout;
    resizeObserverRef.current = new ResizeObserver((entries) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const height = entry.contentRect.height;
          takeMeasurement(height);
          
          // Trigger chart resize if available
          const chartContainer = containerRef.current?.querySelector('[data-echarts-instance]');
          if (chartContainer && (window as any).echarts) {
            const chart = (window as any).echarts.getInstanceByDom(chartContainer);
            if (chart) {
              chart.resize();
            }
          }
        }
      }, debounceMs);
    });
    
    resizeObserverRef.current.observe(containerRef.current);
  }, [enabled, debounceMs, takeMeasurement]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    measurementTimeoutsRef.current.forEach(clearTimeout);
    measurementTimeoutsRef.current = [];
    
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  }, []);
  
  // Setup effect
  useEffect(() => {
    if (containerRef.current && enabled) {
      setupResizeObserver();
      startMeasuring();
    }
    
    return cleanup;
  }, [enabled, setupResizeObserver, startMeasuring, cleanup]);
  
  // Reset function for testing purposes
  const reset = useCallback(() => {
    cleanup();
    setMeasurements([]);
    setInitialHeight(null);
    setDeltaPixels(0);
    
    if (containerRef.current && enabled) {
      setTimeout(() => {
        setupResizeObserver();
        startMeasuring();
      }, 50);
    }
  }, [cleanup, enabled, setupResizeObserver, startMeasuring]);
  
  return {
    containerRef,
    measurements,
    deltaPixels,
    initialHeight,
    reset,
    startMeasuring
  };
}