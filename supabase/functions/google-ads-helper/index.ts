// Helper functions for Google Ads API calls with MCC resolution
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface GoogleAdsApiOptions {
  accessToken: string;
  customerId: string;
  loginCustomerId?: string;
}

// Helper function to sanitize customer ID (remove hyphens/dots, keep only numbers)
export function sanitizeCustomerId(customerId: string): string {
  return customerId.replace(/[^0-9]/g, '');
}

// Helper function to resolve MCC for a customer
export async function resolveMcc(userId: string, targetCustomerId: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/resolve-mcc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        targetCustomerId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('MCC resolution failed:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.resolvedLoginCustomerId : null;
    
  } catch (error) {
    console.error('Error calling MCC resolver:', error);
    return null;
  }
}

// Enhanced Google Ads API call with MCC resolution
export async function makeGoogleAdsRequest(
  endpoint: string,
  options: GoogleAdsApiOptions,
  requestBody?: any
): Promise<Response> {
  const sanitizedCustomerId = sanitizeCustomerId(options.customerId);
  const sanitizedLoginCustomerId = options.loginCustomerId 
    ? sanitizeCustomerId(options.loginCustomerId) 
    : null;
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${options.accessToken}`,
    'Content-Type': 'application/json'
  };
  
  // Add login-customer-id header if MCC is resolved
  if (sanitizedLoginCustomerId) {
    headers['login-customer-id'] = sanitizedLoginCustomerId;
  }
  
  console.log(`Making Google Ads API call to: ${endpoint}`);
  console.log(`Customer ID: ${sanitizedCustomerId}`);
  console.log(`Login Customer ID: ${sanitizedLoginCustomerId || 'not set'}`);
  
  return fetch(endpoint, {
    method: requestBody ? 'POST' : 'GET',
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined
  });
}

// Get Google Ads access token for user
export async function getGoogleAdsToken(userId: string): Promise<{access_token: string, refresh_token: string} | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
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
