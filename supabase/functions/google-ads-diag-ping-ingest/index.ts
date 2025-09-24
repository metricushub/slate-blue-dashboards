import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface PingIngestResult {
  success: boolean;
  customerId?: string;
  recordsIngested: number;
  dateRange?: {
    start: string;
    end: string;
  };
  error?: string;
}

function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

function maskCustomerId(customerId: string): string {
  if (!customerId || customerId.length < 6) return '***';
  return customerId.slice(0, 3) + '***' + customerId.slice(-3);
}

async function refreshAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: token } = await supabase
    .from('google_tokens')
    .select('refresh_token, token_expiry, access_token')
    .eq('user_id', userId)
    .single();

  if (!token) return null;

  // Check if token needs refresh (5 min buffer)
  const now = new Date();
  const expiry = new Date(token.token_expiry);
  const buffer = 5 * 60 * 1000;

  if (now.getTime() < (expiry.getTime() - buffer)) {
    return token.access_token;
  }

  // Refresh token
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!refreshResponse.ok) {
    console.log('Token refresh failed');
    return null;
  }

  const refreshData = await refreshResponse.json();
  const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000));

  await supabase
    .from('google_tokens')
    .update({
      access_token: refreshData.access_token,
      token_expiry: newExpiry.toISOString()
    })
    .eq('user_id', userId);

  return refreshData.access_token;
}

async function ingestLightMetrics(
  supabase: any,
  accessToken: string,
  customerId: string,
  startDate: string,
  endDate: string,
  loginCustomerId?: string
): Promise<number> {
  const sanitizedCustomerId = sanitizeCustomerId(customerId);
  const sanitizedLoginCustomerId = loginCustomerId ? sanitizeCustomerId(loginCustomerId) : null;

  try {
    const gaqlQuery = `
      SELECT 
        segments.date,
        campaign.id,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros
      FROM campaign 
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date DESC
      LIMIT 100
    `;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
      'Content-Type': 'application/json'
    };

    if (sanitizedLoginCustomerId) {
      headers['login-customer-id'] = sanitizedLoginCustomerId;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v17/customers/${sanitizedCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: gaqlQuery })
      }
    );

    if (!response.ok) {
      console.log(`GAQL ingest failed: ${response.status}`);
      return 0;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return 0;
    }

    // Transform and insert metrics
    const metricsToInsert = data.results.map((result: any) => ({
      customer_id: sanitizedCustomerId,
      date: result.segments?.date,
      campaign_id: result.campaign?.id?.toString(),
      platform: 'google_ads',
      clicks: BigInt(result.metrics?.clicks || 0),
      impressions: BigInt(result.metrics?.impressions || 0),
      cost_micros: result.metrics?.cost_micros ? 
        parseFloat(result.metrics.cost_micros) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('google_ads_metrics')
      .upsert(metricsToInsert, {
        onConflict: 'customer_id,date,campaign_id,platform'
      });

    if (error) {
      console.log('Supabase insert error:', error.message);
      return 0;
    }

    return metricsToInsert.length;

  } catch (error) {
    console.log('Ingest error:', error instanceof Error ? error.message : String(error));
    return 0;
  }
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
    const { userId, customerId, days = 7 } = await req.json();

    if (!userId || !customerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: userId, customerId' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Ping ingest: Customer ${maskCustomerId(customerId)}, ${days} days`);

    // Get login customer ID for this customer
    const { data: binding } = await supabase
      .from('account_bindings')
      .select('resolved_login_customer_id')
      .eq('user_id', userId)
      .eq('customer_id', sanitizeCustomerId(customerId))
      .single();

    // Refresh token if needed
    const accessToken = await refreshAccessToken(supabase, userId);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to refresh access token' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Run light ingest
    const recordsIngested = await ingestLightMetrics(
      supabase,
      accessToken,
      customerId,
      startDateStr,
      endDateStr,
      binding?.resolved_login_customer_id
    );

    const result: PingIngestResult = {
      success: true,
      customerId: maskCustomerId(customerId),
      recordsIngested,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      }
    };

    console.log(`Ping ingest result: ${recordsIngested} records`);

    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Ping ingest error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});