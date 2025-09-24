import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface Last30Summary {
  customer_id: string;
  clicks: bigint;
  impressions: bigint;
  cost: number;
}

function maskCustomerId(customerId: string): string {
  if (!customerId || customerId.length < 6) return '***';
  return customerId.slice(0, 3) + '***' + customerId.slice(-3);
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
    console.log('Fetching last 30 days summary');

    const { data, error } = await supabase
      .from('v_ads_last30_summary')
      .select('*');

    if (error) {
      console.error('Query error:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Database query failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Mask customer IDs in response
    const maskedData = (data || []).map((row: Last30Summary) => ({
      ...row,
      customer_id: maskCustomerId(row.customer_id)
    }));

    console.log(`Retrieved ${maskedData.length} customer summaries`);

    return new Response(
      JSON.stringify({
        success: true,
        data: maskedData,
        total_customers: maskedData.length
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Last30 report error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});