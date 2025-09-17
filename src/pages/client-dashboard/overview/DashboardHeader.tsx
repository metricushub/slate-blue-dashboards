import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Client } from "@/types";

interface DashboardHeaderProps {
  client: Client;
  onRegisterOptimization: () => void;
}

export function DashboardHeader({ client }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Link to="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{client.name}</h1>
        <p className="text-sm text-muted-foreground">Dashboard - Visão Geral</p>
      </div>
    </div>
  );
}