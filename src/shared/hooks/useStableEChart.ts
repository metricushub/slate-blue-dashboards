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

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Dispose existing chart if any (React Strict Mode guard)
    if (chartRef.current) {
      chartRef.current.dispose();
      chartRef.current = null;
    }

    // Create new chart instance
    chartRef.current = echarts.init(containerRef.current, undefined, {
      width: options.width,
      height: options.height,
      renderer: 'canvas'
    });

    // Handle resize with debounce
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        if (chartRef.current && !chartRef.current.isDisposed()) {
          requestAnimationFrame(() => {
            chartRef.current?.resize();
          });
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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

    try {
      chartRef.current.setOption(option, {
        notMerge: true,
        replaceMerge: ['dataset', 'series', 'yAxis', 'legend']
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