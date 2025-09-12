import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Send, Bot, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { Client, MetricRow, Campaign } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ChatIaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    title: "Explique picos desta semana",
    prompt: "Explique os picos e quedas nas métricas desta semana",
  },
  {
    icon: AlertTriangle,
    title: "Campanhas com CPA alto",
    prompt: "Quais campanhas estão puxando meu CPA para cima?",
  },
  {
    icon: Lightbulb,
    title: "Sugira 3 otimizações",
    prompt: "Sugira 3 otimizações rápidas para melhorar os resultados",
  },
];

// Hook placeholder for AI context - will be used when AI integration is added
export function useAiContext(clientId: string, period: number, platform: string) {
  // This will return filtered metrics and campaigns for AI context
  // For now, it's just a placeholder
  return {
    metrics: [] as MetricRow[],
    campaigns: [] as Campaign[],
    isLoading: false,
  };
}

export function ChatIaPanel({ isOpen, onClose, client }: ChatIaPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Generate data-driven response
    setTimeout(async () => {
      let aiResponse = "";

      if (content.toLowerCase().includes('resumo do período') || content.toLowerCase().includes('gerar resumo')) {
        aiResponse = await generatePeriodSummary(client.id);
      } else if (content.toLowerCase().includes('picos') || content.toLowerCase().includes('vales')) {
        aiResponse = "📈 **Análise de Picos e Vales:**\n\n• Pico de ROAS: 4.2x na segunda semana\n• Vale de CPL: R$ 45 (meta: R$ 80)\n• Variação semanal de investimento: 12% ↑\n• Campanhas com maior volatilidade: Google Search";
      } else if (content.toLowerCase().includes('top') && content.toLowerCase().includes('cpl')) {
        aiResponse = "🎯 **Top 5 Campanhas por CPL:**\n\n1. Shopping Geral - R$ 32\n2. Search Brand - R$ 38\n3. Display Remarketing - R$ 42\n4. Facebook Interesse - R$ 48\n5. YouTube Discovery - R$ 55\n\n💡 CPL médio atual: R$ 43 (meta: R$ 80)";
      } else if (content.toLowerCase().includes('sem conversões')) {
        aiResponse = "⚠️ **Campanhas sem conversões (7 dias):**\n\n• Display Prospecting (0 leads, R$ 280 gasto)\n• Facebook Lookalike (0 leads, R$ 120 gasto)\n\n🔧 **Sugestões:**\n• Revisar segmentação\n• Verificar pixel de conversão\n• Pausar até ajustes";
      } else {
        aiResponse = `🤖 **Análise para ${client.name}:**\n\nSua pergunta: "${content}"\n\n📊 **Contexto atual:**\n• Período analisado: Últimos 30 dias\n• Plataformas ativas: Google Ads, Meta\n• Campanhas monitoradas: 12\n\n💡 Em breve terei acesso completo aos dados para insights mais precisos!`;
      }

      const response: Message = {
        id: `msg_${Date.now()}_ai`,
        content: aiResponse,
        type: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1200);
  };

  const generatePeriodSummary = async (clientId: string): Promise<string> => {
    // Mock data analysis - in real app this would use actual metrics
    return `📊 **Resumo do Período - ${client.name}**\n\n**📈 Performance Geral:**\n• Total investido: R$ 12.450\n• Leads gerados: 284 (+18% vs período anterior)\n• CPL médio: R$ 43.8 (meta: R$ 80) ✅\n• ROAS médio: 3.2x (meta: 2.5x) ✅\n\n**🏆 Top 3 Campanhas (ROAS):**\n• Search Brand: 5.8x\n• Shopping Geral: 4.2x\n• Remarketing: 3.9x\n\n**⚠️ Atenção:**\n• Display Prospecting: CPL R$ 95 (acima da meta)\n• Facebook Interesse: ROAS 1.8x (abaixo da meta)\n\n**📅 Tendências Semanais:**\n• Semana 1: Investimento baixo, CPL alto\n• Semana 2: Pico de performance\n• Semana 3: Estabilização\n• Semana 4: Leve queda no ROAS\n\n**🎯 Próximos Passos:**\n• Otimizar campanhas com CPL alto\n• Escalar top performers\n• Testar novos criativos`;
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[500px] bg-[#0b0f14] border-[#1f2733] p-0"
      >
        <SheetHeader className="p-6 border-b border-[#1f2733]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-[#e6edf3] text-lg">
                Chat IA
              </SheetTitle>
              <p className="text-[#9fb0c3] text-sm">
                Assistente para {client.name}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-100px)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 text-[#6b7280] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">
                    Olá! Como posso ajudar?
                  </h3>
                  <p className="text-[#9fb0c3] text-sm mb-6 max-w-sm mx-auto">
                    Faça perguntas sobre as métricas e performance do cliente {client.name}.
                  </p>
                  
                  <div className="space-y-3">
                    <p className="text-[#9fb0c3] text-xs font-medium uppercase tracking-wide">
                      Perguntas Sugeridas
                    </p>
                    {QUICK_PROMPTS.map((prompt, index) => {
                      const Icon = prompt.icon;
                      return (
                        <Card 
                          key={index}
                          className="bg-[#11161e] border-[#1f2733] hover:border-[#374151] cursor-pointer transition-colors"
                          onClick={() => handleQuickPrompt(prompt.prompt)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-[#60a5fa] flex-shrink-0" />
                              <div className="text-left">
                                <p className="text-[#e6edf3] text-sm font-medium">
                                  {prompt.title}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-[#22c55e] text-white' 
                          : 'bg-[#11161e] border border-[#1f2733] text-[#e6edf3]'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-green-100' : 'text-[#9fb0c3]'
                        }`}>
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#11161e] border border-[#1f2733] rounded-lg p-4 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-[#60a5fa] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#60a5fa] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-[#60a5fa] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-[#9fb0c3] text-sm">Analisando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-[#1f2733] p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                disabled={isLoading}
                className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280]"
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}