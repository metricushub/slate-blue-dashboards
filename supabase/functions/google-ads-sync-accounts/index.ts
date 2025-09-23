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
  url.searchParams.set("select", "id,refresh_token,access_token,token_expiry,user_id,login_customer_id");
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
    user_id: rows[0].user_id as string,
    login_customer_id: rows[0].login_customer_id as (string | null)
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

async function getAccountDetails(access_token: string, customerIds: string[], loginCustomerId?: string | null) {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");
  
  const accountDetails: any[] = [];
  const baseHeaders: Record<string,string> = {
    'Authorization': `Bearer ${access_token}`,
    'developer-token': DEV_TOKEN,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) baseHeaders['login-customer-id'] = loginCustomerId.replace(/-/g, '');
  
  for (const customerId of customerIds) {
    try {
      const query = `
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.manager,
          customer.status
        FROM customer 
        WHERE customer.id = ${customerId}
      `;
      
      const response = await fetch(`${ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        const payload = await response.json();
        const streams = Array.isArray(payload) ? payload : [payload];
        let customerData: any | undefined;
        for (const stream of streams) {
          const row = (stream.results || [])[0];
          if (row?.customer) { customerData = row.customer; break; }
        }
        
        if (customerData) {
          accountDetails.push({
            customer_id: customerId,
            account_name: customerData.descriptive_name || `Account ${customerId}`,
            currency_code: customerData.currency_code,
            time_zone: customerData.time_zone,
            is_manager: Boolean(customerData.manager),
            status: customerData.status || 'ENABLED'
          });
        } else {
          accountDetails.push({
            customer_id: customerId,
            account_name: `Account ${customerId}`,
            currency_code: null,
            time_zone: null,
            is_manager: false,
            status: 'ENABLED'
          });
        }
      } else {
        // Fallback se não conseguir buscar detalhes
        accountDetails.push({
          customer_id: customerId,
          account_name: `Account ${customerId}`,
          currency_code: null,
          time_zone: null,
          is_manager: false,
          status: 'ENABLED'
        });
      }
    } catch (error) {
      log(`Error getting details for ${customerId}:`, error);
      // Fallback
      accountDetails.push({
        customer_id: customerId,
        account_name: `Account ${customerId}`,
        currency_code: null,
        time_zone: null,
        is_manager: false,
        status: 'ENABLED'
      });
    }
  }
  
  return accountDetails;
}

async function upsertCustomers(customerIds: string[], userId: string, access_token: string, loginCustomerId?: string | null) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("service_role_required_for_upsert");

  // Get detailed account information
  log(`Getting details for ${customerIds.length} accounts...`);
  const accountDetails = await getAccountDetails(access_token, customerIds, loginCustomerId);
  
  // Save to accounts_map table with real account details
  const accountsData = accountDetails.map((account) => ({ 
    customer_id: account.customer_id,
    client_id: account.customer_id, // Using customer_id as client_id for now
    account_name: account.account_name,
    currency_code: account.currency_code,
    time_zone: account.time_zone,
    is_manager: account.is_manager,
    account_type: account.is_manager ? 'MANAGER' : 'REGULAR',
    status: account.status
  }));

  const upsertUrl = `${SUPABASE_URL}/rest/v1/accounts_map?on_conflict=customer_id`;
  const r = await fetch(upsertUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=representation",
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

    await upsertCustomers(ids, tokenData.user_id, access, tokenData.login_customer_id);

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
