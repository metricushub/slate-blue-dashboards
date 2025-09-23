// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Função para salvar o customer_id escolhido no Supabase
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok:false, error:"use POST" }), {
      status:405,
      headers:{ "Content-Type":"application/json" }
    });
  }

  const { customer_id } = await req.json().catch(() => ({}));
  if (!customer_id) {
    return new Response(JSON.stringify({ ok:false, error:"missing customer_id" }), {
      status:400,
      headers:{ "Content-Type":"application/json" }
    });
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/google_ads_connections`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify([{ customer_id }]),
  });

  if (!r.ok) {
    return new Response(JSON.stringify({
      ok:false,
      stage:"db",
      status:r.status,
      error: await r.text()
    }), {
      status:400,
      headers:{ "Content-Type":"application/json" }
    });
  }

  const [row] = await r.json();
  return new Response(JSON.stringify({
    ok:true,
    id: row.id,
    customer_id
  }), { headers:{ "Content-Type":"application/json" }});
});
