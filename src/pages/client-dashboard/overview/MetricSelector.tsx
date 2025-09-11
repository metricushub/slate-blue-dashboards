import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface MetricSelectorProps {
  selectedMetrics: MetricKey[];
  onMetricsChange: (metrics: MetricKey[]) => void;
  clientId: string;
}

export function MetricSelector({ selectedMetrics, onMetricsChange, clientId }: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Load persisted metric selection for this client
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`);
    if (saved) {
      try {
        const parsedMetrics = JSON.parse(saved) as MetricKey[];
        if (parsedMetrics.length > 0) {
          onMetricsChange(parsedMetrics);
        }
      } catch (error) {
        console.error('Failed to load saved metrics:', error);
      }
    } else {
      onMetricsChange(DEFAULT_SELECTED_METRICS);
    }
  }, [clientId, onMetricsChange]);

  const handleMetricToggle = (metricKey: MetricKey, checked: boolean) => {
    let newSelection: MetricKey[];
    
    if (checked) {
      if (selectedMetrics.length < 6) {
        newSelection = [...selectedMetrics, metricKey];
      } else {
        return; // Don't add if already at limit
      }
    } else {
      newSelection = selectedMetrics.filter(m => m !== metricKey);
    }
    
    onMetricsChange(newSelection);
    // Persist selection per client
    localStorage.setItem(`${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`, JSON.stringify(newSelection));
  };

  const removeMetric = (metricKey: MetricKey) => {
    const newSelection = selectedMetrics.filter(m => m !== metricKey);
    onMetricsChange(newSelection);
    localStorage.setItem(`${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`, JSON.stringify(newSelection));
  };

  return (
    <Card className="bg-[#11161e] border-[#1f2733]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#e6edf3]">
            Métricas Selecionadas ({selectedMetrics.length}/6)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#60a5fa] hover:text-[#3b82f6] hover:bg-[#1f2733]"
          >
            {isOpen ? 'Fechar' : 'Editar'}
          </Button>
        </div>

        {/* Selected metrics chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedMetrics.map((metricKey) => (
            <div
              key={metricKey}
              className="flex items-center gap-1 px-3 py-1 bg-[#1f2733] border border-[#374151] rounded-full text-xs text-[#e6edf3]"
            >
              {METRICS[metricKey].label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMetric(metricKey)}
                className="h-4 w-4 p-0 text-[#9fb0c3] hover:text-[#ef4444]"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Metric selection panel */}
        {isOpen && (
          <div className="border-t border-[#1f2733] pt-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.values(METRICS).map((metric) => {
                const isSelected = selectedMetrics.includes(metric.key);
                const isDisabled = !isSelected && selectedMetrics.length >= 6;
                
                return (
                  <div key={metric.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.key}
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => 
                        handleMetricToggle(metric.key, checked as boolean)
                      }
                      className="border-[#374151] data-[state=checked]:bg-[#22c55e] data-[state=checked]:border-[#22c55e]"
                    />
                    <Label
                      htmlFor={metric.key}
                      className={`text-sm ${
                        isDisabled 
                          ? 'text-[#6b7280]' 
                          : 'text-[#e6edf3] cursor-pointer'
                      }`}
                    >
                      {metric.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            {selectedMetrics.length >= 6 && (
              <p className="text-xs text-[#f59e0b] mt-3">
                Máximo de 6 métricas selecionadas. Remova uma métrica para adicionar outra.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}