// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Duplicate of google-ads-ingest with ad-blocker-safe name
// Fetches metrics from Google Ads API and sends to ingest-metrics endpoint

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AUTH_KEY = SERVICE_KEY || ANON_KEY;

const DEV_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_BASE = "https://googleads.googleapis.com/v21";
const METRICUS_INGEST_KEY = Deno.env.get("METRICUS_INGEST_KEY") || "";

function log(...args: any[]) {
  console.log("[ga-ingest]", ...args);
}

interface MetricData {
  date: string;
  customer_id: string;
  campaign_id?: string;
  campaign_name?: string;
  platform: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue?: number;
}

async function getValidAccessTokenAndMcc(userId: string, companyId?: string) {
  if (!SUPABASE_URL || !AUTH_KEY) throw new Error("supabase_env_missing");

  const url = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
  url.searchParams.set("select", "id,refresh_token,access_token,token_expiry,login_customer_id");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");
  url.searchParams.set("user_id", `eq.${userId}`);

  const resp = await fetch(url.toString(), {
    headers: { apikey: AUTH_KEY, Authorization: `Bearer ${AUTH_KEY}` },
  });

  if (!resp.ok) throw new Error(`db_select ${resp.status}: ${await resp.text()}`);
  const rows = await resp.json();
  if (!rows?.length || !rows[0]?.refresh_token) throw new Error("no_refresh_token_found");

  const token = rows[0];
  const expiry = token.token_expiry ? new Date(token.token_expiry).getTime() : 0;
  const now = Date.now();

  let accessToken = token.access_token;

  if (!accessToken || expiry <= now + 60000) {
    log("Refreshing expired token...");
    const client_id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || "";
    const client_secret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") || "";
    if (!client_id || !client_secret) throw new Error("oauth_client_missing");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id,
      client_secret,
    });

    const r = await fetch(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const t = await r.text();
    let j: any;
    try {
      j = JSON.parse(t);
    } catch {
      j = { raw: t };
    }
    if (!r.ok) throw new Error(`refresh_error ${r.status}: ${JSON.stringify(j)}`);
    accessToken = j.access_token as string;

    const newExpiry = new Date(now + (j.expires_in || 3600) * 1000).toISOString();
    const updateUrl = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
    updateUrl.searchParams.set("id", `eq.${token.id}`);

    await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ access_token: accessToken, token_expiry: newExpiry }),
    });

    log("Token refreshed successfully");
  }

  let loginCustomerId = token.login_customer_id || Deno.env.get("FORCED_MCC_LOGIN_ID") || null;

  if (loginCustomerId) {
    loginCustomerId = loginCustomerId.replace(/-/g, "");
  }

  return { accessToken, loginCustomerId };
}

async function validateHierarchy(accessToken: string, targetCustomerId: string, loginCustomerId: string) {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");

  const sanitizedTarget = targetCustomerId.replace(/-/g, "");
  const sanitizedMcc = loginCustomerId.replace(/-/g, "");

  log(`Validating hierarchy: MCC ${sanitizedMcc} manages target ${sanitizedTarget}...`);

  const query = `
    SELECT 
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.manager,
      customer_client.level
    FROM customer_client
    WHERE customer_client.level <= 1
  `;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": DEV_TOKEN,
    "login-customer-id": sanitizedMcc,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${ADS_API_BASE}/customers/${sanitizedMcc}/googleAds:search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MCC hierarchy validation failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const childIds = (result.results || [])
    .map((row: any) => row.customerClient?.clientCustomer?.replace("customers/", ""))
    .filter(Boolean);

  log(`MCC ${sanitizedMcc} manages ${childIds.length} child accounts`);

  if (!childIds.includes(sanitizedTarget)) {
    throw new Error(`MCC ${sanitizedMcc} does not manage target account ${sanitizedTarget}`);
  }

  log(`✓ Hierarchy validated: MCC manages target account`);
}

async function runGoogleAdsQuery(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId?: string
): Promise<MetricData[]> {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");

  const sanitizedCustomerId = customerId.replace(/-/g, "");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": DEV_TOKEN,
    "Content-Type": "application/json",
  };

  if (loginCustomerId) {
    const sanitizedMcc = loginCustomerId.replace(/-/g, "");
    headers["login-customer-id"] = sanitizedMcc;
    log(`Using login-customer-id: ${sanitizedMcc}`);
  } else {
    log("No login-customer-id header (fallback mode)");
  }

  const logHeaders = { ...headers };
  logHeaders.Authorization = "Bearer [REDACTED]";
  log(`Query headers:`, logHeaders);

  const response = await fetch(`${ADS_API_BASE}/customers/${sanitizedCustomerId}/googleAds:searchStream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const streams = Array.isArray(payload) ? payload : [payload];

  const metrics: MetricData[] = [];

  for (const stream of streams) {
    if (!stream.results) continue;

    for (const row of stream.results) {
      const seg = row.segments || {};
      const met = row.metrics || {};
      const camp = row.campaign || {};

      metrics.push({
        date: seg.date || "",
        customer_id: sanitizedCustomerId,
        campaign_id: camp.id || undefined,
        campaign_name: camp.name || undefined,
        platform: "google_ads",
        impressions: parseInt(met.impressions || "0", 10),
        clicks: parseInt(met.clicks || "0", 10),
        spend: parseFloat(met.cost_micros || "0") / 1_000_000,
        conversions: parseFloat(met.conversions || "0"),
        revenue: parseFloat(met.conversions_value || "0"),
      });
    }
  }

  return metrics;
}

async function sendToIngestEndpoint(metrics: MetricData[], customerId: string) {
  if (!SUPABASE_URL || !METRICUS_INGEST_KEY) {
    throw new Error("SUPABASE_URL or METRICUS_INGEST_KEY missing");
  }

  const payload = metrics.map((m) => ({
    date: m.date,
    client_id: customerId,
    customer_id: m.customer_id,
    campaign_id: m.campaign_id,
    platform: "google_ads",
    impressions: m.impressions,
    clicks: m.clicks,
    spend: m.spend,
    conversions: m.conversions,
    revenue: m.revenue || 0,
    leads: m.conversions,
  }));

  log(`Sending ${payload.length} metrics to ingest-metrics endpoint...`);

  const ingestUrl = `${SUPABASE_URL}/functions/v1/ingest-metrics`;
  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": METRICUS_INGEST_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ingest-metrics error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  log(`Metrics ingested successfully:`, result);
  return result;
}

async function sendCampaignsToIngest(campaigns: any[], customerId: string) {
  if (!SUPABASE_URL || !METRICUS_INGEST_KEY) {
    throw new Error("SUPABASE_URL or METRICUS_INGEST_KEY missing");
  }

  log(`Sending ${campaigns.length} campaigns to ingest-campaigns endpoint...`);

  const ingestUrl = `${SUPABASE_URL}/functions/v1/ingest-campaigns`;
  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": METRICUS_INGEST_KEY,
    },
    body: JSON.stringify(campaigns),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ingest-campaigns error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  log(`Campaigns ingested successfully:`, result);
  return result;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  } as const;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, company_id, customer_id, start_date, end_date } = body;

    if (!user_id || !customer_id || !start_date || !end_date) {
      throw new Error("Missing required parameters: user_id, customer_id, start_date, end_date");
    }

    log(`Starting ingestion for customer ${customer_id} from ${start_date} to ${end_date}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: ingestionRecord, error: insertError } = await supabase
      .from("google_ads_ingestions")
      .insert({
        user_id,
        company_id: company_id || null,
        customer_id: customer_id.replace(/-/g, ""),
        status: "in_progress",
        start_date,
        end_date,
      })
      .select()
      .single();

    if (insertError || !ingestionRecord) {
      throw new Error(`Failed to create ingestion record: ${insertError?.message}`);
    }

    const ingestionId = ingestionRecord.id;
    log(`Created ingestion record: ${ingestionId}`);

    try {
      const { accessToken, loginCustomerId } = await getValidAccessTokenAndMcc(user_id, company_id);

      const allowFallbackNoMcc = Deno.env.get("ALLOW_FALLBACK_NO_MCC") === "true";
      let useMcc = loginCustomerId;
      let hierarchyValid = false;

      if (useMcc) {
        try {
          await validateHierarchy(accessToken, customer_id, useMcc);
          hierarchyValid = true;
        } catch (hierarchyError) {
          log(`Hierarchy validation failed: ${hierarchyError}`);
          if (allowFallbackNoMcc) {
            log("Fallback enabled: will attempt without login-customer-id");
            useMcc = null;
          } else {
            throw hierarchyError;
          }
        }
      } else {
        log("No MCC configured, proceeding without login-customer-id");
      }

      const query = `
        SELECT 
          segments.date,
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${start_date}' AND '${end_date}'
        ORDER BY segments.date DESC
      `;

      log(`Fetching metrics from Google Ads API...`);
      const metrics = await runGoogleAdsQuery(accessToken, customer_id, query, useMcc || undefined);
      log(`Fetched ${metrics.length} metric rows from Google Ads API`);

      if (metrics.length === 0) {
        log("No metrics found for the specified period");
      }

      const ingestResult = await sendToIngestEndpoint(metrics, customer_id);
      log(`Metrics ingestion result:`, ingestResult);

      const uniqueCampaigns = new Map();
      for (const m of metrics) {
        if (m.campaign_id && !uniqueCampaigns.has(m.campaign_id)) {
          uniqueCampaigns.set(m.campaign_id, {
            id: `google_ads_${customer_id}_${m.campaign_id}`,
            external_id: m.campaign_id,
            client_id: customer_id,
            platform: "google_ads",
            name: m.campaign_name || `Campaign ${m.campaign_id}`,
            status: "ENABLED",
          });
        }
      }

      const campaignsArray = Array.from(uniqueCampaigns.values());
      if (campaignsArray.length > 0) {
        const campaignsResult = await sendCampaignsToIngest(campaignsArray, customer_id);
        log(`Campaigns ingestion result:`, campaignsResult);
      }

      await supabase
        .from("google_ads_ingestions")
        .update({
          status: "completed",
          records_ingested: metrics.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", ingestionId);

      log(`Ingestion completed successfully: ${metrics.length} records, ${campaignsArray.length} campaigns`);

      return new Response(
        JSON.stringify({
          ok: true,
          ingestion_id: ingestionId,
          metrics_count: metrics.length,
          campaigns_count: campaignsArray.length,
          hierarchy_validated: hierarchyValid,
          used_fallback: !useMcc && allowFallbackNoMcc,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error) {
      log(`Ingestion error:`, error);

      await supabase
        .from("google_ads_ingestions")
        .update({
          status: "failed",
          error_message: String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", ingestionId);

      throw error;
    }
  } catch (e) {
    log("ingest_error", String(e));
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
