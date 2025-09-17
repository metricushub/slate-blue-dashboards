import { useState, useEffect } from "react";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Client, Optimization } from "@/types";
import { optimizationOperations } from "@/shared/db/dashboardStore";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  client: Client;
  onRegisterOptimization: () => void;
}

export function DashboardHeader({ client, onRegisterOptimization }: DashboardHeaderProps) {
  const [pendingOptimizations, setPendingOptimizations] = useState<number>(0);

  useEffect(() => {
    const loadOptimizationStats = async () => {
      try {
        const optimizations = await optimizationOperations.getByClient(client.id);
        
        // Count optimizations that need review (review date in the past or coming up)
        const now = new Date();
        const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        const needsReview = optimizations.filter(opt => 
          opt.status === "Em teste" || 
          (opt.review_date && new Date(opt.review_date) <= next7Days && new Date(opt.review_date) >= now)
        ).length;
        
        setPendingOptimizations(needsReview);
      } catch (error) {
        console.error('Failed to load optimization stats:', error);
      }
    };

    loadOptimizationStats();
  }, [client.id]);

  return (
    <div className="flex items-center gap-4">
      <Link to="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{client.name}</h1>
            <p className="text-sm text-muted-foreground">Dashboard - Visão Geral</p>
          </div>
          
          {/* Optimization Status Indicator */}
          {pendingOptimizations > 0 && (
            <div 
              onClick={onRegisterOptimization}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 cursor-pointer hover:from-purple-200 hover:to-blue-200 transition-all duration-200"
            >
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {pendingOptimizations} otimização{pendingOptimizations > 1 ? 'ões' : ''} ativa{pendingOptimizations > 1 ? 's' : ''}
              </span>
              <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
                Ver Central
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}