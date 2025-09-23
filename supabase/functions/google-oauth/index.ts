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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// util: log seguro
function log(...args: any[]) {
  console.log("[google-oauth]", ...args);
}

// Save tokens to database
async function saveTokensToDatabase(tokens: any, userId: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    log("Missing Supabase config, cannot save tokens");
    return { success: false, error: "Missing Supabase config" };
  }

  if (!userId) {
    log("Missing userId, cannot save tokens");
    return { success: false, error: "Missing userId" };
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Calculate expiry time
  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + (tokens.expires_in || 3600));

  const tokenData = {
    user_id: userId,
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
    return { success: false, error: error.message };
  } else {
    log("Tokens saved successfully for user:", userId);
    return { success: true };
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
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Erro na Conexão</title></head>
        <body>
          <h2>Erro na autenticação</h2>
          <p>Não foi possível conectar ao Google Ads. Você pode fechar esta janela.</p>
          <script>
            window.opener?.postMessage({ 
              source: 'metricus:google_oauth', 
              ok: false, 
              error: 'Token exchange failed' 
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
    return new Response(errorHtml, { 
      status: 400, 
      headers: { "Content-Type": "text/html", ...corsHeaders } 
    });
  }

  log("token ok", { has_access_token: !!json.access_token, has_refresh: !!json.refresh_token });

  // Extract user info and next URL from state
  let userId: string | undefined;
  let nextUrl: string | undefined;
  if (state) {
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      nextUrl = stateData.n;
    } catch (e) {
      log("Could not parse state:", e);
    }
  }

  if (!userId) {
    log("Missing userId in state, cannot save tokens");
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Erro na Conexão</title></head>
        <body>
          <h2>Erro: Usuário não identificado</h2>
          <p>Não foi possível identificar o usuário. Faça login e tente novamente.</p>
          <script>
            window.opener?.postMessage({ 
              source: 'metricus:google_oauth', 
              ok: false, 
              error: 'Missing user ID' 
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
    return new Response(errorHtml, { 
      status: 400, 
      headers: { "Content-Type": "text/html", ...corsHeaders } 
    });
  }

  // Save tokens to database
  const saveResult = await saveTokensToDatabase(json, userId);
  
  if (!saveResult.success) {
    log("Failed to save tokens:", saveResult.error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Erro ao Salvar</title></head>
        <body>
          <h2>Erro ao salvar credenciais</h2>
          <p>Não foi possível salvar as credenciais. Tente novamente.</p>
          <script>
            window.opener?.postMessage({ 
              source: 'metricus:google_oauth', 
              ok: false, 
              error: 'Failed to save tokens' 
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
    return new Response(errorHtml, { 
      status: 500, 
      headers: { "Content-Type": "text/html", ...corsHeaders } 
    });
  }

  // Success! Return HTML that notifies the parent and closes the popup
  const successHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Conectado com Sucesso</title></head>
      <body>
        <h2>✅ Conectado com sucesso!</h2>
        <p>Sua conta Google Ads foi conectada. Esta janela será fechada automaticamente.</p>
        <script>
          // Notify the parent window
          window.opener?.postMessage({ 
            source: 'metricus:google_oauth', 
            ok: true 
          }, '*');
          
          // Redirect parent if needed
          ${nextUrl ? `window.opener?.location.assign('${nextUrl}');` : ''}
          
          // Close this popup
          setTimeout(() => window.close(), 500);
        </script>
      </body>
    </html>
  `;

  return new Response(successHtml, { 
    status: 200, 
    headers: { "Content-Type": "text/html", ...corsHeaders } 
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Erro na Autenticação</title></head>
          <body>
            <h2>Erro na autenticação</h2>
            <p>Erro do Google: ${error}</p>
            <script>
              window.opener?.postMessage({ 
                source: 'metricus:google_oauth', 
                ok: false, 
                error: '${error}' 
              }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `;
      return new Response(errorHtml, { 
        status: 400, 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
    }
    if (!code) {
      log("callback missing code");
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Erro na Autenticação</title></head>
          <body>
            <h2>Código de autorização ausente</h2>
            <p>Não foi possível obter o código de autorização do Google.</p>
            <script>
              window.opener?.postMessage({ 
                source: 'metricus:google_oauth', 
                ok: false, 
                error: 'missing code' 
              }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `;
      return new Response(errorHtml, { 
        status: 400, 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
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
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
