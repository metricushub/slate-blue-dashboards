// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function log(...args: any[]) { console.log("[google-ads-accounts]", ...args); }

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("supabase_env_missing");

    // Create client with anon key for user auth
    const supabaseClient = createClient(
      SUPABASE_URL, 
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("authorization") || ""
          }
        }
      }
    );

    // Service role client for server-side reads (filtered by user in logic)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("unauthorized");

    // Query linked connections for this user (no join)
    const { data: linkedRows, error: linkedError } = await supabaseClient
      .from('google_ads_connections')
      .select('customer_id, client_id')
      .eq('user_id', user.id);

    if (linkedError) throw linkedError;

    // Fetch names for linked customer_ids using service role
    const linkedIds = (linkedRows || []).map((r) => r.customer_id);
    let namesMap = new Map<string, { account_name: string | null; is_manager: boolean | null }>();
    if (linkedIds.length > 0) {
      const { data: nameRows, error: nameError } = await admin
        .from('accounts_map')
        .select('customer_id, account_name, is_manager')
        .in('customer_id', linkedIds);
      if (nameError) throw nameError;
      (nameRows || []).forEach((r) => namesMap.set(r.customer_id, { account_name: r.account_name, is_manager: r.is_manager }));
    }

    const linked = (linkedRows || []).map((item) => ({
      customer_id: item.customer_id,
      client_id: item.client_id,
      name: namesMap.get(item.customer_id)?.account_name || `Account ${item.customer_id}`,
      is_linked: true,
    }));

    // Query available accounts (from accounts_map, filtered by user's tokens)
    const { data: tokenData } = await supabaseClient
      .from('google_tokens')
      .select('login_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tokenData?.login_customer_id) {
      return new Response(
        JSON.stringify({ 
          ok: true, 
          linked,
          available: [],
          total: linked.length 
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Query all accounts using service role (filtered later)
    const { data: allAccounts, error: accountsError } = await admin
      .from('accounts_map')
      .select('customer_id, account_name, is_manager')
      .eq('status', 'ENABLED')
      .eq('is_manager', false);

    if (accountsError) throw accountsError;

    // Filter out already linked accounts
    const linkedIdsSet = new Set(linked.map(acc => acc.customer_id));
    const available = (allAccounts || [])
      .filter(acc => !linkedIdsSet.has(acc.customer_id))
      .map(acc => ({
        customer_id: acc.customer_id,
        name: acc.account_name || `Account ${acc.customer_id}`,
        is_manager: acc.is_manager,
        is_linked: false
      }));

    return new Response(
      JSON.stringify({ 
        ok: true, 
        linked,
        available,
        total: linked.length + available.length 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    log("list_error", String(e));
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});