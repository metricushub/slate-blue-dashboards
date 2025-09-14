import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChecklistItem, Task } from "@/types";
import { checklistOperations, taskOperations } from "@/shared/db/dashboardStore";
import { ArrowUp, Plus, ListChecks, Trash2, Loader2 } from "lucide-react";

interface QuickChecklistProps {
  clientId: string;
}

export function QuickChecklist({ clientId }: QuickChecklistProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [clientId]);

  const loadItems = async () => {
    try {
      const clientItems = await checklistOperations.getByClient(clientId);
      setItems(clientItems);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista rápida",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemContent.trim()) {
      try {
        const newItem = await checklistOperations.create({
          content: newItemContent.trim(),
          completed: false,
          client_id: clientId
        });
        
        setItems(prev => [newItem, ...prev]);
        setNewItemContent('');
        
        toast({
          title: "Item adicionado",
          description: "Item adicionado à lista rápida"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao adicionar item",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      await checklistOperations.update(itemId, { completed });
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, completed } : item
      ));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar item",
        variant: "destructive"
      });
    }
  };

  const handlePromoteToTask = async (item: ChecklistItem) => {
    setPromoting(item.id);
    try {
      // Create task from checklist item
      const taskData = {
        title: item.content,
        description: `Promovida de lista rápida em ${new Date().toLocaleDateString('pt-BR')}`,
        client_id: clientId,
        status: 'Aberta' as const,
        priority: 'Média' as const
      };
      
      await taskOperations.create(taskData);
      
      // Remove from checklist
      await checklistOperations.delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      
      toast({
        title: "Tarefa criada",
        description: "Item promovido para tarefa completa"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao promover item",
        variant: "destructive"
      });
    } finally {
      setPromoting(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await checklistOperations.delete(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Item removido",
        description: "Item removido da lista rápida"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Lista Rápida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          Lista Rápida ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new item */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite e pressione Enter para adicionar..."
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={handleAddItem}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => newItemContent.trim() && handleAddItem({ key: 'Enter' } as any)}
            disabled={!newItemContent.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Items list */}
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum item na lista</p>
            <p className="text-xs">Digite acima para começar</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                  item.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                  className="flex-shrink-0"
                />
                
                <div 
                  className={`flex-1 text-sm ${
                    item.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.content}
                </div>
                
                {!item.completed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePromoteToTask(item)}
                    disabled={promoting === item.id}
                    title="Promover a Tarefa"
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    {promoting === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id)}
                  title="Remover"
                  className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}