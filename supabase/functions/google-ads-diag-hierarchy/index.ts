import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface HierarchyResult {
  success: boolean;
  managed: boolean;
  mccId?: string;
  childId?: string;
  error?: string;
}

function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

function maskCustomerId(customerId: string): string {
  if (!customerId || customerId.length < 6) return '***';
  return customerId.slice(0, 3) + '***' + customerId.slice(-3);
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

async function testMccHierarchy(
  accessToken: string, 
  mccId: string, 
  childId: string
): Promise<boolean> {
  const sanitizedMcc = sanitizeCustomerId(mccId);
  const sanitizedChild = sanitizeCustomerId(childId);

  try {
    const gaqlQuery = `
      SELECT 
        customer_client.id,
        customer_client.manager
      FROM customer_client 
      WHERE customer_client.id = ${sanitizedChild}
    `;

    const response = await fetch(
      `https://googleads.googleapis.com/v17/customers/${sanitizedMcc}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
          'login-customer-id': sanitizedMcc,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: gaqlQuery })
      }
    );

    if (!response.ok) {
      console.log(`GAQL query failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    
    // Check if we found the child account
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return result.customerClient?.id === sanitizedChild;
    }

    return false;
  } catch (error) {
    console.log('Hierarchy test error:', error instanceof Error ? error.message : String(error));
    return false;
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
    const mcc = url.searchParams.get('mcc');
    const child = url.searchParams.get('child');

    if (!userId || !mcc || !child) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: userId, mcc, child' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Hierarchy test: MCC ${maskCustomerId(mcc)} -> Child ${maskCustomerId(child)}`);

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

    // Test hierarchy
    const managed = await testMccHierarchy(accessToken, mcc, child);

    const result: HierarchyResult = {
      success: true,
      managed,
      mccId: maskCustomerId(mcc),
      childId: maskCustomerId(child)
    };

    console.log(`Hierarchy result: managed=${managed}`);

    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Hierarchy diag error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});