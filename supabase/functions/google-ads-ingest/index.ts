import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface MetricData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
}

async function getValidAccessToken(userId: string, companyId?: string) {
  console.log('Getting valid access token for user:', userId);
  
  const { data: tokenData, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId || null)
    .single();

  if (error || !tokenData) {
    throw new Error('No Google Ads tokens found for user');
  }

  // Check if token is expired
  const now = new Date();
  const expiry = new Date(tokenData.token_expiry);
  
  if (now >= expiry) {
    console.log('Token expired, refreshing...');
    
    // Refresh token using the google-oauth function
    const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh access token');
    }

    const newTokens = await refreshResponse.json();
    return newTokens.access_token;
  }

  return tokenData.access_token;
}

async function runGoogleAdsQuery(accessToken: string, customerId: string, query: string): Promise<MetricData[]> {
  console.log('Running Google Ads query for customer:', customerId);
  
  const DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  
  const response = await fetch(
    `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': DEVELOPER_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Ads API error:', error);
    throw new Error(`Google Ads API error: ${error}`);
  }

  const data = await response.json();
  console.log('Google Ads query results:', data.results?.length || 0, 'rows');

  // Transform results to our format
  const metrics: MetricData[] = [];
  
  if (data.results) {
    for (const row of data.results) {
      const campaign = row.campaign;
      const segmentDate = row.segments?.date;
      const rowMetrics = row.metrics;

      if (campaign && segmentDate && rowMetrics) {
        metrics.push({
          date: segmentDate,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          impressions: parseInt(rowMetrics.impressions || '0'),
          clicks: parseInt(rowMetrics.clicks || '0'),
          cost_micros: parseInt(rowMetrics.costMicros || '0'),
          conversions: parseFloat(rowMetrics.conversions || '0'),
          conversions_value: parseFloat(rowMetrics.conversionsValue || '0'),
        });
      }
    }
  }

  return metrics;
}

async function sendToIngestEndpoint(metrics: MetricData[], customerId: string) {
  console.log('Sending metrics to ingest endpoint:', metrics.length, 'records');
  
  const INGEST_KEY = Deno.env.get('METRICUS_INGEST_KEY');
  
  // Transform metrics to the expected format for the ingest endpoint
  const transformedMetrics = metrics.map(metric => ({
    date: metric.date,
    platform: 'google_ads',
    client_id: customerId,
    campaign_id: metric.campaign_id,
    campaign_name: metric.campaign_name,
    impressions: metric.impressions,
    clicks: metric.clicks,
    spend: metric.cost_micros / 1000000, // Convert micros to currency
    conversions: Math.round(metric.conversions),
    revenue: metric.conversions_value,
    cpa: metric.conversions > 0 ? (metric.cost_micros / 1000000) / metric.conversions : 0,
    roas: metric.cost_micros > 0 ? metric.conversions_value / (metric.cost_micros / 1000000) : 0,
    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0,
    conv_rate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0,
  }));

  // Send to existing ingest endpoint
  const ingestResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ingest-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingest-key': INGEST_KEY!,
    },
    body: JSON.stringify({ metrics: transformedMetrics }),
  });

  if (!ingestResponse.ok) {
    const error = await ingestResponse.text();
    console.error('Ingest endpoint error:', error);
    throw new Error(`Failed to ingest metrics: ${error}`);
  }

  const result = await ingestResponse.json();
  console.log('Metrics ingested successfully:', result);
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      company_id, 
      customer_id, 
      start_date, 
      end_date,
      manual = false 
    } = await req.json();
    
    if (!user_id || !customer_id) {
      throw new Error('user_id and customer_id are required');
    }

    console.log('Starting Google Ads ingest for customer:', customer_id);

    // Create ingestion record
    const { data: ingestionRecord, error: ingestionError } = await supabase
      .from('google_ads_ingestions')
      .insert({
        user_id,
        customer_id,
        start_date: start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: end_date || new Date().toISOString().split('T')[0],
        status: 'running',
      })
      .select()
      .single();

    if (ingestionError) {
      throw new Error(`Failed to create ingestion record: ${ingestionError.message}`);
    }

    try {
      // Get valid access token
      const accessToken = await getValidAccessToken(user_id, company_id);
      
      // Define date range
      const dateRange = start_date && end_date 
        ? `BETWEEN '${start_date}' AND '${end_date}'`
        : 'DURING LAST_7_DAYS';

      // GAQL query for campaign metrics (últimos 7 dias por padrão)
      const query = `
        SELECT
          campaign.id, 
          campaign.name,
          metrics.impressions, 
          metrics.clicks,
          metrics.cost_micros, 
          metrics.conversions,
          metrics.conversions_value, 
          segments.date
        FROM campaign
        WHERE segments.date ${dateRange}
        AND campaign.status = 'ENABLED'
        ORDER BY segments.date DESC
      `;

      // Run query
      const metrics = await runGoogleAdsQuery(accessToken, customer_id, query);
      console.log('Retrieved metrics:', metrics.length, 'records');

      // Send to ingest endpoint
      if (metrics.length > 0) {
        await sendToIngestEndpoint(metrics, customer_id);
      }

      // Update ingestion record as completed
      await supabase
        .from('google_ads_ingestions')
        .update({
          status: 'completed',
          records_processed: metrics.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', ingestionRecord.id);

      console.log('Google Ads ingest completed successfully');

      return new Response(JSON.stringify({ 
        success: true, 
        ingestion_id: ingestionRecord.id,
        records_processed: metrics.length,
        customer_id: customer_id,
        date_range: dateRange
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update ingestion record as failed
      await supabase
        .from('google_ads_ingestions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', ingestionRecord.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in google-ads-ingest function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});