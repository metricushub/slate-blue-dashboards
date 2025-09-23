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
  
  if (loginCustomerId) {
    const sanitizedMccId = loginCustomerId.replace(/-/g, '');
    baseHeaders['login-customer-id'] = sanitizedMccId;
    log(`Using login-customer-id: ${sanitizedMccId}`);
  } else {
    log('WARNING: No login-customer-id provided - account names may be generic');
  }
  
  // Log headers for debugging (without exposing access token)
  const logHeaders = { ...baseHeaders };
  logHeaders.Authorization = 'Bearer [REDACTED]';
  log(`Account details request headers:`, logHeaders);
  
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
          const realName = customerData.descriptive_name;
          log(`Account ${customerId}: ${realName || 'no name'} (manager: ${Boolean(customerData.manager)})`);
          
          accountDetails.push({
            customer_id: String(customerId),
            account_name: String(realName || `Account ${customerId}`),
            currency_code: customerData.currency_code || null,
            time_zone: customerData.time_zone || null,
            is_manager: Boolean(customerData.manager),
            status: String(customerData.status || 'ENABLED')
          });
        } else {
          log(`Account ${customerId}: No customer data in response`);
          accountDetails.push({
            customer_id: String(customerId),
            account_name: `Account ${customerId}`,
            currency_code: null,
            time_zone: null,
            is_manager: false,
            status: 'ENABLED'
          });
        }
      } else {
        const errorText = await response.text();
        log(`Account ${customerId} query failed (${response.status}): ${errorText}`);
        
        // Check for specific permission errors
        if (response.status === 403 && errorText.includes('USER_PERMISSION_DENIED')) {
          log(`HINT: Account ${customerId} requires login-customer-id header (MCC parent account)`);
        }
        
        // Fallback se não conseguir buscar detalhes
        accountDetails.push({
          customer_id: String(customerId),
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
        customer_id: String(customerId),
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
  
  // Detect MCC accounts and determine the login_customer_id
  const mccAccounts = accountDetails.filter(account => account.is_manager);
  let detectedLoginCustomerId = loginCustomerId;
  
  if (mccAccounts.length > 0 && !loginCustomerId) {
    // Use the first MCC account as login customer ID
    detectedLoginCustomerId = mccAccounts[0].customer_id;
    log(`Detected MCC account: ${detectedLoginCustomerId}`);
    
    // Re-fetch account details with the detected MCC as login-customer-id
    log('Re-fetching account details with detected MCC as login-customer-id...');
    const enhancedAccountDetails = await getAccountDetails(access_token, customerIds, detectedLoginCustomerId);
    
    // Update accountDetails with enhanced data
    for (let i = 0; i < accountDetails.length; i++) {
      if (enhancedAccountDetails[i] && enhancedAccountDetails[i].account_name !== `Account ${enhancedAccountDetails[i].customer_id}`) {
        accountDetails[i] = enhancedAccountDetails[i];
      }
    }
  }
  
  // Save to accounts_map table with real account details
  const accountsData = accountDetails.map((account) => ({ 
    customer_id: String(account.customer_id || ''),
    client_id: String(account.customer_id || ''),
    account_name: String(account.account_name || `Account ${account.customer_id}`),
    currency_code: account.currency_code || null,
    time_zone: account.time_zone || null,
    is_manager: Boolean(account.is_manager),
    account_type: Boolean(account.is_manager) ? 'MANAGER' : 'REGULAR',
    status: String(account.status || 'ENABLED')
  }));

  log(`Upserting ${accountsData.length} accounts to database...`);
  log(`MCC accounts found: ${mccAccounts.length}`);
  log(`Using login_customer_id: ${detectedLoginCustomerId || 'none'}`);

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

  // Update the google_tokens table with detected login_customer_id and first customer_id
  if (customerIds.length > 0) {
    const updateUrl = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
    updateUrl.searchParams.set("user_id", `eq.${userId}`);
    
    const updateData: any = { customer_id: customerIds[0] };
    if (detectedLoginCustomerId && detectedLoginCustomerId !== loginCustomerId) {
      updateData.login_customer_id = detectedLoginCustomerId;
      log(`Saving detected login_customer_id: ${detectedLoginCustomerId}`);
    }
    
    await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify(updateData),
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
    log("Step 1: Getting refresh token from database...");
    const tokenData = await getLatestRefreshToken();
    log(`Found token for user: ${tokenData.user_id}`);
    
    log("Step 2: Exchanging refresh token for access token...");
    const access = await exchangeRefreshToken(tokenData.refresh_token);
    log("Access token obtained successfully");
    
    log("Step 3: Listing accessible customers...");
    const ids = await listAccessibleCustomers(access);
    log(`Found ${ids.length} accessible customer accounts: ${ids.join(', ')}`);
    
    log("Step 4: Upserting customers with detailed account information...");
    await upsertCustomers(ids, tokenData.user_id, access, tokenData.login_customer_id);
    log("Account synchronization completed successfully");

    return new Response(
      JSON.stringify({ 
        ok: true, 
        total: ids.length, 
        customer_ids: ids,
        message: `Successfully synchronized ${ids.length} Google Ads accounts`
      }),
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
