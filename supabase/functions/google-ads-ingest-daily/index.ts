import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngestResult {
  customer_id: string;
  success: boolean;
  inserted?: number;
  updated?: number;
  error?: string;
  retries?: number;
}

interface BackoffResult {
  success: boolean;
  result?: any;
  error?: string;
  retries: number;
}

// Configurações
const DAYS_TO_INGEST = 7; // Últimos 7 dias
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 segundo base para backoff

// Função para backoff exponencial
async function withBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<BackoffResult> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const result = await operation();
      return { success: true, result, retries };
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      
      // Se for o último retry ou erro não for recuperável
      if (retries === maxRetries || !isRetryableError(error)) {
        return { 
          success: false, 
          error: errorMessage, 
          retries 
        };
      }
      
      // Calcular delay exponencial com jitter
      const delay = BASE_DELAY * Math.pow(2, retries) + Math.random() * 1000;
      console.log(`Retry ${retries + 1}/${maxRetries} after ${delay}ms for error: ${errorMessage}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  return { success: false, error: 'Max retries exceeded', retries };
}

// Verificar se o erro é recuperável
function isRetryableError(error: any): boolean {
  const status = error.status || error.code;
  const message = error.message || '';
  
  // Retry em 429 (rate limit), 5xx (server errors), timeouts
  return (
    status === 429 ||
    (status >= 500 && status < 600) ||
    message.includes('timeout') ||
    message.includes('ECONNRESET') ||
    message.includes('fetch failed')
  );
}

// Calcular datas para ingestão
function getDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS_TO_INGEST);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Chamar a ingestão para um customer específico
async function ingestCustomer(
  customer_id: string,
  user_id: string,
  startDate: string,
  endDate: string
): Promise<IngestResult> {
  const operation = async () => {
    const functionsHost = Deno.env.get('SUPABASE_URL')?.replace('/rest/', '/functions/');
    const response = await fetch(`${functionsHost}/google-ads-ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        customer_id,
        user_id,
        startDate,
        endDate
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  };

  console.log(`[${customer_id}] Starting ingest for ${startDate} to ${endDate}`);
  
  const result = await withBackoff(operation);
  
  if (result.success) {
    const data = result.result;
    console.log(`[${customer_id}] Success: inserted=${data.inserted}, updated=${data.updated}`);
    return {
      customer_id,
      success: true,
      inserted: data.inserted || 0,
      updated: data.updated || 0,
      retries: result.retries
    };
  } else {
    console.error(`[${customer_id}] Failed after ${result.retries} retries: ${result.error}`);
    return {
      customer_id,
      success: false,
      error: result.error,
      retries: result.retries
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[google-ads-ingest-daily] Starting daily ingestion process');

    // Buscar todos os customer_ids com tokens válidos
    const { data: tokens, error: tokensError } = await supabase
      .from('google_tokens')
      .select('user_id, customer_id')
      .not('customer_id', 'is', null)
      .not('access_token', 'is', null);

    if (tokensError) {
      console.error('[google-ads-ingest-daily] Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch customer accounts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('[google-ads-ingest-daily] No customer accounts found');
      return new Response(
        JSON.stringify({ message: 'No customer accounts to process', results: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[google-ads-ingest-daily] Found ${tokens.length} customer accounts to process`);

    const { startDate, endDate } = getDateRange();
    const results: IngestResult[] = [];
    let totalInserted = 0;
    let totalUpdated = 0;
    let successCount = 0;
    let errorCount = 0;

    // Processar cada customer_id
    for (const token of tokens) {
      try {
        console.log(`[google-ads-ingest-daily] Processing customer ${token.customer_id} for user ${token.user_id}`);
        
        const result = await ingestCustomer(
          token.customer_id,
          token.user_id,
          startDate,
          endDate
        );
        
        results.push(result);
        
        if (result.success) {
          successCount++;
          totalInserted += result.inserted || 0;
          totalUpdated += result.updated || 0;
        } else {
          errorCount++;
        }

        // Pequeno delay entre contas para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[google-ads-ingest-daily] Unexpected error processing customer ${token.customer_id}:`, error);
        
        results.push({
          customer_id: token.customer_id,
          success: false,
          error: `Unexpected error: ${error.message}`,
          retries: 0
        });
        errorCount++;
      }
    }

    // Log do resumo final
    console.log(`[google-ads-ingest-daily] Daily ingestion completed:`, {
      total_accounts: tokens.length,
      successful: successCount,
      failed: errorCount,
      total_inserted: totalInserted,
      total_updated: totalUpdated,
      date_range: `${startDate} to ${endDate}`
    });

    // Registrar resultado na tabela de ingestões
    for (const result of results.filter(r => r.success)) {
      try {
        await supabase
          .from('google_ads_ingestions')
          .insert({
            user_id: tokens.find(t => t.customer_id === result.customer_id)?.user_id,
            customer_id: result.customer_id,
            start_date: startDate,
            end_date: endDate,
            status: 'completed',
            records_processed: (result.inserted || 0) + (result.updated || 0),
            completed_at: new Date().toISOString()
          });
      } catch (error) {
        console.warn(`Failed to log ingestion for ${result.customer_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily ingestion completed: ${successCount}/${tokens.length} accounts processed successfully`,
        summary: {
          total_accounts: tokens.length,
          successful: successCount,
          failed: errorCount,
          total_inserted: totalInserted,
          total_updated: totalUpdated,
          date_range: `${startDate} to ${endDate}`
        },
        results: results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[google-ads-ingest-daily] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});