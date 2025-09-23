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
  console.log("[google-ads-diag]", ...args); 
}

// Get valid access token
async function getValidAccessToken(userId: string): Promise<string> {
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

  return tokens[0].access_token;
}

// Resolve MCC for target customer
async function resolveMccForChild(accessToken: string, targetCustomerId: string): Promise<{ mcc: string, tested: string[] }> {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Always use the correct MCC for the approved developer token: 2478435835
  const FORCED_MCC = Deno.env.get("FORCED_MCC_LOGIN_ID");
  const mccToUse = FORCED_MCC || '2478435835';
  
  log(`Using MCC: ${mccToUse} for customer ${targetCustomerId}`);
  
  return { 
    mcc: mccToUse.replace(/-/g, ''), 
    tested: [mccToUse] 
  };
}

// Diagnostic endpoints
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // Extract user_id from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing authorization header');
    }
    
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) {
      throw new Error('Invalid authorization token');
    }
    
    // Route to appropriate diagnostic endpoint
    if (pathParts.includes('force-mcc') && req.method === 'GET') {
      // GET /force-mcc?customerId=xxx&mcc=yyy → Force set MCC for user
      const customerId = url.searchParams.get('customerId');
      const mcc = url.searchParams.get('mcc');
      
      if (!customerId || !mcc) {
        throw new Error('Missing customerId or mcc parameter');
      }
      
      // Sanitize MCC (remove hyphens)
      const sanitizedMcc = mcc.replace(/-/g, '');
      
      // Validate hierarchy - check if MCC manages the account
      const accessToken = await getValidAccessToken(user.id);
      
      const query = `
        SELECT customer_client.id
        FROM customer_client
        WHERE customer_client.id = ${customerId}
        LIMIT 1
      `;
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': sanitizedMcc,
        'Content-Type': 'application/json',
      };
      
      log(`[ads-call] { endpoint: "customerClient", targetCustomerId: "${customerId}", loginCustomerId: "${sanitizedMcc}", hasBearer: true, hasDevToken: ${!!GOOGLE_ADS_DEVELOPER_TOKEN} }`);
      
      const response = await fetch(`https://googleads.googleapis.com/v21/customers/${sanitizedMcc}/googleAds:searchStream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCC validation failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error('MCC informado não gerencia a conta alvo');
      }
      
      // Save MCC to database
      const { error: updateError } = await supabase
        .from('google_tokens')
        .update({ login_customer_id: sanitizedMcc })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Failed to save MCC: ${updateError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          login_customer_id: sanitizedMcc,
          message: `MCC ${sanitizedMcc} salvo com sucesso`
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (pathParts.includes('mcc-for') && req.method === 'GET') {
      // GET /mcc-for/:customerId → resolve MCC for customer
      const customerId = pathParts[pathParts.length - 1];
      if (!customerId) {
        throw new Error('Missing customerId parameter');
      }
      
      const accessToken = await getValidAccessToken(user.id);
      const result = await resolveMccForChild(accessToken, customerId);
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          customerId,
          resolvedMcc: `***${result.mcc.slice(-4)}`,
          testedMccs: result.tested,
          fullMcc: result.mcc // Only for internal use
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (pathParts.includes('ping-search') && req.method === 'POST') {
      // POST /ping-search → test simple GAQL query
      const body = await req.json();
      const { customerId } = body;
      
      if (!customerId) {
        throw new Error('Missing customerId in request body');
      }
      
      const accessToken = await getValidAccessToken(user.id);
      
      // Always use the correct MCC 2478435835
      const forcedMcc = Deno.env.get("FORCED_MCC_LOGIN_ID") || '2478435835';
      const mcc = forcedMcc.replace(/-/g, '');
      
      log(`[ads-call] { endpoint: "ping-search", targetCustomerId: "${customerId}", loginCustomerId: "${mcc}", hasBearer: true, hasDevToken: ${!!GOOGLE_ADS_DEVELOPER_TOKEN} }`);
      
      // Simple ping query
      const query = 'SELECT customer.id FROM customer LIMIT 1';
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': mcc,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`https://googleads.googleapis.com/v21/customers/${customerId.replace(/-/g, '')}/googleAds:searchStream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        return new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'Google Ads API ping successful',
            customerId,
            usedMcc: `***${mcc.slice(-4)}`
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        const errorText = await response.text();
        throw new Error(`API ping failed: ${response.status} - ${errorText}`);
      }
    }
    
    if (pathParts.includes('hierarchy-check') && req.method === 'GET') {
      // GET /hierarchy-check?mcc=xxx&child=yyy → check if MCC manages child account
      const mcc = url.searchParams.get('mcc');
      const child = url.searchParams.get('child');
      
      if (!mcc || !child) {
        throw new Error('Missing mcc or child parameter');
      }
      
      const sanitizedMcc = mcc.replace(/-/g, '');
      const sanitizedChild = child.replace(/-/g, '');
      
      const accessToken = await getValidAccessToken(user.id);
      
      const query = `
        SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.level 
        FROM customer_client 
        WHERE customer_client.id = ${sanitizedChild} 
        LIMIT 1
      `;
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': sanitizedMcc,
        'Content-Type': 'application/json',
      };
      
      log(`[ads-call] { endpoint: "hierarchy-check", urlCustomerId: "${sanitizedMcc}", targetCustomerId: "${sanitizedChild}", loginCustomerId: "${sanitizedMcc}" }`);
      
      const response = await fetch(`https://googleads.googleapis.com/v21/customers/${sanitizedMcc}/googleAds:search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Hierarchy check failed: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            ok: true, 
            managed: false, 
            error: `API call failed: ${response.status}`,
            row: null 
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      const data = await response.json();
      const managed = !!(data.results && data.results.length > 0);
      const row = data.results?.[0] || null;
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          managed,
          row,
          mcc: sanitizedMcc,
          child: sanitizedChild
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (pathParts.includes('context') && req.method === 'GET') {
      // GET /context → return diagnostic context
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      
      const { data: tokenData } = await supabase
        .from('google_tokens')
        .select('login_customer_id, access_token')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      const { data: accountsData } = await supabase
        .from('accounts_map')
        .select('customer_id')
        .eq('is_manager', true);
      
      const context = {
        hasBearer: !!(tokenData?.[0]?.access_token),
        hasDevToken: !!GOOGLE_ADS_DEVELOPER_TOKEN,
        loginCustomerIdSaved: !!(tokenData?.[0]?.login_customer_id),
        mccCandidatesCount: (accountsData?.length || 0) + (tokenData?.[0]?.login_customer_id ? 1 : 0),
        userId: user.id
      };
      
      return new Response(
        JSON.stringify({ ok: true, context }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (pathParts.includes('set-mcc') && req.method === 'GET') {
      // GET /set-mcc?mcc=xxx → Force set MCC for user
      const mcc = url.searchParams.get('mcc');
      
      if (!mcc) {
        throw new Error('Missing mcc parameter');
      }
      
      // Sanitize MCC (remove hyphens)
      const sanitizedMcc = mcc.replace(/-/g, '');
      
      // Save MCC to database
      const { error: updateError } = await supabase
        .from('google_tokens')
        .update({ login_customer_id: sanitizedMcc })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Failed to save MCC: ${updateError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          login_customer_id: sanitizedMcc,
          message: `MCC ${sanitizedMcc} salvo com sucesso`
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Default route info
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Google Ads Diagnostics API',
        availableEndpoints: [
          'GET /force-mcc?customerId=xxx&mcc=yyy - Force set MCC for user',
          'GET /set-mcc?mcc=xxx - Set MCC for user',
          'GET /mcc-for/:customerId - Resolve MCC for customer',
          'GET /hierarchy-check?mcc=xxx&child=yyy - Check if MCC manages child account',
          'POST /ping-search - Test GAQL query',
          'GET /context - Get diagnostic context'
        ]
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (e) {
    log("diagnostic_error", String(e));
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});