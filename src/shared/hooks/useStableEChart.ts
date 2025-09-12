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

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const initChart = () => {
      if (!containerRef.current || containerRef.current.clientHeight === 0) return;

      // Dispose existing chart if any (React Strict Mode guard)
      if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.dispose();
        chartRef.current = null;
      }

      // Create new chart instance only after container has height
      requestAnimationFrame(() => {
        if (containerRef.current && containerRef.current.clientHeight > 0) {
          chartRef.current = echarts.init(containerRef.current, undefined, {
            width: options.width,
            height: options.height,
            renderer: 'canvas'
          });
        }
      });
    };

    // Setup ResizeObserver for better resize handling
    resizeObserver.current = new ResizeObserver((entries) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = window.setTimeout(() => {
        for (const entry of entries) {
          if (entry.contentRect.height > 0 && chartRef.current && !chartRef.current.isDisposed()) {
            requestAnimationFrame(() => {
              chartRef.current?.resize();
            });
          }
        }
      }, 150);
    });

    if (containerRef.current) {
      resizeObserver.current.observe(containerRef.current);
      initChart();
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
    };
  }, [options.width, options.height]);

  // Update chart option with complete replacement
  const updateChart = useCallback((option: any) => {
    if (!chartRef.current || chartRef.current.isDisposed()) return;
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
    }
  }, []);

  // Get chart instance (for advanced usage)
  const getChart = useCallback(() => chartRef.current, []);

  return {
    containerRef,
    updateChart,
    getChart
  };
}