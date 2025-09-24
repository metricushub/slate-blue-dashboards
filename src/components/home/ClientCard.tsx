import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, Eye, CheckSquare, TrendingUp, TrendingDown, MoreVertical, Archive, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  onArchive?: (clientId: string) => void;
  onDelete?: (clientId: string) => void;
}

export function ClientCard({ client, onArchive, onDelete }: ClientCardProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: "bg-success-light text-success border-success/20",
      onboarding: "bg-warning-light text-warning border-warning/20", 
      at_risk: "bg-destructive-light text-destructive border-destructive/20",
      paused: "bg-muted text-muted-foreground",
      churned: "bg-muted text-muted-foreground",
      Ativo: "bg-success-light text-success border-success/20",
      Pausado: "bg-muted text-muted-foreground",
      Risco: "bg-destructive-light text-destructive border-destructive/20",
      Prospect: "bg-primary-light text-primary border-primary/20",
      Arquivado: "bg-muted text-muted-foreground",
    };

    const labels = {
      active: "Ativo",
      onboarding: "Onboarding",
      at_risk: "Em Risco", 
      paused: "Pausado",
      churned: "Churned",
      Ativo: "Ativo",
      Pausado: "Pausado", 
      Risco: "Em Risco",
      Prospect: "Prospect",
      Arquivado: "Arquivado",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const monthlyBudget = client.monthlyBudget || 0;
  const budgetSpent = client.budgetSpentMonth || 0;
  const budgetUsage = monthlyBudget > 0 ? (budgetSpent / monthlyBudget) * 100 : 0;
  const isLowBudget = budgetUsage > 80;
  const budgetRemaining = monthlyBudget - budgetSpent;

  // Calculate health score based on goals vs actuals
  const calculateHealthScore = () => {
    let score = 0;
    let factors = 0;

    if (client.goalsLeads && client.latestLeads) {
      score += client.latestLeads >= client.goalsLeads ? 1 : 0;
      factors++;
    }

    if (client.goalsCPA && client.latestCPA) {
      score += client.latestCPA <= client.goalsCPA ? 1 : 0;
      factors++;
    }

    if (client.goalsROAS && client.latestROAS) {
      score += client.latestROAS >= client.goalsROAS ? 1 : 0;
      factors++;
    }

    return factors > 0 ? Math.round((score / factors) * 100) : 0;
  };

  const healthScore = calculateHealthScore();

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={client.logoUrl} alt={client.name} />
              <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.stage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(client.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onArchive?.(client.id)}
                  disabled={client.status === 'Arquivado'}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(client.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Owner and Last Update */}
        <div className="text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium">{client.owner}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Última atualização:</span>
            <span className="text-xs">
              {new Date(client.lastUpdate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget mensal:</span>
            <span className="font-medium">
              R$ {(client.monthlyBudget || 0).toLocaleString('pt-BR')}
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                isLowBudget ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {budgetUsage.toFixed(0)}% usado
            </span>
            {isLowBudget && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                R$ {(budgetRemaining || 0).toLocaleString('pt-BR')} restante
              </div>
            )}
          </div>
        </div>

        {/* Health Score */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Health Score:</span>
          <div className="flex items-center gap-1">
            <span className={cn("font-bold", getHealthScoreColor(healthScore))}>
              {healthScore}%
            </span>
            {healthScore >= 70 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Tasks and Alerts Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tarefas pendentes:</span>
            <Badge variant="outline" className="text-xs">
              {client.onboarding?.filter(item => !item.completed).length || 0}
            </Badge>
          </div>
          {client.status === 'at_risk' && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>Cliente requer atenção</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {client.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => navigate(`/cliente/${client.id}/overview`)}
            className="flex-1"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // TODO: Implement tasks modal
              console.log('Open tasks for', client.id);
            }}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Tarefas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}