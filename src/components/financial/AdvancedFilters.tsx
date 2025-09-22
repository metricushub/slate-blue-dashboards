import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: {
    dateRange?: DateRange;
    type?: string;
    category?: string;
    status?: string;
    client?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => void;
  categories: string[];
  clients: Array<{ id: string; name: string }>;
}

export function AdvancedFilters({ onFiltersChange, categories, clients }: AdvancedFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const presets = [
    {
      label: "Últimos 7 dias",
      value: () => ({ from: subDays(new Date(), 7), to: new Date() })
    },
    {
      label: "Últimos 30 dias", 
      value: () => ({ from: subDays(new Date(), 30), to: new Date() })
    },
    {
      label: "Últimos 3 meses",
      value: () => ({ from: subMonths(new Date(), 3), to: new Date() })
    },
    {
      label: "Este mês",
      value: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
    },
    {
      label: "Este ano",
      value: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) })
    }
  ];

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value === null || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
            {activeFilterCount > 0 && (
              <Badge variant="default">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtros rápidos de data */}
        <div className="flex flex-wrap gap-2">
          {presets.map(preset => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => updateFilter('dateRange', preset.value())}
              className={activeFilters.dateRange && 
                format(activeFilters.dateRange.from, 'yyyy-MM-dd') === format(preset.value().from, 'yyyy-MM-dd') ? 
                'bg-primary text-primary-foreground' : ''
              }
            >
              <Calendar className="h-3 w-3 mr-1" />
              {preset.label}
            </Button>
          ))}
        </div>

        {isExpanded && (
          <>
            {/* Data range personalizada */}
            <div>
              <label className="text-sm font-medium mb-2 block">Período Personalizado</label>
              <DateRangePicker
                onDateRangeChange={(range) => updateFilter('dateRange', range)}
                initialRange={activeFilters.dateRange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por tipo */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select 
                  value={activeFilters.type || 'all'} 
                  onValueChange={(value) => updateFilter('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select 
                  value={activeFilters.status || 'all'} 
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por categoria */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select 
                  value={activeFilters.category || 'all'} 
                  onValueChange={(value) => updateFilter('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por cliente */}
              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select 
                  value={activeFilters.client || 'all'} 
                  onValueChange={(value) => updateFilter('client', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros por valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Valor Mínimo</label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={activeFilters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
                <Input
                  type="number"
                  placeholder="R$ 999.999,00"
                  value={activeFilters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>
          </>
        )}

        {/* Filtros ativos */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {Object.entries(activeFilters).map(([key, value]) => {
              let displayValue = '';
              
              if (key === 'dateRange' && value && typeof value === 'object' && 'from' in value && 'to' in value) {
                displayValue = `${format((value as any).from, 'dd/MM')} - ${format((value as any).to, 'dd/MM')}`;
              } else if (key === 'client' && value !== 'none') {
                displayValue = clients.find(c => c.id === value)?.name || String(value);
              } else if (key === 'minAmount') {
                displayValue = `≥ R$ ${value}`;
              } else if (key === 'maxAmount') {
                displayValue = `≤ R$ ${value}`;
              } else {
                displayValue = String(value);
              }

              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {displayValue}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0"
                    onClick={() => updateFilter(key, null)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}