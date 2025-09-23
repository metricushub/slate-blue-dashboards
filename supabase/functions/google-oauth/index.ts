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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, state, user_id, company_id } = await req.json();
    
    console.log('Google OAuth action:', action);

    if (action === 'get_auth_url') {
      // Generate OAuth2 URL
      const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth`;
      
      const scopes = [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ');

      const stateParam = JSON.stringify({ user_id, company_id });
      
      const authUrl = `https://accounts.google.com/o/oauth2/auth?` + 
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(stateParam)}`;

      console.log('Generated auth URL');
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_token' || code) {
      // Exchange code for tokens
      const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
      const CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth`;

      console.log('Exchanging code for tokens');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID!,
          client_secret: CLIENT_SECRET!,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange failed:', error);
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokens = await tokenResponse.json();
      console.log('Token exchange successful');

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const userInfo = await userResponse.json();
      console.log('User info retrieved');

      // Parse state if it exists
      let stateData = { user_id: user_id, company_id: company_id };
      if (state) {
        try {
          stateData = JSON.parse(state);
        } catch (e) {
          console.warn('Could not parse state parameter:', e);
        }
      }

      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + (tokens.expires_in || 3600));

      // Save tokens to Supabase
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .upsert({
          user_id: stateData.user_id,
          company_id: stateData.company_id,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          token_expiry: expiryTime.toISOString(),
        }, {
          onConflict: 'user_id,company_id',
        });

      if (tokenError) {
        console.error('Error saving tokens:', tokenError);
        throw new Error(`Failed to save tokens: ${tokenError.message}`);
      }

      console.log('Tokens saved successfully');

      // Return success response
      return new Response(JSON.stringify({ 
        success: true, 
        user_email: userInfo.email,
        user_name: userInfo.name,
        message: 'Google Ads authentication successful' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh_token') {
      // Refresh access token
      const { refresh_token } = await req.json();
      
      const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
      const CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');

      console.log('Refreshing access token');

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID!,
          client_secret: CLIENT_SECRET!,
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const error = await refreshResponse.text();
        console.error('Token refresh failed:', error);
        throw new Error(`Token refresh failed: ${error}`);
      }

      const newTokens = await refreshResponse.json();
      console.log('Token refresh successful');

      // Calculate new expiry time
      const expiryTime = new Date();
      expiryTime.setSeconds(expiryTime.getSeconds() + (newTokens.expires_in || 3600));

      // Update tokens in database
      const { error: updateError } = await supabase
        .from('google_tokens')
        .update({
          access_token: newTokens.access_token,
          token_expiry: expiryTime.toISOString(),
        })
        .eq('refresh_token', refresh_token);

      if (updateError) {
        console.error('Error updating tokens:', updateError);
        throw new Error(`Failed to update tokens: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ 
        access_token: newTokens.access_token,
        expires_in: newTokens.expires_in 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in google-oauth function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});