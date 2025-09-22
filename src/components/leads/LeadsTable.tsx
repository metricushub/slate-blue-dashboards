import React, { useState } from 'react';
import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onViewLead: (lead: Lead) => void;
}

const stageColors: Record<string, string> = {
  'novo': 'bg-blue-500',
  'qualificado': 'bg-purple-500',
  'proposta': 'bg-yellow-500',
  'negociacao': 'bg-orange-500',
  'fechado': 'bg-green-500',
  'perdido': 'bg-red-500',
};

export function LeadsTable({ leads, onEditLead, onDeleteLead, onViewLead }: LeadsTableProps) {
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              Nome
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('email')}
            >
              Email
            </TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('stage')}
            >
              Etapa
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort('value')}
            >
              Valor
            </TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('created_at')}
            >
              Criado
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>{lead.email}</TableCell>
              <TableCell>{lead.phone || '-'}</TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={`${stageColors[lead.stage] || 'bg-gray-500'} text-white`}
                >
                  {lead.stage}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {lead.value ? formatCurrency(lead.value) : '-'}
              </TableCell>
              <TableCell>{lead.owner || '-'}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewLead(lead)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditLead(lead)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteLead(lead.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sortedLeads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum lead encontrado
        </div>
      )}
    </div>
  );
}