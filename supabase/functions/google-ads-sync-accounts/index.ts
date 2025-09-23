// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Lê refresh_token mais recente → renova access_token → chama listAccessibleCustomers
// → salva TODOS os customer_ids (sem prefixo) em google_ads_connections (upsert)

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AUTH_KEY      = SERVICE_KEY || ANON_KEY;

const DEV_TOKEN     = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_BASE    = "https://googleads.googleapis.com/v21";

function log(...args: any[]) { console.log("[google-ads-sync-accounts]", ...args); }

async function getLatestRefreshToken() {
  if (!SUPABASE_URL || !AUTH_KEY) throw new Error("supabase_env_missing");
  const url = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
  url.searchParams.set("select", "id,refresh_token,access_token,token_expiry,user_id");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");

  const resp = await fetch(url.toString(), {
    headers: { apikey: AUTH_KEY, Authorization: `Bearer ${AUTH_KEY}` },
  });
  if (!resp.ok) throw new Error(`db_select ${resp.status}: ${await resp.text()}`);

  const rows = await resp.json();
  if (!rows?.length || !rows[0]?.refresh_token) throw new Error("no_refresh_token_found");
  return { 
    refresh_token: rows[0].refresh_token as string,
    user_id: rows[0].user_id as string 
  };
}

async function exchangeRefreshToken(refresh_token: string) {
  const client_id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || "";
  const client_secret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") || "";
  if (!client_id || !client_secret) throw new Error("oauth_client_missing");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
    client_id,
    client_secret,
  });

  const r = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const t = await r.text();
  let j: any; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!r.ok) throw new Error(`refresh_error ${r.status}: ${JSON.stringify(j)}`);
  return j.access_token as string;
}

async function listAccessibleCustomers(access_token: string) {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");
  const r = await fetch(`${ADS_API_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "developer-token": DEV_TOKEN,
    },
  });
  const t = await r.text();
  let j: any; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!r.ok) throw new Error(`ads_error ${r.status}: ${JSON.stringify(j)}`);
  return (j?.resourceNames as string[] ?? []).map((s) => s.replace("customers/", ""));
}

async function upsertCustomers(customerIds: string[], userId: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("service_role_required_for_upsert");

  // Save to accounts_map table instead of google_ads_connections
  const accountsData = customerIds.map((id) => ({ 
    customer_id: id,
    client_id: id, // Using customer_id as client_id for now
    account_name: `Account ${id}`,
    account_type: 'REGULAR',
    status: 'active'
  }));

  const r = await fetch(`${SUPABASE_URL}/rest/v1/accounts_map`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(accountsData),
  });

  if (!r.ok && r.status !== 409) {
    const err = await r.text();
    throw new Error(`db_upsert ${r.status}: ${err}`);
  }

  // Also update the google_tokens table with the first customer_id
  if (customerIds.length > 0) {
    const updateUrl = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
    updateUrl.searchParams.set("user_id", `eq.${userId}`);
    
    await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ customer_id: customerIds[0] }),
    });
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  log("REQ", { path: url.pathname });

  try {
    const tokenData = await getLatestRefreshToken();
    const access = await exchangeRefreshToken(tokenData.refresh_token);
    const ids = await listAccessibleCustomers(access);

    await upsertCustomers(ids, tokenData.user_id);

    return new Response(
      JSON.stringify({ ok: true, total: ids.length, customer_ids: ids }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    log("sync_error", String(e));
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
