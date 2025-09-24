import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface MetricPayload {
  date: string;
  client_id: string; // Can be UUID (internal client) or customer_id (Google Ads)
  customer_id?: string; // Google Ads customer ID
  campaign_id?: string;
  platform: 'google_ads' | 'meta_ads' | 'google' | 'meta';
  impressions?: number;
  clicks?: number;
  spend?: number;
  leads?: number;
  conversions?: number;
  revenue?: number;
  cpa?: number;
  roas?: number;
  ctr?: number;
  conv_rate?: number;
}

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to sanitize customer ID (remove hyphens/dots)
function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[-\.]/g, '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('METRICUS_INGEST_KEY');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.log('Tentativa de acesso não autorizada');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload: MetricPayload | MetricPayload[] = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle both single metrics and batch
    const metrics = Array.isArray(payload) ? payload : [payload];
    
    console.log(`Processando ${metrics.length} métricas`);

    // Validate and prepare metrics
    const validatedMetrics = [];
    const errors = [];

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      
      try {
        // Validate required fields
        if (!metric.date) {
          throw new Error('Campo "date" é obrigatório');
        }
        
        if (!metric.client_id) {
          throw new Error('Campo "client_id" é obrigatório');
        }
        
        if (!metric.platform) {
          throw new Error('Campo "platform" é obrigatório');
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(metric.date)) {
          throw new Error('Data deve estar no formato YYYY-MM-DD');
        }

        // Determine customer_id and client_id based on input
        let finalCustomerId: string | null = null;
        let finalClientId: string | null = null;
        let clientIdInvalid = false;
        let clientBindingFound = false;

        // If customer_id is provided, use it (Google Ads case)
        if (metric.customer_id) {
          finalCustomerId = sanitizeCustomerId(metric.customer_id);
          
          // Check if client_id is a valid UUID
          if (isValidUUID(metric.client_id)) {
            finalClientId = metric.client_id;
            clientBindingFound = true;
          } else {
            clientIdInvalid = true;
            // Try to find mapping from customer_id to client_id
            try {
              const { data: connection } = await supabase
                .from('google_ads_connections')
                .select('client_id')
                .eq('customer_id', finalCustomerId)
                .single();
              
              if (connection) {
                finalClientId = connection.client_id;
                clientBindingFound = true;
              }
            } catch {
              // No mapping found, continue with client_id = null
            }
          }
        } else {
          // Legacy case: client_id might be UUID or customer_id
          if (isValidUUID(metric.client_id)) {
            finalClientId = metric.client_id;
            clientBindingFound = true;
          } else {
            // Treat client_id as customer_id
            finalCustomerId = sanitizeCustomerId(metric.client_id);
            clientIdInvalid = true;
            
            // Try to find mapping
            try {
              const { data: connection } = await supabase
                .from('google_ads_connections')
                .select('client_id')
                .eq('customer_id', finalCustomerId)
                .single();
              
              if (connection) {
                finalClientId = connection.client_id;
                clientBindingFound = true;
              }
            } catch {
              // No mapping found, continue with client_id = null
            }
          }
        }

        // Log validation status
        console.log(`Métrica ${i}: customer_id=${finalCustomerId}, client_id_invalid=${clientIdInvalid}, client_binding_found=${clientBindingFound}`);

        // Calculate derived metrics if not provided
        const impressions = Number(metric.impressions || 0);
        const clicks = Number(metric.clicks || 0);
        const spend = Number(metric.spend || 0);
        const leads = Number(metric.leads || 0);
        const conversions = Number(metric.conversions || 0);
        const revenue = Number(metric.revenue || 0);

        const calculatedMetric = {
          date: metric.date,
          client_id: finalClientId,
          customer_id: finalCustomerId,
          campaign_id: metric.campaign_id || null,
          platform: metric.platform,
          impressions,
          clicks,
          spend,
          leads,
          conversions,
          revenue,
          cpa: metric.cpa || (leads > 0 ? spend / leads : 0),
          roas: metric.roas || (spend > 0 ? revenue / spend : 0),
          ctr: metric.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0),
          conv_rate: metric.conv_rate || (clicks > 0 ? (leads / clicks) * 100 : 0)
        };

        validatedMetrics.push(calculatedMetric);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          metric
        });
      }
    }

    console.log(`${validatedMetrics.length} métricas válidas, ${errors.length} erros`);

    // Insert valid metrics using upsert
    let insertedCount = 0;
    if (validatedMetrics.length > 0) {
      const { error: insertError, count } = await supabase
        .from('metrics')
        .upsert(validatedMetrics, {
          onConflict: 'date,platform,customer_id,campaign_id',
          ignoreDuplicates: false
        })
        .select('id', { count: 'exact' });

      if (insertError) {
        console.error('Erro ao inserir métricas:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Database error',
          details: insertError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      insertedCount = count || validatedMetrics.length;
    }

    const response = {
      success: true,
      inserted: insertedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${insertedCount} métricas processadas com sucesso`
    };

    console.log('Resposta:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro geral na função:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});