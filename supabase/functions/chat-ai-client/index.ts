import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, clientId, clientName } = await req.json();

    if (!message || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[chat-ai-client] Processing request for client ${clientId}`);

    // Get Lovable API Key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent metrics for context
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false })
      .limit(100);

    if (metricsError) {
      console.error('[chat-ai-client] Error fetching metrics:', metricsError);
    }

    // Fetch campaigns for context
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .limit(50);

    if (campaignsError) {
      console.error('[chat-ai-client] Error fetching campaigns:', campaignsError);
    }

    // Build context summary
    const totalSpend = metrics?.reduce((sum, m) => sum + (m.spend || 0), 0) || 0;
    const totalLeads = metrics?.reduce((sum, m) => sum + (m.leads || 0), 0) || 0;
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const totalImpressions = metrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0;
    const totalClicks = metrics?.reduce((sum, m) => sum + (m.clicks || 0), 0) || 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const contextSummary = `
Cliente: ${clientName || 'Cliente'}
Período analisado: Últimos 30 dias

MÉTRICAS GERAIS:
- Total investido: R$ ${totalSpend.toFixed(2)}
- Total de leads: ${totalLeads}
- CPL médio: R$ ${avgCpl.toFixed(2)}
- Impressões: ${totalImpressions.toLocaleString('pt-BR')}
- Cliques: ${totalClicks.toLocaleString('pt-BR')}
- CTR: ${ctr.toFixed(2)}%

CAMPANHAS ATIVAS: ${campaigns?.length || 0}
${campaigns?.slice(0, 10).map(c => `- ${c.name} (${c.platform})`).join('\n') || 'Nenhuma campanha encontrada'}

DADOS DETALHADOS (últimos registros):
${metrics?.slice(0, 10).map(m => 
  `Data: ${m.date} | Campanha: ${m.campaign_id} | Gasto: R$ ${(m.spend || 0).toFixed(2)} | Leads: ${m.leads || 0}`
).join('\n') || 'Sem dados de métricas'}
`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especialista em análise de marketing digital e gestão de tráfego pago. 
Seu trabalho é analisar dados de campanhas de Google Ads e Meta Ads e fornecer insights práticos e acionáveis.

Diretrizes:
- Seja objetivo e direto
- Use emojis para destacar informações importantes
- Formate suas respostas com markdown para facilitar a leitura
- Priorize insights que levem a ações práticas
- Identifique padrões e anomalias nos dados
- Sugira otimizações específicas quando relevante
- Use linguagem em português brasileiro

Contexto do cliente:
${contextSummary}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[chat-ai-client] AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    console.log('[chat-ai-client] Response generated successfully');

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[chat-ai-client] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
