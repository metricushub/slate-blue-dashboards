import { useState, useMemo } from 'react';
import { Lead, LeadStage } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface LeadFiltersProps {
  filters: {
    stages: string[];
    owner: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: {
    stages: string[];
    owner: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
  leads: Lead[];
}

const LEAD_STAGES: LeadStage[] = ["Novo", "Qualificação", "Proposta", "Fechado"];

export function LeadFilters({ filters, onFiltersChange, leads }: LeadFiltersProps) {
  // Obter owners únicos dos leads
  const uniqueOwners = useMemo(() => {
    const owners = leads
      .map(lead => lead.owner)
      .filter(Boolean)
      .filter((owner, index, arr) => arr.indexOf(owner) === index)
      .sort();
    return owners;
  }, [leads]);

  const handleStageToggle = (stage: string, checked: boolean) => {
    const newStages = checked
      ? [...filters.stages, stage]
      : filters.stages.filter(s => s !== stage);
    
    onFiltersChange({ ...filters, stages: newStages });
  };

  const handleOwnerChange = (owner: string) => {
    onFiltersChange({ ...filters, owner });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFiltersChange({ ...filters, dateFrom });
  };

  const handleDateToChange = (dateTo: string) => {
    onFiltersChange({ ...filters, dateTo });
  };

  const clearFilters = () => {
    onFiltersChange({
      stages: [],
      owner: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = 
    filters.stages.length > 0 || 
    filters.owner || 
    filters.dateFrom || 
    filters.dateTo;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filtros Avançados</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar todos
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por estágios */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estágios</Label>
              <div className="space-y-2">
                {LEAD_STAGES.map(stage => (
                  <div key={stage} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stage-${stage}`}
                      checked={filters.stages.includes(stage)}
                      onCheckedChange={(checked) => handleStageToggle(stage, checked as boolean)}
                    />
                    <Label htmlFor={`stage-${stage}`} className="text-sm">
                      {stage}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro por proprietário */}
            <div className="space-y-2">
              <Label htmlFor="owner-filter" className="text-sm font-medium">Proprietário</Label>
              <Select
                value={filters.owner || "all"}
                onValueChange={(value) => handleOwnerChange(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os proprietários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os proprietários</SelectItem>
                  {uniqueOwners.map(owner => (
                    <SelectItem key={owner} value={owner!}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por data inicial */}
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm font-medium">Data inicial</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>

            {/* Filtro por data final */}
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm font-medium">Data final</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                min={filters.dateFrom || undefined}
              />
            </div>
          </div>

          {/* Indicadores de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.stages.map(stage => (
                <div
                  key={stage}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                >
                  Estágio: {stage}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-primary/70"
                    onClick={() => handleStageToggle(stage, false)}
                  />
                </div>
              ))}
              
              {filters.owner && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Proprietário: {filters.owner}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-primary/70"
                    onClick={() => handleOwnerChange('')}
                  />
                </div>
              )}
              
              {filters.dateFrom && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  A partir de: {filters.dateFrom}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-primary/70"
                    onClick={() => handleDateFromChange('')}
                  />
                </div>
              )}
              
              {filters.dateTo && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Até: {filters.dateTo}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-primary/70"
                    onClick={() => handleDateToChange('')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}