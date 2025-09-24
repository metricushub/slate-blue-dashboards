import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface DiagContext {
  success: boolean;
  loginCustomerId?: string;
  devTokenConfigured: boolean;
  accessibleAccounts: string[];
  error?: string;
}

function maskCustomerId(customerId: string): string {
  if (!customerId || customerId.length < 6) return '***';
  return customerId.slice(0, 3) + '***' + customerId.slice(-3);
}

function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

async function refreshAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: token } = await supabase
    .from('google_tokens')
    .select('refresh_token, token_expiry, access_token')
    .eq('user_id', userId)
    .single();

  if (!token) return null;

  // Check if token needs refresh (5 min buffer)
  const now = new Date();
  const expiry = new Date(token.token_expiry);
  const buffer = 5 * 60 * 1000;

  if (now.getTime() < (expiry.getTime() - buffer)) {
    return token.access_token;
  }

  // Refresh token
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!refreshResponse.ok) {
    console.log('Token refresh failed');
    return null;
  }

  const refreshData = await refreshResponse.json();
  const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000));

  await supabase
    .from('google_tokens')
    .update({
      access_token: refreshData.access_token,
      token_expiry: newExpiry.toISOString()
    })
    .eq('user_id', userId);

  return refreshData.access_token;
}

async function listAccessibleAccounts(accessToken: string): Promise<string[]> {
  try {
    const response = await fetch(
      'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.resourceNames?.map((name: string) => 
      sanitizeCustomerId(name.split('/')[1])
    ) || [];
  } catch (error) {
    console.log('Error listing accounts:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API key for internal functions
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== Deno.env.get('METRICUS_INGEST_KEY')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Context diag for user: ${userId.slice(0, 8)}***`);

    // Get user's Google token and login customer ID
    const { data: tokenData } = await supabase
      .from('google_tokens')
      .select('login_customer_id, access_token')
      .eq('user_id', userId)
      .single();

    if (!tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Google Ads token found' 
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshAccessToken(supabase, userId);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to refresh access token' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Get accessible accounts
    const accessibleAccounts = await listAccessibleAccounts(accessToken);

    const result: DiagContext = {
      success: true,
      loginCustomerId: tokenData.login_customer_id ? 
        maskCustomerId(tokenData.login_customer_id) : undefined,
      devTokenConfigured: !!Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
      accessibleAccounts: accessibleAccounts.map(maskCustomerId)
    };

    console.log(`Context result: ${accessibleAccounts.length} accounts accessible`);

    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Context diag error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});