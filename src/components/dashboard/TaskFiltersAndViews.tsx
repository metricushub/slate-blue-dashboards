import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatus, TaskPriority } from "@/types";
import { Filter, Star, Save, X, Search } from "lucide-react";

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  client_id?: string;
  owner?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: TaskFilters;
  isDefault?: boolean;
}

interface TaskFiltersAndViewsProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  clients: any[];
  tasks: any[];
}

const DEFAULT_VIEWS: SavedView[] = [
  {
    id: 'minhas-hoje',
    name: 'Minhas de hoje',
    filters: {
      due_date_from: new Date().toISOString().split('T')[0],
      due_date_to: new Date().toISOString().split('T')[0],
      owner: 'Eu' // This would be current user
    },
    isDefault: true
  }
];

export function TaskFiltersAndViews({
  filters,
  onFiltersChange,
  clients,
  tasks
}: TaskFiltersAndViewsProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveView, setShowSaveView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [activeView, setActiveView] = useState<string | null>(null);

  useEffect(() => {
    // Load saved views from localStorage
    const stored = localStorage.getItem('taskViews');
    if (stored) {
      try {
        const views = JSON.parse(stored);
        setSavedViews([...DEFAULT_VIEWS, ...views]);
      } catch (error) {
        setSavedViews(DEFAULT_VIEWS);
      }
    } else {
      setSavedViews(DEFAULT_VIEWS);
    }
  }, []);

  const saveView = () => {
    if (!newViewName.trim()) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName,
      filters: { ...filters }
    };
    
    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    
    // Save to localStorage (excluding default views)
    const customViews = updatedViews.filter(v => !v.isDefault);
    localStorage.setItem('taskViews', JSON.stringify(customViews));
    
    setNewViewName('');
    setShowSaveView(false);
    setActiveView(newView.id);
  };

  const applyView = (view: SavedView) => {
    onFiltersChange(view.filters);
    setActiveView(view.id);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setActiveView(null);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  // Get unique owners from tasks
  const uniqueOwners = [...new Set(tasks.map(t => t.owner).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Saved Views */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Views:</span>
        {savedViews.map(view => (
          <Button
            key={view.id}
            variant={activeView === view.id ? "default" : "outline"}
            size="sm"
            onClick={() => applyView(view)}
            className="flex items-center gap-1"
          >
            {view.isDefault && <Star className="h-3 w-3" />}
            {view.name}
          </Button>
        ))}
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveView(true)}
            className="flex items-center gap-1"
          >
            <Save className="h-3 w-3" />
            Salvar View
          </Button>
        )}
      </div>

      {/* Save View Form */}
      {showSaveView && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nome da view..."
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && saveView()}
            />
            <Button size="sm" onClick={saveView} disabled={!newViewName.trim()}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSaveView(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-8 w-48"
              />
            </div>

            {/* Status */}
            <Select 
              value={filters.status ?? 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : (value as TaskStatus) })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em progresso">Em progresso</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select 
              value={filters.priority ?? 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, priority: value === 'all' ? undefined : (value as TaskPriority) })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {/* Client */}
            {clients.length > 0 && (
              <Select 
                value={filters.client_id ?? 'all'} 
                onValueChange={(value) => onFiltersChange({ ...filters, client_id: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Owner */}
            {uniqueOwners.length > 0 && (
              <Select 
                value={filters.owner ?? 'all'} 
                onValueChange={(value) => onFiltersChange({ ...filters, owner: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueOwners.map(owner => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Due Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                placeholder="De"
                value={filters.due_date_from || ''}
                onChange={(e) => onFiltersChange({ ...filters, due_date_from: e.target.value })}
                className="w-36"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                placeholder="Até"
                value={filters.due_date_to || ''}
                onChange={(e) => onFiltersChange({ ...filters, due_date_to: e.target.value })}
                className="w-36"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filters.status && (
                <Badge variant="secondary" className="text-xs">
                  Status: {filters.status}
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="secondary" className="text-xs">
                  Prioridade: {filters.priority}
                </Badge>
              )}
              {filters.client_id && (
                <Badge variant="secondary" className="text-xs">
                  Cliente: {clients.find(c => c.id === filters.client_id)?.name}
                </Badge>
              )}
              {filters.owner && (
                <Badge variant="secondary" className="text-xs">
                  Responsável: {filters.owner}
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Busca: "{filters.search}"
                </Badge>
              )}
              {(filters.due_date_from || filters.due_date_to) && (
                <Badge variant="secondary" className="text-xs">
                  Prazo: {filters.due_date_from || '...'} até {filters.due_date_to || '...'}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}