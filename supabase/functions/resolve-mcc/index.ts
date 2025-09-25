import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResolveMccRequest {
  userId: string;
  targetCustomerId: string;
}

interface MccResolution {
  resolvedLoginCustomerId: string | null;
  cached: boolean;
}

// Helper function to sanitize customer ID (remove hyphens/dots, keep only numbers)
function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

// Helper function to get Google Ads access token for user
async function getAccessToken(supabase: any, userId: string): Promise<{access_token: string, refresh_token: string} | null> {
  const { data: token, error } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single();
    
  if (error || !token) {
    console.log('No Google token found for user:', userId);
    return null;
  }
  
  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiry = new Date(token.token_expiry);
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  if (now.getTime() > (expiry.getTime() - buffer)) {
    console.log('Token expired for user:', userId);
    // TODO: Implement token refresh logic if needed
    return null;
  }
  
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token
  };
}

// Helper function to get all MCCs for a user
async function getUserMccs(supabase: any, userId: string): Promise<string[]> {
  const { data: tokens, error } = await supabase
    .from('google_tokens')
    .select('customer_id')
    .eq('user_id', userId);
    
  if (error || !tokens) {
    console.log('No tokens found for user:', userId);
    return [];
  }
  
  // Filter out null customer_ids and sanitize
  return tokens
    .filter((token: any) => token.customer_id)
    .map((token: any) => sanitizeCustomerId(token.customer_id));
}

// Function to test MCC management via GAQL (v21 with developer-token)
async function testMccManagement(accessToken: string, mccId: string, targetCustomerId: string): Promise<boolean> {
  const sanitizedMcc = sanitizeCustomerId(mccId);
  const sanitizedTarget = sanitizeCustomerId(targetCustomerId);
  
  console.log(`Testing MCC ${sanitizedMcc} for target ${sanitizedTarget}`);
  
  const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!developerToken) {
    console.log('❌ Missing developer token');
    return false;
  }
  
  const gaqlQuery = `
    SELECT 
      customer_client.client_customer,
      customer_client.manager,
      customer_client.descriptive_name,
      customer_client.status
    FROM customer_client 
    WHERE customer_client.client_customer = ${sanitizedTarget}
  `;
  
  const requestBody = {
    query: gaqlQuery
  };
  
  try {
    const response = await fetch(`https://googleads.googleapis.com/v21/customers/${sanitizedMcc}/googleAds:search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
        'login-customer-id': sanitizedMcc
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`GAQL Response status for MCC ${sanitizedMcc}:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`GAQL Error for MCC ${sanitizedMcc}:`, errorText);
      return false;
    }
    
    const data = await response.json();
    console.log(`GAQL Results for MCC ${sanitizedMcc}:`, data);
    
    // Check if we got results indicating this MCC manages the target
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      if (result.customerClient && result.customerClient.clientCustomer === sanitizedTarget) {
        console.log(`✅ MCC ${sanitizedMcc} manages target ${sanitizedTarget}`);
        return true;
      }
    }
    
    console.log(`❌ MCC ${sanitizedMcc} does not manage target ${sanitizedTarget}`);
    return false;
    
  } catch (error) {
    console.log(`Error testing MCC ${sanitizedMcc}:`, error);
    return false;
  }
}

// Main function to resolve MCC for target customer
async function resolveMccFor(supabase: any, userId: string, targetCustomerId: string): Promise<MccResolution> {
  const sanitizedTarget = sanitizeCustomerId(targetCustomerId);
  
  console.log(`Resolving MCC for user ${userId}, target ${sanitizedTarget}`);
  
  // 1. Check cache first
  const cacheExpiry = new Date();
  cacheExpiry.setHours(cacheExpiry.getHours() - 24); // Cache valid for 24 hours
  
  const { data: cached, error: cacheError } = await supabase
    .from('account_bindings')
    .select('resolved_login_customer_id, last_verified_at')
    .eq('user_id', userId)
    .eq('customer_id', sanitizedTarget)
    .gte('last_verified_at', cacheExpiry.toISOString())
    .single();
    
  if (!cacheError && cached) {
    console.log(`✅ Found cached MCC for ${sanitizedTarget}: ${cached.resolved_login_customer_id}`);
    return {
      resolvedLoginCustomerId: cached.resolved_login_customer_id,
      cached: true
    };
  }
  
  console.log(`No valid cache found, testing MCCs for ${sanitizedTarget}`);
  
  // 2. Get access token
  const tokenInfo = await getAccessToken(supabase, userId);
  if (!tokenInfo) {
    console.log('❌ No valid access token found');
    return { resolvedLoginCustomerId: null, cached: false };
  }
  
  // 3. Get all user's MCCs
  const userMccs = await getUserMccs(supabase, userId);
  if (userMccs.length === 0) {
    console.log('❌ No MCCs found for user');
    return { resolvedLoginCustomerId: null, cached: false };
  }
  
  console.log(`Testing ${userMccs.length} MCCs for user:`, userMccs);
  
  // 4. Test each MCC
  for (const mccId of userMccs) {
    const manages = await testMccManagement(tokenInfo.access_token, mccId, sanitizedTarget);
    
    if (manages) {
      // Found managing MCC - cache the result
      console.log(`✅ Found managing MCC: ${mccId}`);
      
      const { error: upsertError } = await supabase
        .from('account_bindings')
        .upsert({
          user_id: userId,
          customer_id: sanitizedTarget,
          resolved_login_customer_id: mccId,
          last_verified_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,customer_id'
        });
        
      if (upsertError) {
        console.log('Warning: Failed to cache MCC resolution:', upsertError);
      }
      
      return {
        resolvedLoginCustomerId: mccId,
        cached: false
      };
    }
  }
  
  // 5. No managing MCC found
  console.log(`❌ No MCC manages target ${sanitizedTarget}`);
  
  // Cache the negative result to avoid repeated testing
  const { error: negativeUpsertError } = await supabase
    .from('account_bindings')
    .upsert({
      user_id: userId,
      customer_id: sanitizedTarget,
      resolved_login_customer_id: '', // Empty string indicates no managing MCC
      last_verified_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,customer_id'
    });
    
  if (negativeUpsertError) {
    console.log('Warning: Failed to cache negative MCC resolution:', negativeUpsertError);
  }
  
  return { resolvedLoginCustomerId: null, cached: false };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { userId, targetCustomerId }: ResolveMccRequest = await req.json();
    
    if (!userId || !targetCustomerId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: userId, targetCustomerId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Resolve MCC
    const resolution = await resolveMccFor(supabase, userId, targetCustomerId);
    
    if (resolution.resolvedLoginCustomerId === null) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhum MCC encontrado que gerencie esta conta. Verifique se você tem as permissões necessárias.',
        errorCode: 'NO_MANAGING_MCC'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      resolvedLoginCustomerId: resolution.resolvedLoginCustomerId,
      cached: resolution.cached
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in resolve-mcc function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
