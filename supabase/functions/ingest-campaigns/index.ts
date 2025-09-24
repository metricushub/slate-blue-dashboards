import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface CampaignPayload {
  id?: string;
  external_id?: string;
  client_id: string;
  platform: 'google_ads' | 'meta_ads';
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  objective?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('METRICUS_INGEST_KEY');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.log('Tentativa de acesso não autorizada');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload: CampaignPayload | CampaignPayload[] = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle both single campaigns and batch
    const campaigns = Array.isArray(payload) ? payload : [payload];
    
    console.log(`Processando ${campaigns.length} campanhas`);

    // Validate and prepare campaigns
    const validatedCampaigns = [];
    const errors = [];

    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      try {
        // Validate required fields
        if (!campaign.client_id) {
          throw new Error('Campo "client_id" é obrigatório');
        }
        
        if (!campaign.platform) {
          throw new Error('Campo "platform" é obrigatório');
        }
        
        if (!campaign.name) {
          throw new Error('Campo "name" é obrigatório');
        }
        
        if (!campaign.status) {
          throw new Error('Campo "status" é obrigatório');
        }

        // Validate platform
        if (!['google_ads', 'meta_ads'].includes(campaign.platform)) {
          throw new Error('Platform deve ser "google_ads" ou "meta_ads"');
        }

        // Validate status
        if (!['ENABLED', 'PAUSED', 'REMOVED'].includes(campaign.status)) {
          throw new Error('Status deve ser "ENABLED", "PAUSED" ou "REMOVED"');
        }

        const validatedCampaign = {
          id: campaign.id || `${campaign.platform}_${campaign.client_id}_${Date.now()}_${i}`,
          external_id: campaign.external_id,
          client_id: campaign.client_id,
          platform: campaign.platform,
          name: campaign.name.trim(),
          status: campaign.status,
          objective: campaign.objective?.trim() || null,
          last_sync: new Date().toISOString()
        };

        validatedCampaigns.push(validatedCampaign);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : String(error),
          campaign
        });
      }
    }

    console.log(`${validatedCampaigns.length} campanhas válidas, ${errors.length} erros`);

    // Insert valid campaigns using upsert
    let insertedCount = 0;
    if (validatedCampaigns.length > 0) {
      const { error: insertError, count } = await supabase
        .from('campaigns')
        .upsert(validatedCampaigns, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id');

      if (insertError) {
        console.error('Erro ao inserir campanhas:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Database error',
          details: insertError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      insertedCount = count || validatedCampaigns.length;
    }

    const response = {
      success: true,
      inserted: insertedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${insertedCount} campanhas processadas com sucesso`
    };

    console.log('Resposta:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro geral na função:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});