import { useState, useEffect } from "react";
import { Trash2, Check, X, Undo2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialEntry, supabaseFinancialStore as financialStore } from "@/shared/db/supabaseFinancialStore";
import { useToast } from "@/hooks/use-toast";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { useDataSource } from "@/hooks/useDataSource";
import type { Client } from "@/types";

interface FinancialTableProps {
  entries: FinancialEntry[];
  onRefresh: () => void;
}

export function FinancialTable({ entries, onRefresh }: FinancialTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    entry?: FinancialEntry;
    action: 'pay' | 'cancel' | 'reactivate';
  }>({ isOpen: false, action: 'pay' });
  const [clients, setClients] = useState<Client[]>([]);
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await dataSource.getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, [dataSource]);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta entrada?")) return;
    
    try {
      await financialStore.deleteFinancialEntry(id);
      onRefresh();
      toast({
        title: "Sucesso",
        description: "Entrada removida com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover entrada",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (status: 'pending' | 'paid' | 'cancelled', paidAt?: string) => {
    if (!modalState.entry) return;
    
    try {
      const updates: Partial<FinancialEntry> = { status };
      if (status === 'paid' && paidAt) {
        updates.paid_at = paidAt;
      } else if (status !== 'paid') {
        updates.paid_at = undefined;
      }
      
      await financialStore.updateFinancialEntry(modalState.entry.id, updates);
      onRefresh();
      toast({
        title: "Sucesso",
        description: `Status atualizado para ${status === 'paid' ? 'pago' : status === 'cancelled' ? 'cancelado' : 'pendente'}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const openModal = (entry: FinancialEntry, action: 'pay' | 'cancel' | 'reactivate') => {
    setModalState({ isOpen: true, entry, action });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, action: 'pay' });
  };

  const handleConfirmAction = (paidAt: string) => {
    const { action } = modalState;
    switch (action) {
      case 'pay':
        handleUpdateStatus('paid', paidAt);
        break;
      case 'cancel':
        handleUpdateStatus('cancelled');
        break;
      case 'reactivate':
        handleUpdateStatus('pending');
        break;
    }
  };

  const filteredEntries = entries.filter(entry => {
    const clientName = getClientName(entry.client_id);
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(entries.map(e => e.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entradas Financeiras</CardTitle>
        <CardDescription>
          Visualize e gerencie todas as entradas de receitas e despesas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por descrição, categoria ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Venc.</TableHead>
                <TableHead>Data Pago</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma entrada encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.due_date ? new Date(entry.due_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.paid_at ? (
                        <span className="text-success font-medium">
                          {new Date(entry.paid_at).toLocaleDateString('pt-BR')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'income' ? 'default' : 'destructive'}>
                        {entry.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell className="font-medium">
                      <span className={entry.client_id ? 'text-primary' : 'text-muted-foreground'}>
                        {getClientName(entry.client_id)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell className={entry.type === 'income' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                      R$ {entry.amount.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'paid' ? 'default' : entry.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {entry.status === 'paid' ? 'Pago' : entry.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(entry, 'pay')}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Dar baixa (marcar como pago)"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(entry, 'cancel')}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                              title="Cancelar entrada"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {(entry.status === 'paid' || entry.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(entry, 'reactivate')}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Reativar (voltar para pendente)"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Excluir entrada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredEntries.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredEntries.length} de {entries.length} entradas
          </div>
        )}
      </CardContent>
      
      <PaymentConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        entry={modalState.entry}
        action={modalState.action}
      />
    </Card>
  );
}