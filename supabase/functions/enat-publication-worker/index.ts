// ENAT publication worker — intentionally fail-closed until official provider adapters are configured.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://enat-painel-editorial-preview.onrender.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: cors });

  const expected = Deno.env.get("ENAT_WORKER_CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
  }

  // Never claim jobs until a real, tested official API adapter is enabled for every channel
  // that can be processed. This prevents jobs being stranded in "publishing" without delivery.
  const enabled = Deno.env.get("ENAT_SOCIAL_PUBLISHING_ENABLED") === "true";
  const adaptersReady = ["META_ACCESS_TOKEN", "LINKEDIN_ACCESS_TOKEN", "X_API_KEY", "X_API_SECRET"]
    .every((key) => Boolean(Deno.env.get(key)));
  if (!enabled || !adaptersReady) {
    return new Response(JSON.stringify({
      status: "safe_mode",
      claimed: 0,
      message: "Publicação externa desativada: APIs oficiais e credenciais ainda não foram homologadas.",
    }), { status: 200, headers: cors });
  }

  // Deliberately fail closed: the API adapter implementation and platform-specific
  // permissions must be reviewed and tested before enabling any outbound request.
  return new Response(JSON.stringify({
    status: "blocked_pending_provider_adapters",
    claimed: 0,
    message: "Credenciais detectadas, mas os adaptadores oficiais ainda precisam ser implementados e homologados.",
  }), { status: 409, headers: cors });
});
