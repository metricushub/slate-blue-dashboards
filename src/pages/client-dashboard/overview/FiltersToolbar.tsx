import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Globe, Clock } from "lucide-react";

interface FiltersToolbarProps {
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  onPeriodChange: (period: number) => void;
  onPlatformChange: (platform: 'all' | 'google' | 'meta') => void;
  onGranularityChange: (granularity: 'day' | 'week' | 'month') => void;
}

const periodOptions = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 14, label: 'Últimos 14 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 60, label: 'Últimos 60 dias' },
  { value: 90, label: 'Últimos 90 dias' },
];

const platformOptions = [
  { value: 'all', label: 'Todas as Plataformas' },
  { value: 'google', label: 'Google Ads' },
  { value: 'meta', label: 'Meta Ads' },
];

const granularityOptions = [
  { value: 'day', label: 'Diário' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
];

export function FiltersToolbar({ 
  period, 
  platform, 
  granularity, 
  onPeriodChange, 
  onPlatformChange, 
  onGranularityChange 
}: FiltersToolbarProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period.toString()} onValueChange={(value) => onPeriodChange(Number(value))}>
              <SelectTrigger className="w-32 h-9">
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

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={platform} onValueChange={onPlatformChange}>
              <SelectTrigger className="w-36 h-9">
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
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={granularity} onValueChange={onGranularityChange}>
              <SelectTrigger className="w-24 h-9">
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
        </div>
      </div>
    </Card>
  );
}