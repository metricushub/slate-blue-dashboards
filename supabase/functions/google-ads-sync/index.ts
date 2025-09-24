import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface GoogleAdsAccount {
  resourceName: string;
  id: string;
  name: string;
  type: string;
  manager: boolean;
  currencyCode: string;
  timeZone: string;
}

async function getValidAccessToken(userId: string, companyId?: string) {
  console.log('Getting valid access token for user:', userId);
  
  const { data: tokenData, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId || null)
    .single();

  if (error || !tokenData) {
    throw new Error('No Google Ads tokens found for user');
  }

  // Check if token is expired
  const now = new Date();
  const expiry = new Date(tokenData.token_expiry);
  
  if (now >= expiry) {
    console.log('Token expired, refreshing...');
    
    // Refresh token
    const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh access token');
    }

    const newTokens = await refreshResponse.json();
    const newExpiry = new Date();
    newExpiry.setSeconds(newExpiry.getSeconds() + (newTokens.expires_in || 3600));

    // Update token in database
    await supabase
      .from('google_tokens')
      .update({
        access_token: newTokens.access_token,
        token_expiry: newExpiry.toISOString(),
      })
      .eq('id', tokenData.id);

    return newTokens.access_token;
  }

  return tokenData.access_token;
}

async function listGoogleAdsAccounts(accessToken: string): Promise<GoogleAdsAccount[]> {
  console.log('Listing Google Ads accounts');
  
  const DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  
  // First, get accessible customers
  const customersResponse = await fetch('https://googleads.googleapis.com/v16/customers:listAccessibleCustomers', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': DEVELOPER_TOKEN!,
    },
  });

  if (!customersResponse.ok) {
    const error = await customersResponse.text();
    console.error('Failed to list customers:', error);
    throw new Error(`Failed to list customers: ${error}`);
  }

  const customersData = await customersResponse.json();
  console.log('Accessible customers:', customersData);

  const accounts: GoogleAdsAccount[] = [];

  // Get details for each customer
  for (const customerResource of customersData.resourceNames || []) {
    const customerId = customerResource.split('/')[1];
    
    try {
      const accountResponse = await fetch(
        `https://googleads.googleapis.com/v16/customers/${customerId}/googleAdsFields:search`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': DEVELOPER_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code, customer.time_zone FROM customer`,
          }),
        }
      );

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        
        if (accountData.results && accountData.results.length > 0) {
          const customer = accountData.results[0].customer;
          accounts.push({
            resourceName: customerResource,
            id: customer.id,
            name: customer.descriptiveName || `Account ${customer.id}`,
            type: customer.manager ? 'MANAGER' : 'REGULAR',
            manager: customer.manager,
            currencyCode: customer.currencyCode,
            timeZone: customer.timeZone,
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to get details for customer ${customerId}:`, error);
    }
  }

  return accounts;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, company_id } = await req.json();
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log('Syncing Google Ads accounts for user:', user_id);

    // Get valid access token
    const accessToken = await getValidAccessToken(user_id, company_id);
    
    // List Google Ads accounts
    const accounts = await listGoogleAdsAccounts(accessToken);
    console.log('Found accounts:', accounts.length);

    // Save accounts to database
    const accountsToInsert = accounts.map(account => ({
      company_id: company_id,
      customer_id: account.id,
      client_id: account.id, // For Google Ads, customer_id and client_id are the same
      account_name: account.name,
      account_type: account.type,
      status: 'active',
      is_manager: account.manager,
      currency_code: account.currencyCode,
      time_zone: account.timeZone,
    }));

    if (accountsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('accounts_map')
        .upsert(accountsToInsert, {
          onConflict: 'company_id,customer_id',
        });

      if (insertError) {
        console.error('Error saving accounts:', insertError);
        throw new Error(`Failed to save accounts: ${insertError.message}`);
      }
    }

    console.log('Accounts synced successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      accounts_synced: accounts.length,
      accounts: accounts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-ads-sync function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});