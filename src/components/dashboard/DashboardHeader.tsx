import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { Client } from "@/types";

interface DashboardHeaderProps {
  client: Client;
}

export function DashboardHeader({ client }: DashboardHeaderProps) {
  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: "bg-success-light text-success border-success/20",
      onboarding: "bg-warning-light text-warning border-warning/20", 
      at_risk: "bg-destructive-light text-destructive border-destructive/20",
      paused: "bg-muted text-muted-foreground",
      churned: "bg-muted text-muted-foreground",
    };

    const labels = {
      active: "Ativo",
      onboarding: "Onboarding",
      at_risk: "Em Risco", 
      paused: "Pausado",
      churned: "Churned",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <Link to="/">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à Home
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={client.logoUrl} alt={client.name} />
          <AvatarFallback className="text-lg">
            {client.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {getStatusBadge(client.status)}
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Estágio:</span> {client.stage}
            </div>
            <div>
              <span className="font-medium">Responsável:</span> {client.owner}
            </div>
            {client.website && (
              <div>
                <span className="font-medium">Website:</span>{" "}
                <a 
                  href={client.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}