import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="bg-[#11161e] border-[#1f2733]">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Calendar className="h-4 w-4 text-[#9fb0c3]" />
            <Select value={period.toString()} onValueChange={(value) => onPeriodChange(Number(value))}>
              <SelectTrigger className="bg-[#0b0f14] border-[#374151] text-[#e6edf3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#11161e] border-[#374151]">
                {periodOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value.toString()}
                    className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <Globe className="h-4 w-4 text-[#9fb0c3]" />
            <Select value={platform} onValueChange={onPlatformChange}>
              <SelectTrigger className="bg-[#0b0f14] border-[#374151] text-[#e6edf3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#11161e] border-[#374151]">
                {platformOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <Clock className="h-4 w-4 text-[#9fb0c3]" />
            <Select value={granularity} onValueChange={onGranularityChange}>
              <SelectTrigger className="bg-[#0b0f14] border-[#374151] text-[#e6edf3]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#11161e] border-[#374151]">
                {granularityOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}