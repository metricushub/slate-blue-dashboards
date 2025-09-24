import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface DailyCampaign {
  customer_id: string;
  date: string;
  campaign_id: string;
  clicks: bigint;
  impressions: bigint;
  cost_micros: bigint;
  cost: number;
  ctr: number;
  cpc: number;
}

function maskCustomerId(customerId: string): string {
  if (!customerId || customerId.length < 6) return '***';
  return customerId.slice(0, 3) + '***' + customerId.slice(-3);
}

function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API key for internal functions
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== Deno.env.get('METRICUS_INGEST_KEY')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    if (!customerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing customerId parameter' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const sanitizedCustomerId = sanitizeCustomerId(customerId);
    console.log(`Daily campaign report for: ${maskCustomerId(sanitizedCustomerId)}`);

    let query = supabase
      .from('v_ads_daily_campaign')
      .select('*')
      .eq('customer_id', sanitizedCustomerId)
      .order('date', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Query error:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Database query failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Mask customer ID in response
    const maskedData = (data || []).map((row: DailyCampaign) => ({
      ...row,
      customer_id: maskCustomerId(row.customer_id)
    }));

    console.log(`Retrieved ${maskedData.length} daily campaign records`);

    return new Response(
      JSON.stringify({
        success: true,
        data: maskedData,
        customer_id: maskCustomerId(sanitizedCustomerId),
        total_records: maskedData.length
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Daily campaign report error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});