import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/data-source";
import { useEffect } from "react";

interface MetricSelectorProps {
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  clientId: string;
}

const metrics = [
  { key: "LEADS", label: "Leads", format: "number" },
  { key: "SPEND", label: "Investimento", format: "currency" },
  { key: "CPA", label: "CPA", format: "currency" },
  { key: "ROAS", label: "ROAS", format: "number" },
  { key: "CLICKS", label: "Clicks", format: "number" },
  { key: "IMPRESSIONS", label: "Impressões", format: "number" },
  { key: "REVENUE", label: "Receita", format: "currency" },
];

export function MetricSelector({ selectedMetric, onMetricChange, clientId }: MetricSelectorProps) {
  // Load persisted metric selection for this client
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEYS.METRIC_SELECTIONS}_${clientId}`);
    if (saved) {
      onMetricChange(saved);
    }
  }, [clientId, onMetricChange]);

  const handleMetricChange = (metric: string) => {
    onMetricChange(metric);
    // Persist selection per client
    localStorage.setItem(`${STORAGE_KEYS.METRIC_SELECTIONS}_${clientId}`, metric);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">Métrica:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <Button
              key={metric.key}
              variant={selectedMetric === metric.key ? "default" : "outline"}
              size="sm"
              onClick={() => handleMetricChange(metric.key)}
              className={cn(
                "h-8 px-3 text-xs transition-all",
                selectedMetric === metric.key && "bg-primary text-primary-foreground"
              )}
              aria-pressed={selectedMetric === metric.key}
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}