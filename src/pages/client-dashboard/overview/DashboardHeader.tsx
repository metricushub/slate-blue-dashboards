import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types";

interface DashboardHeaderProps {
  client: Client;
  onRegisterOptimization: () => void;
}

export function DashboardHeader({ client, onRegisterOptimization }: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-[#9fb0c3] hover:text-[#e6edf3] hover:bg-[#1f2733]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">{client.name}</h1>
          <p className="text-[#9fb0c3] text-sm">Dashboard - Visão Geral</p>
        </div>
      </div>
      
      <Button
        onClick={onRegisterOptimization}
        className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Registrar Otimização
      </Button>
    </div>
  );
}