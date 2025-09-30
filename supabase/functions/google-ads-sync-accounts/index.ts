// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lê refresh_token do usuário atual → renova access_token → chama listAccessibleCustomers
// → salva TODOS os customer_ids (sem prefixo) com detalhes em accounts_map (upsert)

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AUTH_KEY      = SERVICE_KEY || ANON_KEY;

const DEV_TOKEN     = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_BASE    = "https://googleads.googleapis.com/v21";

function log(...args: any[]) { console.log("[google-ads-sync-accounts]", ...args); }

async function getLatestRefreshToken(user_id: string) {
  if (!SUPABASE_URL || !AUTH_KEY) throw new Error("supabase_env_missing");
  const url = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
  url.searchParams.set("select", "id,refresh_token,access_token,token_expiry,user_id,login_customer_id");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");
  url.searchParams.set("user_id", `eq.${user_id}`);

  const resp = await fetch(url.toString(), {
    headers: { apikey: AUTH_KEY, Authorization: `Bearer ${AUTH_KEY}` },
  });
  if (!resp.ok) throw new Error(`db_select ${resp.status}: ${await resp.text()}`);

  const rows = await resp.json();
  if (!rows?.length || !rows[0]?.refresh_token) throw new Error("no_refresh_token_found_for_user");
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

async function getMccChildAccounts(access_token: string, mccId: string) {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");
  
  const sanitizedMccId = mccId.replace(/-/g, '');
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'developer-token': DEV_TOKEN,
    'login-customer-id': sanitizedMccId,
    'Content-Type': 'application/json'
  };

  const query = `
    SELECT 
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.manager,
      customer_client.status,
      customer_client.level
    FROM customer_client 
    WHERE customer_client.level <= 1
  `;

  try {
    log(`Searching MCC ${sanitizedMccId} for child accounts...`);
    const response = await fetch(`${ADS_API_BASE}/customers/${sanitizedMccId}/googleAds:search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`MCC child search failed (${response.status}): ${errorText}`);
      return [];
    }

    const result = await response.json();
    const childAccounts: any[] = [];

    if (result.results) {
      for (const row of result.results) {
        const client = row.customerClient;
        if (client && client.clientCustomer && !client.manager) {
          const clientCustomerId = client.clientCustomer.replace('customers/', '');
          childAccounts.push({
            customer_id: clientCustomerId,
            account_name: client.descriptiveName || `Account ${clientCustomerId}`,
            currency_code: null,
            time_zone: null,
            is_manager: false,
            status: client.status || 'ENABLED'
          });
          log(`Found child account: ${clientCustomerId} - ${client.descriptiveName || 'no name'}`);
        }
      }
    }

    return childAccounts;
  } catch (error) {
    log(`Error searching MCC child accounts: ${error}`);
    return [];
  }
}

async function upsertCustomers(customerIds: string[], userId: string, access_token: string, loginCustomerId?: string | null) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("service_role_required_for_upsert");

  // Get detailed account information
  log(`Getting details for ${customerIds.length} accounts...`);
  let accountDetails = await getAccountDetails(access_token, customerIds, loginCustomerId);
  
  // Check if we have non-manager accounts with real names (not generic)
  const hasRealName = (n: any) => !!n && !String(n).startsWith('Account ');
  const nonManagerRealNamed = accountDetails.filter(account => !account.is_manager && hasRealName(account.account_name));
  log(`Non-manager accounts with real names: ${nonManagerRealNamed.length}`);
  
  // MCC expansion fallback if no real non-manager accounts found
  if (nonManagerRealNamed.length === 0) {
    const forcedMccId = Deno.env.get("FORCED_MCC_LOGIN_ID");
    if (forcedMccId) {
      log(`MCC expansion fallback: searching child accounts of MCC ${forcedMccId}`);
      const childAccounts = await getMccChildAccounts(access_token, forcedMccId);
      if (childAccounts.length > 0) {
        log(`MCC expansion fallback used: ${childAccounts.length} child accounts`);
        accountDetails = [...accountDetails, ...childAccounts];
      }
    }
  }
  
  // De-duplicate by customer_id, prefer entries with real names
  const byId = new Map<string, any>();
  for (const acc of accountDetails) {
    const id = String(acc.customer_id || '');
    const existing = byId.get(id);
    const accHasReal = hasRealName(acc.account_name);
    const existingHasReal = existing ? hasRealName(existing.account_name) : false;
    if (!existing || (accHasReal && !existingHasReal)) {
      byId.set(id, acc);
    }
  }
  accountDetails = Array.from(byId.values());
  
  // Always use the provided MCC (2478435835)
  let detectedLoginCustomerId = loginCustomerId;
  
  log(`Using login_customer_id: ${detectedLoginCustomerId || 'none'}`);
  
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

  // Prepare data for google_ads_accounts table (UI source)
  const googleAdsAccountsData = accountDetails.map((account) => ({
    user_id: userId,
    customer_id: String(account.customer_id || ''),
    descriptive_name: String(account.account_name || `Account ${account.customer_id}`),
    is_manager: Boolean(account.is_manager),
    status: String(account.status || 'ENABLED'),
    currency_code: account.currency_code || null,
    time_zone: account.time_zone || null
  }));

  log(`Upserting ${accountsData.length} accounts to database...`);
  const mccAccounts = accountDetails.filter(account => account.is_manager);
  log(`MCC accounts found: ${mccAccounts.length}`);

  // Upsert to accounts_map
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
    throw new Error(`db_upsert_accounts_map ${r.status}: ${err}`);
  }

  // Upsert to google_ads_accounts (UI source)
  const upsertGoogleAdsUrl = `${SUPABASE_URL}/rest/v1/google_ads_accounts?on_conflict=user_id,customer_id`;
  const r2 = await fetch(upsertGoogleAdsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(googleAdsAccountsData),
  });

  if (!r2.ok && r2.status !== 409) {
    const err = await r2.text();
    throw new Error(`db_upsert_ui ${r2.status}: ${err}`);
  }

  // Always save the correct MCC in database (2478435835)
  if (customerIds.length > 0) {
    const updateUrl = new URL(`${SUPABASE_URL}/rest/v1/google_tokens`);
    updateUrl.searchParams.set("user_id", `eq.${userId}`);
    
    const updateData = { 
      customer_id: customerIds[0],
      login_customer_id: detectedLoginCustomerId
    };
    
    log(`Saving login_customer_id: ${detectedLoginCustomerId}`);
    
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
    // Identify current user via Supabase Auth header
    const supabaseAuth = createClient(
      SUPABASE_URL,
      ANON_KEY,
      { global: { headers: { Authorization: req.headers.get('authorization') || '' } } }
    );
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) throw new Error('unauthorized');

    log("Step 1: Getting refresh token from database for current user...");
    const tokenData = await getLatestRefreshToken(user.id);
    log(`Found token for user: ${tokenData.user_id}`);
    
    log("Step 2: Exchanging refresh token for access token...");
    const access = await exchangeRefreshToken(tokenData.refresh_token);
    log("Access token obtained successfully");
    
    log("Step 3: Listing accessible customers...");
    const ids = await listAccessibleCustomers(access);
    log(`Found ${ids.length} accessible customer accounts: ${ids.join(', ')}`);
    
    // Prefer saved login_customer_id for better names; do not force a global MCC
    const preferredMcc = tokenData.login_customer_id || Deno.env.get("FORCED_MCC_LOGIN_ID") || undefined;
    
    log("Step 4: Upserting customers with detailed account information...");
    log(`Using login-customer-id: ${preferredMcc || 'none'}`);
    await upsertCustomers(ids, tokenData.user_id, access, preferredMcc || null);
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
