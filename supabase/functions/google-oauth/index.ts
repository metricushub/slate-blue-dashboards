// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL   = "https://oauth2.googleapis.com/token";

const CLIENT_ID     = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
const REDIRECT_URI  = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// util: log seguro
function log(...args: any[]) {
  console.log("[google-oauth]", ...args);
}

// Save tokens to database
async function saveTokensToDatabase(tokens: any, userId?: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    log("Missing Supabase config, cannot save tokens");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Calculate expiry time
  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + (tokens.expires_in || 3600));

  const tokenData = {
    user_id: userId || crypto.randomUUID(), // Fallback to random UUID if no user provided
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: expiryTime.toISOString(),
    customer_id: null, // Will be updated when accounts are synced
    company_id: null
  };

  const { data, error } = await supabase
    .from('google_tokens')
    .upsert(tokenData, { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    log("Error saving tokens:", error);
  } else {
    log("Tokens saved successfully for user:", userId);
  }
}

// troca code -> tokens
async function exchangeCodeForTokens(code: string, state?: string) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!r.ok) {
    log("token error", r.status, json);
    return new Response(
      JSON.stringify({ ok: false, stage: "token", status: r.status, error: json }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  log("token ok", { has_access_token: !!json.access_token, has_refresh: !!json.refresh_token });

  // Extract user info from state if available
  let userId: string | undefined;
  if (state) {
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
    } catch (e) {
      log("Could not parse state for user_id:", e);
    }
  }

  // Save tokens to database
  await saveTokensToDatabase(json, userId);

  return new Response(
    JSON.stringify({ ok: true, tokens: {
      access_token: json.access_token ? "[saved]" : null,
      refresh_token: json.refresh_token ? "[saved]" : null,
      expires_in: json.expires_in ?? null,
      scope: json.scope ?? null,
      token_type: json.token_type ?? null,
    }}),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname; // e.g. /google-oauth, /google-oauth/start, /google-oauth/callback
  const qp = Object.fromEntries(url.searchParams.entries());
  log("REQ", { method: req.method, path, qp });

  // 1) Início do OAuth: redireciona para Google
  if (path.endsWith("/start")) {
    const next = url.searchParams.get("next") ?? "/";
    const userId = url.searchParams.get("user_id");
    const state = btoa(JSON.stringify({ n: next, user_id: userId }));

    const authUrl = new URL(GOOGLE_AUTH);
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("access_type", "offline"); // queremos refresh_token
    authUrl.searchParams.set("prompt", "consent");      // garante refresh_token 1ª vez
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/adwords");
    authUrl.searchParams.set("state", state);

    log("redirecting to Google", { redirect_uri: REDIRECT_URI, next });
    return Response.redirect(authUrl.toString(), 302);
  }

  // 2) Callback: aceite em /callback OU na raiz da função (/google-oauth)
  const isCallback =
    path.endsWith("/callback") ||
    path.endsWith("/google-oauth") || // cobre o caso sem /callback
    path === "/google-oauth";         // redundância segura

  if (isCallback) {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");

    if (error) {
      log("callback error from Google", error);
      return new Response(
        JSON.stringify({ ok: false, stage: "callback", error }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!code) {
      log("callback missing code");
      return new Response(
        JSON.stringify({ ok: false, stage: "callback", error: "missing code" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    log("callback received code", { hasState: !!state });
    return exchangeCodeForTokens(code, state);
  }

  // 3) Health/info
  return new Response(
    JSON.stringify({
      name: "google-oauth",
      ok: true,
      endpoints: {
        start: "/google-oauth/start?next=/",
        callback: "/google-oauth/callback",
        rootCallbackAlsoAccepted: true,
      },
      redirect_uri_in_use: REDIRECT_URI,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
