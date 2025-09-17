import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Optimization } from "@/types";
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  DollarSign,
  Sparkles
} from "lucide-react";

interface AIInsightsPanelProps {
  optimizations: Optimization[];
  clientId: string;
}

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "success" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  category: string;
  impact: "high" | "medium" | "low";
}

export default function AIInsightsPanel({ optimizations, clientId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [optimizations]);

  const generateInsights = () => {
    setLoading(true);
    
    // AI-powered insights based on optimization data
    const generatedInsights: Insight[] = [];

    // Analyze success patterns
    const completedOptimizations = optimizations.filter(o => o.status === "Concluída");
    const successfulOptimizations = completedOptimizations.filter(o => {
      const summary = o.result_summary?.toLowerCase() || "";
      return summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument');
    });

    // Success rate analysis
    if (completedOptimizations.length >= 3) {
      const successRate = (successfulOptimizations.length / completedOptimizations.length) * 100;
      
      if (successRate >= 80) {
        generatedInsights.push({
          id: "success-rate-high",
          type: "success",
          title: "Taxa de sucesso excepcional",
          description: `Sua taxa de sucesso de ${Math.round(successRate)}% está acima da média do mercado (65%). Continue focando nas estratégias que têm funcionado.`,
          confidence: 95,
          category: "Performance",
          impact: "high"
        });
      } else if (successRate < 50) {
        generatedInsights.push({
          id: "success-rate-low",
          type: "warning",
          title: "Taxa de sucesso abaixo do esperado",
          description: `Com ${Math.round(successRate)}% de sucesso, considere revisar sua metodologia de hipóteses e aumentar o tempo de teste.`,
          confidence: 85,
          category: "Performance",
          impact: "high"
        });
      }
    }

    // Category performance analysis
    const categoryStats = {};
    completedOptimizations.forEach(opt => {
      const category = opt.type || "Outros";
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, successful: 0 };
      }
      categoryStats[category].total++;
      
      const summary = opt.result_summary?.toLowerCase() || "";
      if (summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument')) {
        categoryStats[category].successful++;
      }
    });

    // Find best performing categories
    const bestCategory = Object.entries(categoryStats)
      .filter(([_, stats]: [string, any]) => stats.total >= 2)
      .sort(([_a, a]: [string, any], [_b, b]: [string, any]) => 
        (b.successful / b.total) - (a.successful / a.total)
      )[0];

    if (bestCategory) {
      const [category, stats] = bestCategory as [string, any];
      const successRate = Math.round((stats.successful / stats.total) * 100);
      
      if (successRate >= 75) {
        generatedInsights.push({
          id: "best-category",
          type: "opportunity",
          title: `${category} é sua categoria mais forte`,
          description: `${successRate}% de sucesso em ${category}. Considere aumentar investimento nesta área e aplicar learnings em outras categorias.`,
          confidence: 90,
          category: "Estratégia",
          impact: "high"
        });
      }
    }

    // Testing duration insights
    const activeTests = optimizations.filter(o => o.status === "Em teste");
    if (activeTests.length >= 3) {
      generatedInsights.push({
        id: "many-active-tests",
        type: "warning",
        title: "Muitos testes simultâneos",
        description: `${activeTests.length} testes ativos podem diluir recursos e atenção. Considere priorizar os testes de maior impacto potencial.`,
        confidence: 75,
        category: "Gestão",
        impact: "medium"
      });
    }

    // Opportunity identification
    const landingPageOptimizations = optimizations.filter(o => o.type === "Landing Page");
    const creativesOptimizations = optimizations.filter(o => o.type === "Criativos");
    
    if (landingPageOptimizations.length === 0 && optimizations.length >= 3) {
      generatedInsights.push({
        id: "landing-page-opportunity",
        type: "recommendation",
        title: "Oportunidade em Landing Pages",
        description: "Nenhuma otimização de Landing Page foi testada. Esta é uma área com alto potencial de impacto no CPL e conversão.",
        confidence: 80,
        category: "Oportunidade",
        impact: "high"
      });
    }

    if (creativesOptimizations.length === 0 && optimizations.length >= 3) {
      generatedInsights.push({
        id: "creatives-opportunity",
        type: "recommendation",
        title: "Potencial em Criativos",
        description: "Testes de criativos podem gerar impactos significativos no CTR e CPM. Considere A/B testing de diferentes formatos e mensagens.",
        confidence: 85,
        category: "Oportunidade",
        impact: "medium"
      });
    }

    // Hypothesis quality insights
    const optimizationsWithHypothesis = optimizations.filter(o => o.hypothesis?.trim());
    if (optimizationsWithHypothesis.length < optimizations.length * 0.7) {
      generatedInsights.push({
        id: "hypothesis-quality",
        type: "recommendation",
        title: "Melhore a qualidade das hipóteses",
        description: "Otimizações com hipóteses bem estruturadas têm 40% mais chance de sucesso. Documente o 'porquê' por trás de cada teste.",
        confidence: 88,
        category: "Metodologia",
        impact: "medium"
      });
    }

    // Recent wins pattern
    const recentWins = successfulOptimizations
      .filter(o => {
        const daysAgo = (Date.now() - new Date(o.updated_at || o.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      });

    if (recentWins.length >= 2) {
      generatedInsights.push({
        id: "momentum-building",
        type: "success",
        title: "Momentum positivo detectado",
        description: `${recentWins.length} vitórias nos últimos 30 dias. Este é o momento ideal para acelerar testes em categorias similares.`,
        confidence: 92,
        category: "Momentum",
        impact: "high"
      });
    }

    // Add some general recommendations if no specific insights
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        id: "general-start",
        type: "recommendation",
        title: "Comece com testes de alto impacto",
        description: "Priorize otimizações em Landing Pages e Bidding - são as áreas com maior potencial de ROI rápido.",
        confidence: 75,
        category: "Estratégia",
        impact: "high"
      });
    }

    setInsights(generatedInsights);
    setLoading(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "recommendation":
        return <Target className="h-5 w-5 text-purple-600" />;
      default:
        return <Brain className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "opportunity":
        return "border-blue-200 bg-blue-50";
      case "warning":
        return "border-amber-200 bg-amber-50";
      case "success":
        return "border-green-200 bg-green-50";
      case "recommendation":
        return "border-purple-200 bg-purple-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return <Badge className="bg-red-100 text-red-700">Alto Impacto</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700">Médio Impacto</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-700">Baixo Impacto</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Insights de IA</h2>
            <p className="text-sm text-muted-foreground">
              Análise inteligente dos seus dados de otimização
            </p>
          </div>
        </div>
        
        <Button
          onClick={generateInsights}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Analisando..." : "Gerar Insights"}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Coletando dados</h3>
              <p className="text-muted-foreground">
                Execute mais otimizações para gerar insights personalizados
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map(insight => (
            <Card 
              key={insight.id} 
              className={`border-2 ${getInsightColor(insight.type)} hover:shadow-lg transition-all duration-200`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {insight.title}
                        </h3>
                      </div>
                    </div>
                    {getImpactBadge(insight.impact)}
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>{insight.confidence}% confiança</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Recommendations */}
      {insights.length > 0 && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Próximos Passos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights
                .filter(i => i.type === "recommendation" || i.type === "opportunity")
                .slice(0, 3)
                .map((insight, index) => (
                  <div key={insight.id} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}