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

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("unauthorized");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("unauthorized");

    // Query the view for user's accounts
    const { data, error } = await supabase
      .from('v_ads_accounts_ui')
      .select('customer_id, name, is_manager, is_linked, client_id')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    // Separate into linked and available
    const linked = (data || []).filter(acc => acc.is_linked);
    const available = (data || []).filter(acc => !acc.is_linked);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        linked,
        available,
        total: data?.length ?? 0 
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