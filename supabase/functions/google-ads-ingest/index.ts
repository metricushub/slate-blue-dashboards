// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

function log(...args: any[]) { 
  console.log("[google-ads-ingest]", ...args); 
}

interface MetricData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(userId: string, companyId?: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data: tokens, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !tokens || tokens.length === 0) {
    throw new Error('No Google Ads tokens found');
  }

  const token = tokens[0];
  const now = new Date();
  const expiry = new Date(token.token_expiry);

  // If token is still valid, return it
  if (now < expiry) {
    return token.access_token;
  }

  // Token expired, refresh it
  log('Token expired, refreshing...');
  
  const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing OAuth credentials for token refresh');
  }

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    log('Token refresh failed:', refreshResponse.status, errorText);
    throw new Error('Failed to refresh Google Ads token');
  }

  const refreshData = await refreshResponse.json();
  const newAccessToken = refreshData.access_token;
  
  // Update token in database
  const newExpiry = new Date();
  newExpiry.setSeconds(newExpiry.getSeconds() + (refreshData.expires_in || 3600));
  
  await supabase
    .from('google_tokens')
    .update({
      access_token: newAccessToken,
      token_expiry: newExpiry.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  log('Token refreshed successfully');
  return newAccessToken;
}

// Run Google Ads query
async function runGoogleAdsQuery(accessToken: string, customerId: string, query: string, loginCustomerId?: string): Promise<MetricData[]> {
  const cleanCustomerId = customerId.replace(/-/g, '');
  const baseA = `https://googleads.googleapis.com/v21/customers/${cleanCustomerId}/googleAds:searchStream`;
  const baseB = `https://googleads.googleapis.com/googleads/v21/customers/${cleanCustomerId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');

  // Try first URL, fallback to second if 404
  let response = await fetch(baseA, { method: 'POST', headers, body: JSON.stringify({ query }) });
  if (response.status === 404) {
    log('searchStream 404 on baseA, trying baseB');
    response = await fetch(baseB, { method: 'POST', headers, body: JSON.stringify({ query }) });
  }

  log('Google Ads API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    log('Google Ads API error:', response.status, errorText);
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const payload = await response.json();
  const streams = Array.isArray(payload) ? payload : [payload];

  const metrics: MetricData[] = [];

  for (const stream of streams) {
    const rows = stream.results || [];
    for (const row of rows) {
      const segments = row.segments || {};
      const campaign = row.campaign || {};
      const m = row.metrics || {};

      metrics.push({
        date: segments.date || new Date().toISOString().split('T')[0],
        campaign_id: String(campaign.id ?? 'unknown'),
        campaign_name: String(campaign.name ?? 'Unknown Campaign'),
        impressions: Number(m.impressions ?? 0),
        clicks: Number(m.clicks ?? 0),
        cost: Number(m.cost_micros ?? 0) / 1_000_000,
        conversions: Number(m.conversions ?? 0),
      });
    }
  }

  log(`Processed ${metrics.length} metric records`);
  return metrics;
}


// Send metrics to ingest endpoint
async function sendToIngestEndpoint(metrics: MetricData[], customerId: string): Promise<any> {
  const METRICUS_INGEST_KEY = Deno.env.get("METRICUS_INGEST_KEY");
  
  if (!METRICUS_INGEST_KEY) {
    log('ERROR: METRICUS_INGEST_KEY not found in environment variables');
    throw new Error('Missing METRICUS_INGEST_KEY - configure this secret in Supabase Functions settings');
  }
  
  // Transform metrics for our schema
  const transformedMetrics = metrics.map(metric => ({
    date: metric.date,
    client_id: customerId, // We'll need to map this properly
    platform: 'google_ads',
    campaign_id: metric.campaign_id,
    impressions: metric.impressions,
    clicks: metric.clicks,
    spend: metric.cost,
    conversions: metric.conversions,
    leads: metric.conversions, // Assuming conversions = leads
    // Calculate derived metrics
    cpa: metric.conversions > 0 ? metric.cost / metric.conversions : null,
    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : null,
    conv_rate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : null,
  }));

  log(`Sending ${transformedMetrics.length} metrics to ingest-metrics with API key`);

  // Call ingest-metrics with proper authentication
  const ingestUrl = `${SUPABASE_URL}/functions/v1/ingest-metrics`;
  const response = await fetch(ingestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': METRICUS_INGEST_KEY,
    },
    body: JSON.stringify(transformedMetrics)
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('Ingest endpoint error:', response.status, errorText);
    throw new Error(`Ingest error: Edge Function returned a non-2xx status code`);
  }

  const data = await response.json();
  log('Ingest successful:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!GOOGLE_ADS_DEVELOPER_TOKEN) {
      throw new Error("Missing Google Ads Developer Token");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    
    const { user_id, company_id, customer_id, start_date, end_date } = body;
    
    if (!user_id || !customer_id) {
      throw new Error("Missing required parameters: user_id, customer_id");
    }

    // Default date range: last 7 days
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    log('Starting ingestion', { user_id, customer_id, startDate, endDate });

    // Create ingestion record
    const { data: ingestion, error: ingestionError } = await supabase
      .from('google_ads_ingestions')
      .insert({
        user_id,
        customer_id,
        start_date: startDate,
        end_date: endDate,
        status: 'running'
      })
      .select()
      .single();

    if (ingestionError) {
      throw new Error(`Failed to create ingestion record: ${ingestionError.message}`);
    }

    try {
      // Get valid access token
      const accessToken = await getValidAccessToken(user_id, company_id);
      log('Access token obtained');

      // Optionally get login_customer_id (for MCC manager accounts)
      const { data: tokenRows } = await supabase
        .from('google_tokens')
        .select('login_customer_id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);
      const loginCustomerId = tokenRows?.[0]?.login_customer_id || undefined;

      // Build Google Ads query with more debug info
      const query = `
        SELECT 
          segments.date,
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign 
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY segments.date DESC
      `;

      // Run query
      const metrics = await runGoogleAdsQuery(accessToken, customer_id, query, loginCustomerId);
      log(`Query executed. Total results: ${metrics.length}`);
      
      // Log some details about what we found
      if (metrics.length === 0) {
        log('No metrics found. This could mean:');
        log('- No campaigns in the account');
        log('- No campaigns with data in the date range');
        log('- Account has no activity in the last 7 days');
      } else {
        const campaigns = [...new Set(metrics.map(m => m.campaign_name))];
        log(`Found data for ${campaigns.length} campaigns: ${campaigns.slice(0, 3).join(', ')}${campaigns.length > 3 ? '...' : ''}`);
      }

      // Send to ingest endpoint if we have data
      if (metrics.length > 0) {
        const ingestResult = await sendToIngestEndpoint(metrics, customer_id);
        log('Ingest completed', ingestResult);
      }

      // Update ingestion record as completed
      await supabase
        .from('google_ads_ingestions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: metrics.length
        })
        .eq('id', ingestion.id);

      return new Response(
        JSON.stringify({ 
          ok: true, 
          ingestion_id: ingestion.id,
          records_processed: metrics.length,
          customer_id,
          date_range: { start_date: startDate, end_date: endDate }
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (processingError) {
      log('Processing error:', processingError);
      
      // Update ingestion record as failed
      await supabase
        .from('google_ads_ingestions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: processingError.message
        })
        .eq('id', ingestion.id);

      throw processingError;
    }

  } catch (e) {
    log("ingest_error", String(e));
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});