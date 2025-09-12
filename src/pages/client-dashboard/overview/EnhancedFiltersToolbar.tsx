import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Globe, Clock, Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

interface EnhancedFiltersToolbarProps {
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  onPeriodChange: (period: number) => void;
  onPlatformChange: (platform: 'all' | 'google' | 'meta') => void;
  onGranularityChange: (granularity: 'day' | 'week' | 'month') => void;
  campaigns?: string[];
  onCampaignFilter?: (campaigns: string[]) => void;
  customDateRange?: { from: Date | null; to: Date | null };
  onCustomDateChange?: (range: { from: Date | null; to: Date | null }) => void;
}

const PERIOD_PRESETS = [
  { value: 0, label: 'Hoje', key: 'today' },
  { value: 1, label: 'Ontem', key: 'yesterday' },
  { value: 7, label: 'Últimos 7 dias', key: 'last7days' },
  { value: 14, label: 'Últimos 14 dias', key: 'last14days' },
  { value: 28, label: 'Últimos 28 dias', key: 'last28days' },
  { value: 30, label: 'Últimos 30 dias', key: 'last30days' },
  { value: 60, label: 'Últimos 60 dias', key: 'last60days' },
  { value: 90, label: 'Últimos 90 dias', key: 'last90days' },
  { value: -1, label: 'Mês atual', key: 'currentMonth' },
  { value: -2, label: 'Mês anterior', key: 'lastMonth' },
  { value: -3, label: 'YTD', key: 'ytd' },
  { value: -99, label: 'Personalizado', key: 'custom' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'Todas as Plataformas', color: 'bg-slate-100' },
  { value: 'google', label: 'Google Ads', color: 'bg-blue-100' },
  { value: 'meta', label: 'Meta Ads', color: 'bg-purple-100' },
];

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Diário' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
];

// Mock campaigns - in real app would come from props
const MOCK_CAMPAIGNS = [
  'Campanha A - Google',
  'Campanha B - Meta',
  'Campanha C - Google',
  'Black Friday 2024',
  'Promoção Janeiro',
];

export function EnhancedFiltersToolbar({ 
  period, 
  platform, 
  granularity, 
  onPeriodChange, 
  onPlatformChange, 
  onGranularityChange,
  campaigns = [],
  onCampaignFilter,
  customDateRange,
  onCustomDateChange
}: EnhancedFiltersToolbarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(campaigns);

  const activePeriodPreset = PERIOD_PRESETS.find(p => p.value === period);
  const isCustomPeriod = period === -99;

  const handleCampaignToggle = (campaign: string) => {
    const updated = selectedCampaigns.includes(campaign)
      ? selectedCampaigns.filter(c => c !== campaign)
      : [...selectedCampaigns, campaign];
    
    setSelectedCampaigns(updated);
    onCampaignFilter?.(updated);
  };

  const clearAllFilters = () => {
    onPeriodChange(30);
    onPlatformChange('all');
    onGranularityChange('day');
    setSelectedCampaigns([]);
    onCampaignFilter?.([]);
    setCampaignSearch("");
  };

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(c => 
    c.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const activeFiltersCount = [
    platform !== 'all' ? 1 : 0,
    selectedCampaigns.length > 0 ? 1 : 0,
    isCustomPeriod ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={period.toString()} onValueChange={(value) => onPeriodChange(Number(value))}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map((preset) => (
                    <SelectItem key={preset.key} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {isCustomPeriod && onCustomDateChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-left font-normal">
                    {customDateRange?.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                          {format(customDateRange.to, "dd/MM/yy", { locale: ptBR })}
                        </>
                      ) : (
                        format(customDateRange.from, "dd/MM/yy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange?.from}
                    selected={{
                      from: customDateRange?.from || undefined,
                      to: customDateRange?.to || undefined,
                    }}
                    onSelect={(range) => onCustomDateChange({
                      from: range?.from || null,
                      to: range?.to || null
                    })}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Platform Selector */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={platform} onValueChange={onPlatformChange}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Granularity Selector */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select value={granularity} onValueChange={onGranularityChange}>
                <SelectTrigger className="w-24 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANULARITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-9 gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Filtros Avançados</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Campaign Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Campanhas
              </h4>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign} className="flex items-center space-x-2">
                    <Checkbox
                      id={`campaign-${campaign}`}
                      checked={selectedCampaigns.includes(campaign)}
                      onCheckedChange={() => handleCampaignToggle(campaign)}
                    />
                    <label
                      htmlFor={`campaign-${campaign}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {campaign}
                    </label>
                  </div>
                ))}
              </div>

              {selectedCampaigns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedCampaigns.map((campaign) => (
                    <Badge key={campaign} variant="secondary" className="text-xs">
                      {campaign}
                      <button
                        onClick={() => handleCampaignToggle(campaign)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}