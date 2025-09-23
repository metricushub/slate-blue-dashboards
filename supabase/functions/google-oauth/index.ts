// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL   = "https://oauth2.googleapis.com/token";

const CLIENT_ID     = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
const REDIRECT_URI  = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI")!;

// util: log seguro
function log(...args: any[]) {
  // Em Supabase, console.log vai para os logs da função; não logue tokens!
  console.log("[google-oauth]", ...args);
}

// troca code -> tokens
async function exchangeCodeForTokens(code: string) {
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

  // NÃO logue tokens completos em produção
  log("token ok", { has_access_token: !!json.access_token, has_refresh: !!json.refresh_token });
  return new Response(
    JSON.stringify({ ok: true, tokens: {
      access_token: json.access_token ? "[present]" : null,
      refresh_token: json.refresh_token ? "[present]" : null,
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
    const state = btoa(JSON.stringify({ n: next })); // simples; pode assinar com STATE_SECRET

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
    return exchangeCodeForTokens(code);
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
