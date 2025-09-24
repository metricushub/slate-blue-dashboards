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

// Helper function to sanitize customer ID (remove hyphens/dots, keep only numbers)
function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
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

        // Buscar client_id através da tabela google_ads_connections
        let linkedClientId = null;
        if (finalCustomerId) {
          const { data: connection } = await supabase
            .from('google_ads_connections')
            .select('client_id')
            .eq('customer_id', finalCustomerId)
            .eq('user_id', user.id)
            .single();
          
          if (connection) {
            linkedClientId = connection.client_id;
            console.log(`Métrica ${i}: Encontrada vinculação customer_id=${finalCustomerId} -> client_id=${linkedClientId}`);
          } else {
            console.log(`Métrica ${i}: Nenhuma vinculação encontrada para customer_id=${finalCustomerId}, usando client_id=NULL`);
          }
        }

        // Buscar client_id através da tabela google_ads_connections
        let linkedClientId = null;
        if (finalCustomerId) {
          const { data: connection } = await supabase
            .from('google_ads_connections')
            .select('client_id')
            .eq('customer_id', finalCustomerId)
            .eq('user_id', user.id)
            .single();
          
          if (connection) {
            linkedClientId = connection.client_id;
            console.log(`Métrica ${i}: Encontrada vinculação customer_id=${finalCustomerId} -> client_id=${linkedClientId}`);
          } else {
            console.log(`Métrica ${i}: Nenhuma vinculação encontrada para customer_id=${finalCustomerId}, usando client_id=NULL`);
          }
        }

        // Calculate derived metrics if not provided with proper normalization
        const impressions = parseInt(metric.impressions) || 0;
        const clicks = parseInt(metric.clicks) || 0;
        const spend = parseFloat(metric.spend) || 0;
        const leads = parseInt(metric.leads) || 0;
        const conversions = parseInt(metric.conversions) || 0;
        const revenue = parseFloat(metric.revenue) || 0;

        // Ensure proper data types and validation
        const processedClientId = finalClientId && isValidUUID(finalClientId) ? finalClientId : null;
        const processedCustomerId = finalCustomerId ? finalCustomerId.replace(/[^0-9]/g, '') : null;
        const processedCampaignId = metric.campaign_id ? String(metric.campaign_id) : null;
        
        const calculatedMetric = {
          date: metric.date,
          client_id: linkedClientId, // Usar client_id da vinculação ou NULL
          customer_id: processedCustomerId,
          campaign_id: processedCampaignId,
          platform: metric.platform || 'google_ads',
          impressions,
          clicks,
          spend,
          leads,
          conversions,
          revenue,
          // Normalize rates to 6 decimal places max
          cpa: metric.cpa ? parseFloat(parseFloat(metric.cpa).toFixed(6)) : (leads > 0 ? parseFloat((spend / leads).toFixed(6)) : 0),
          roas: metric.roas ? parseFloat(parseFloat(metric.roas).toFixed(6)) : (spend > 0 ? parseFloat((revenue / spend).toFixed(6)) : 0),
          ctr: metric.ctr ? parseFloat(parseFloat(metric.ctr).toFixed(6)) : (impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(6)) : 0),
          conv_rate: metric.conv_rate ? parseFloat(parseFloat(metric.conv_rate).toFixed(6)) : (clicks > 0 ? parseFloat(((leads / clicks) * 100).toFixed(6)) : 0)
        };

        // Log detailed metric data before adding to array
        console.log(`Métrica ${i} processada:`, {
          date: calculatedMetric.date,
          client_id: linkedClientId ? linkedClientId.substring(0,8) + '...' : 'NULL (sem vinculação)',
          customer_id: calculatedMetric.customer_id || 'NULL',
          campaign_id: calculatedMetric.campaign_id || 'NULL',
          platform: calculatedMetric.platform,
          impressions: calculatedMetric.impressions,
          clicks: calculatedMetric.clicks,
          spend: calculatedMetric.spend,
          conversions: calculatedMetric.conversions,
          original_client_id: metric.client_id,
          customer_id_normalized: processedCustomerId ? 'YES' : 'NO',
          campaign_id_converted: processedCampaignId ? 'YES' : 'NO',
          rates_normalized: 'YES',
          vinculacao_encontrada: linkedClientId ? 'SIM' : 'NAO'
        });
          platform: calculatedMetric.platform,
          impressions: calculatedMetric.impressions,
          clicks: calculatedMetric.clicks,
          spend: calculatedMetric.spend,
          conversions: calculatedMetric.conversions,
          original_client_id: metric.client_id,
          client_id_valid: processedClientId ? 'YES' : 'NO',
          customer_id_normalized: processedCustomerId ? 'YES' : 'NO',
          campaign_id_converted: processedCampaignId ? 'YES' : 'NO',
          rates_normalized: 'YES'
        });

        // Log detailed metric data before adding to array (masking sensitive data)
        console.log(`Métrica processada ${i}:`, {
          date: calculatedMetric.date,
          client_id: calculatedMetric.client_id ? calculatedMetric.client_id.substring(0, 8) + '...' : 'NULL',
          customer_id: calculatedMetric.customer_id,
          campaign_id: calculatedMetric.campaign_id,
          platform: calculatedMetric.platform,
          impressions: calculatedMetric.impressions,
          clicks: calculatedMetric.clicks,
          spend: calculatedMetric.spend
        });

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

    // Generate row_key for each validated metric and insert using upsert
    let insertedCount = 0;
    let updatedCount = 0;
    
    if (validatedMetrics.length > 0) {
      // Generate row_key for each metric using database function
      const metricsWithRowKey = [];
      
      for (const metric of validatedMetrics) {
        const { data: rowKeyResult } = await supabase
          .rpc('generate_metrics_row_key', {
            p_customer_id: metric.customer_id,
            p_date: metric.date,
            p_campaign_id: metric.campaign_id,
            p_platform: metric.platform
          });
        
        metricsWithRowKey.push({
          ...metric,
          row_key: rowKeyResult
        });
      }

      console.log(`Inserindo ${metricsWithRowKey.length} métricas com row_key`);
      
      // Log sample data being inserted (first metric)
      if (metricsWithRowKey.length > 0) {
        const sampleMetric = metricsWithRowKey[0];
        console.log('Exemplo de métrica que será inserida:', {
          date: sampleMetric.date,
          client_id: sampleMetric.client_id ? `UUID:${sampleMetric.client_id.substring(0,8)}...` : 'NULL',
          customer_id: sampleMetric.customer_id || 'NULL',
          campaign_id: sampleMetric.campaign_id || 'NULL',
          platform: sampleMetric.platform,
          row_key: sampleMetric.row_key ? sampleMetric.row_key.substring(0,12) + '...' : 'NULL'
        });
      }

      // Log first few records to be inserted (for debugging UUID issues)
      if (metricsWithRowKey.length > 0) {
        console.log('Amostra de registros a serem inseridos:', metricsWithRowKey.slice(0, 3).map(record => ({
          row_key: record.row_key?.substring(0, 8) + '...',
          date: record.date,
          client_id: record.client_id ? (record.client_id.length > 20 ? record.client_id.substring(0, 8) + '...' : record.client_id) : 'NULL',
          customer_id: record.customer_id,
          campaign_id: record.campaign_id,
          platform: record.platform,
          client_id_type: typeof record.client_id,
          customer_id_type: typeof record.customer_id,
          campaign_id_type: typeof record.campaign_id
        })));
      }

      // Use upsert with row_key conflict resolution, only updating metric fields
      const { error: insertError, data } = await supabase
        .from('metrics')
        .upsert(metricsWithRowKey, {
          onConflict: 'row_key',
          ignoreDuplicates: false
        })
        .select('*');

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

      // Count new vs updated records
      insertedCount = data?.length || 0;
      
      // For now, assume all records were either inserted or updated
      // In practice, we could track this more precisely by checking existing records first
      console.log(`Operação concluída: ${insertedCount} registros processados`);
    }

    const response = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${insertedCount} métricas processadas com sucesso`
    };

    console.log(`Resposta final: ${insertedCount} inseridas/atualizadas, ${errors.length} erros`);

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