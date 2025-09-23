// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * google-ads-ping (robusto)
 * - ?selftest=1 → checa secrets e mostra quais foram carregados
 * - Sem selftest → SELECT no Supabase (usa SERVICE_ROLE; se faltar, cai pra ANON),
 *                  troca refresh→access e chama customers:listAccessibleCustomers
 */

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AUTH_KEY      = SERVICE_KEY || ANON_KEY; // fallback automático p/ SELECT se service faltar

const DEV_TOKEN     = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_BASE    = "https://googleads.googleapis.com/v21";

function log(...args: any[]) { console.log("[google-ads-ping]", ...args); }

async function getLatestRefreshToken() {
  if (!SUPABASE_URL || !AUTH_KEY) {
    throw new Error("supabase_env_missing");
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/google_ads_credentials`);
  url.searchParams.set("select", "id,refresh_token,created_at");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");

  const resp = await fetch(url.toString(), {
    headers: {
      apikey: AUTH_KEY,
      Authorization: `Bearer ${AUTH_KEY}`,
    },
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`db_select ${resp.status}: ${t}`);
  }

  const rows = await resp.json();
  if (!rows?.length || !rows[0]?.refresh_token) throw new Error("no_refresh_token_found");
  return rows[0].refresh_token as string;
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

  const text = await r.text();
  let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`refresh_error ${r.status}: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

async function listAccessibleCustomers(access_token: string) {
  if (!DEV_TOKEN) throw new Error("dev_token_missing");

  const r = await fetch(`${ADS_API_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "developer-token": DEV_TOKEN,
    },
  });

  const text = await r.text();
  let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`ads_error ${r.status}: ${JSON.stringify(json)}`);
  return json; // { resourceNames: [...] }
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
  log("REQ", { path: url.pathname, qp: Object.fromEntries(url.searchParams.entries()) });

  // Selftest
  if (url.searchParams.get("selftest") === "1") {
    const has = (v: string) => !!(v && v.trim().length > 0);
    const report = {
      ok: true,
      mode: "selftest",
      env: {
        SUPABASE_URL: has(SUPABASE_URL),
        SERVICE_KEY: has(SERVICE_KEY),
        ANON_KEY: has(ANON_KEY),
        AUTH_KEY: has(AUTH_KEY), // o que será usado nos headers
        GOOGLE_ADS_DEVELOPER_TOKEN: has(DEV_TOKEN),
        GOOGLE_OAUTH_CLIENT_ID: has(Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || ""),
        GOOGLE_OAUTH_CLIENT_SECRET: has(Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") || ""),
        GOOGLE_OAUTH_REDIRECT_URI: has(Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI") || ""),
      },
    };
    log("SELFTEST", report);
    return new Response(JSON.stringify(report), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  // Fluxo real
  try {
    const refresh = await getLatestRefreshToken();
    log("got refresh_token", refresh.slice(0, 10) + "...");

    const access = await exchangeRefreshToken(refresh);
    log("got access_token", access ? "[present]" : "(empty)");

    const result = await listAccessibleCustomers(access);
    const resourceNames: string[] = result?.resourceNames ?? [];

    return new Response(
      JSON.stringify({ ok: true, customers_count: resourceNames.length, customers: resourceNames }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    log("ping_error", String(e));
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
