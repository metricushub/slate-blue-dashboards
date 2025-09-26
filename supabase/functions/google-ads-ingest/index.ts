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

// Get valid access token and saved MCC
async function getValidAccessTokenAndMcc(userId: string, companyId?: string): Promise<{ accessToken: string, loginCustomerId: string }> {
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
  
  // Always use the correct MCC for the developer token: 2478435835
  const FORCED_MCC = Deno.env.get("FORCED_MCC_LOGIN_ID");
  const mccToUse = FORCED_MCC || '2478435835';
  
  // Sanitize MCC (remove hyphens)
  const sanitizedMcc = mccToUse.replace(/-/g, '');

  const now = new Date();
  const expiry = new Date(token.token_expiry);

  let accessToken = token.access_token;

  // If token expired, refresh it
  if (now >= expiry) {
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
    accessToken = refreshData.access_token;
    
    // Update token in database
    const newExpiry = new Date();
    newExpiry.setSeconds(newExpiry.getSeconds() + (refreshData.expires_in || 3600));
    
    await supabase
      .from('google_tokens')
      .update({
        access_token: accessToken,
        token_expiry: newExpiry.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    log('Token refreshed successfully');
  }

  return { 
    accessToken, 
    loginCustomerId: sanitizedMcc 
  };
}

// Validate hierarchy: ensure MCC manages the target customer
async function validateHierarchy(accessToken: string, targetCustomerId: string, loginCustomerId: string): Promise<void> {
  const cleanMcc = loginCustomerId.replace(/-/g, '');
  
  const query = `
    SELECT customer_client.id
    FROM customer_client
    WHERE customer_client.id = ${targetCustomerId}
    LIMIT 1
  `;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': cleanMcc,
    'Content-Type': 'application/json',
  };
  
  log(`[ads-call] { endpoint: "customerClient", urlCustomerId: "${cleanMcc}", targetCustomerId: "${targetCustomerId}", loginCustomerId: "${cleanMcc}" }`);
  
  const response = await fetch(`https://googleads.googleapis.com/v21/customers/${cleanMcc}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hierarchy validation failed: O MCC ${cleanMcc} não gerencia a conta ${targetCustomerId}. Conecte a conta certa ou altere o MCC/dev-token.`);
  }
  
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`O MCC ${cleanMcc} não gerencia a conta ${targetCustomerId}. Conecte a conta certa ou altere o MCC/dev-token.`);
  }
}

async function runGoogleAdsQuery(accessToken: string, customerId: string, query: string, loginCustomerId?: string): Promise<MetricData[]> {
  const cleanCustomerId = customerId.replace(/-/g, '');
  
  // Mandatory diagnostics before API call
  log(`[ads-call] { endpoint: "googleAds:searchStream", urlCustomerId: "${cleanCustomerId}", targetCustomerId: "${cleanCustomerId}", loginCustomerId: "${loginCustomerId || 'none'}" }`);
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };

  // Only add login-customer-id if provided (for fallback mode)
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }

  const response = await fetch(`https://googleads.googleapis.com/v21/customers/${cleanCustomerId}/googleAds:searchStream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  log('Google Ads API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    log('Google Ads API error:', response.status, errorText);
    
    if (response.status === 403 && errorText.includes('USER_PERMISSION_DENIED')) {
      const mccInfo = loginCustomerId ? ` MCC ${loginCustomerId}` : ' (sem MCC)';
      throw new Error(`Acesso negado à conta ${cleanCustomerId}. Verifique se o${mccInfo} gerencia esta conta e se o developer token está aprovado.`);
    }
    
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

  log(`Successfully processed ${metrics.length} metric records`);
  return metrics;
}


// Send metrics to ingest endpoint with mandatory API key
async function sendToIngestEndpoint(metrics: MetricData[], customerId: string): Promise<any> {
  const METRICUS_INGEST_KEY = Deno.env.get("METRICUS_INGEST_KEY");
  
  if (!METRICUS_INGEST_KEY) {
    const errorMsg = 'Configure METRICUS_INGEST_KEY nas envs das Functions.';
    log('ERROR:', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Transform metrics for our schema
  const transformedMetrics = metrics.map(metric => ({
    date: metric.date,
    client_id: customerId, // This will be validated as customer_id in ingest-metrics
    customer_id: customerId, // Explicitly pass customer_id
    platform: 'google_ads',
    campaign_id: metric.campaign_id,
    impressions: metric.impressions,
    clicks: metric.clicks,
    spend: metric.cost,
    conversions: metric.conversions,
    leads: metric.conversions,
    cpa: metric.conversions > 0 ? metric.cost / metric.conversions : null,
    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : null,
    conv_rate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : null,
  }));

  log(`Sending ${transformedMetrics.length} metrics to ingest-metrics with x-api-key`);

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
    
    if (response.status === 401) {
      throw new Error('Configure METRICUS_INGEST_KEY nas envs das Functions.');
    }
    
    throw new Error(`Ingest error: ${response.status} - ${errorText}`);
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
      // Get valid access token and saved MCC
      const { accessToken, loginCustomerId } = await getValidAccessTokenAndMcc(user_id, company_id);
      log(`Access token and MCC obtained. MCC: ***${loginCustomerId.slice(-4)}`);

      // Check if fallback mode is enabled
      const allowFallback = Deno.env.get("ALLOW_FALLBACK_NO_MCC") === "true";
      const allow_fallback_no_mcc = body.allow_fallback_no_mcc || allowFallback;
      
      let shouldUseFallback = false;
      let finalLoginCustomerId: string | undefined = loginCustomerId;

      // Try to validate hierarchy first
      try {
        await validateHierarchy(accessToken, customer_id, loginCustomerId);
        log(`Hierarchy validated for customer ${customer_id} with MCC ***${loginCustomerId.slice(-4)}`);
      } catch (hierarchyError) {
        const errorMessage = hierarchyError instanceof Error ? hierarchyError.message : String(hierarchyError);
        log(`Hierarchy validation failed: ${errorMessage}`);
        
        if (allow_fallback_no_mcc) {
          log(`FALLBACK ENABLED: Will attempt ingest WITHOUT login-customer-id`);
          shouldUseFallback = true;
          finalLoginCustomerId = undefined; // Don't use MCC header
        } else {
          log(`FALLBACK DISABLED: Throwing hierarchy error`);
          throw hierarchyError;
        }
      }

      // Build Google Ads query
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

      // Run query with or without MCC depending on fallback mode
      if (shouldUseFallback) {
        log(`Running query in FALLBACK mode (no login-customer-id) for account ${customer_id}`);
      }
      const metrics = await runGoogleAdsQuery(accessToken, customer_id, query, finalLoginCustomerId);
      log(`Query executed successfully. Total results: ${metrics.length}`);
      
      // Log insights about the results
      if (metrics.length === 0) {
        log('No metrics found. Possible reasons:');
        log('- No campaigns in the account');
        log('- No campaigns with data in the date range');
        log('- Account has no activity in the specified period');
      } else {
        const campaigns = [...new Set(metrics.map(m => m.campaign_name))];
        const totalSpend = metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
        log(`Found data for ${campaigns.length} campaigns. Total spend: $${totalSpend.toFixed(2)}, Total clicks: ${totalClicks}`);
        log(`Sample campaigns: ${campaigns.slice(0, 3).join(', ')}${campaigns.length > 3 ? '...' : ''}`);
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
          date_range: { start_date: startDate, end_date: endDate },
          fallback_used: shouldUseFallback
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
          error_message: processingError instanceof Error ? processingError.message : String(processingError)
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