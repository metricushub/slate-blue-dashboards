import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Filter } from "lucide-react";

interface FiltersToolbarProps {
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  onPeriodChange: (period: number) => void;
  onPlatformChange: (platform: 'all' | 'google' | 'meta') => void;
  onGranularityChange: (granularity: 'day' | 'week' | 'month') => void;
}

export function FiltersToolbar({
  period,
  platform,
  granularity,
  onPeriodChange,
  onPlatformChange,
  onGranularityChange,
}: FiltersToolbarProps) {
  const periodOptions = [
    { value: 7, label: "7 dias" },
    { value: 14, label: "14 dias" },
    { value: 30, label: "30 dias" },
    { value: 90, label: "90 dias" },
  ];

  const platformOptions = [
    { value: "all", label: "Todas as plataformas" },
    { value: "google", label: "Google" },
    { value: "meta", label: "Meta" },
  ];

  const granularityOptions = [
    { value: "day", label: "Dia" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mês" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period.toString()} onValueChange={(value) => onPeriodChange(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={platform} onValueChange={onPlatformChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={granularity} onValueChange={onGranularityChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {granularityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}