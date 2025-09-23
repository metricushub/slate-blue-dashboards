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
  const { data, error: refreshError } = await supabase.functions.invoke('google-oauth', {
    body: {
      action: 'refresh', 
      refresh_token: token.refresh_token,
      user_id: userId
    }
  });

  if (refreshError || !data?.access_token) {
    throw new Error('Failed to refresh Google Ads token');
  }

  return data.access_token;
}

// Run Google Ads query
async function runGoogleAdsQuery(accessToken: string, customerId: string, query: string): Promise<MetricData[]> {
  const url = `https://googleads.googleapis.com/v16/customers/${customerId.replace(/-/g, '')}/googleAds:searchStream`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('Google Ads API error:', response.status, errorText);
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const results = await response.json();
  const metrics: MetricData[] = [];

  if (results.results) {
    for (const row of results.results) {
      const segments = row.segments || {};
      const campaign = row.campaign || {};
      const campaignMetrics = row.metrics || {};

      metrics.push({
        date: segments.date || new Date().toISOString().split('T')[0],
        campaign_id: campaign.id || 'unknown',
        campaign_name: campaign.name || 'Unknown Campaign',
        impressions: parseInt(campaignMetrics.impressions || '0'),
        clicks: parseInt(campaignMetrics.clicks || '0'),
        cost: parseFloat(campaignMetrics.cost_micros || '0') / 1000000, // Convert micros to currency
        conversions: parseFloat(campaignMetrics.conversions || '0'),
      });
    }
  }

  return metrics;
}

// Send metrics to ingest endpoint
async function sendToIngestEndpoint(metrics: MetricData[], customerId: string): Promise<any> {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
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

  const { data, error } = await supabase.functions.invoke('ingest-metrics', {
    body: transformedMetrics
  });

  if (error) {
    throw new Error(`Ingest error: ${error.message}`);
  }

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

      // Build Google Ads query
      const query = `
        SELECT 
          segments.date,
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign 
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status = 'ENABLED'
      `;

      // Run query
      const metrics = await runGoogleAdsQuery(accessToken, customer_id, query);
      log(`Retrieved ${metrics.length} metric records`);

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