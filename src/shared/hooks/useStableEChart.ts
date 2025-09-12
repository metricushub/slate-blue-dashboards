import { useRef, useEffect, useCallback } from 'react';
import * as echarts from 'echarts/core';

interface UseStableEChartOptions {
  width?: string | number;
  height?: string | number;
}

export function useStableEChart(options: UseStableEChartOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const resizeTimeoutRef = useRef<number>();
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize chart safely
  const initializeChart = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    const container = containerRef.current;
    
    // Ensure container has proper dimensions
    if (container.clientHeight === 0 || container.clientWidth === 0) {
      return;
    }

    // Dispose existing chart (React Strict Mode protection)
    if (chartRef.current && !chartRef.current.isDisposed()) {
      chartRef.current.dispose();
      chartRef.current = null;
    }

    // Create new chart instance
    requestAnimationFrame(() => {
      if (container && container.clientHeight > 0) {
        try {
          chartRef.current = echarts.init(container, undefined, {
            width: options.width,
            height: options.height,
            renderer: 'canvas'
          });
          isInitializedRef.current = true;
        } catch (error) {
          console.error('Failed to initialize ECharts:', error);
        }
      }
    });
  }, [options.width, options.height]);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Wait for container to be ready then initialize
    const checkAndInit = () => {
      if (containerRef.current && containerRef.current.clientHeight > 0) {
        initializeChart();
      } else {
        // Retry after a frame if container not ready
        requestAnimationFrame(checkAndInit);
      }
    };

    checkAndInit();

    // Setup ResizeObserver for better resize handling
    resizeObserver.current = new ResizeObserver((entries) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = window.setTimeout(() => {
        for (const entry of entries) {
          if (entry.contentRect.height > 0) {
            if (!isInitializedRef.current) {
              initializeChart();
            } else if (chartRef.current && !chartRef.current.isDisposed()) {
              requestAnimationFrame(() => {
                chartRef.current?.resize();
              });
            }
          }
        }
      }, 150);
    });

    if (containerRef.current) {
      resizeObserver.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.dispose();
      }
      chartRef.current = null;
      isInitializedRef.current = false;
    };
  }, [initializeChart]);

  // Update chart option with complete replacement
  const updateChart = useCallback((option: any) => {
    if (!chartRef.current || chartRef.current.isDisposed()) {
      // Try to reinitialize if chart was disposed
      initializeChart();
      return;
    }
    
    if (!containerRef.current || containerRef.current.clientHeight === 0) return;

    try {
      chartRef.current.setOption(option, {
        notMerge: true,
        replaceMerge: ['dataset', 'series', 'xAxis', 'yAxis', 'grid', 'legend', 'tooltip']
      });
      
      // Ensure resize after option update
      requestAnimationFrame(() => {
        if (chartRef.current && !chartRef.current.isDisposed()) {
          chartRef.current.resize();
        }
      });
    } catch (error) {
      console.error('Chart update failed:', error);
      // Try to reinitialize on error
      initializeChart();
    }
  }, [initializeChart]);

  // Get chart instance (for advanced usage)
  const getChart = useCallback(() => chartRef.current, []);

  return {
    containerRef,
    updateChart,
    getChart
  };
}