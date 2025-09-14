import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Wand2, StickyNote, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardHeaderProps {
  onQuickAction: (type: 'task' | 'optimization' | 'note') => void;
  onSearch: (query: string) => void;
}

export const DashboardHeader = ({ onQuickAction, onSearch }: DashboardHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Title and Date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Radar do Dia</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Operação diária</span>
        </div>
      </div>

      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, campanhas, tarefas..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('task')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tarefa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('optimization')}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Otimização
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('note')}
            className="flex items-center gap-2"
          >
            <StickyNote className="h-4 w-4" />
            Anotação
          </Button>
        </div>
      </div>
    </div>
  );
};