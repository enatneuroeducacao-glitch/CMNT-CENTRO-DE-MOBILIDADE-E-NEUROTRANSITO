import { publishFacebook, publishInstagram } from "./adapters/meta.ts";
import { publishLinkedIn } from "./adapters/linkedin.ts";
import { publishX } from "./adapters/x.ts";
import type { Channel, PublishInput, PublishResult } from "./adapters/types.ts";

const cors = {
  "Access-Control-Allow-Origin": "https://enat-painel-editorial-preview.onrender.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Job = {
  id: string;
  editorial_item_id: string;
  channel: Channel;
  payload_snapshot: Record<string, unknown>;
  claim_token: string;
  attempt_count: number;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function env(key: string) { return Deno.env.get(key)?.trim() ?? ""; }

async function serviceRequest(path: string, init: RequestInit = {}) {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) throw new Error("Worker server configuration is incomplete.");
  return await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function configuredChannels(): Channel[] {
  const channels: Channel[] = [];
  if (env("META_ACCESS_TOKEN") && env("META_PAGE_ID") && env("META_GRAPH_API_VERSION")) channels.push("facebook");
  if (env("META_ACCESS_TOKEN") && env("META_INSTAGRAM_USER_ID") && env("META_GRAPH_API_VERSION")) channels.push("instagram");
  if (env("LINKEDIN_ACCESS_TOKEN") && env("LINKEDIN_AUTHOR_URN") && env("LINKEDIN_API_VERSION")) channels.push("linkedin");
  // X requires a user-context access token with write permission, not an app-only bearer token.
  if (env("X_USER_ACCESS_TOKEN")) channels.push("x");
  return channels;
}

async function finalize(job: Job, result: PublishResult): Promise<boolean> {
  const status = result.success ? "published" : "failed";
  const response = await serviceRequest("rpc/enat_finish_publication_job", {
    method: "POST",
    body: JSON.stringify({
      p_job_id: job.id,
      p_claim_token: job.claim_token,
      p_status: status,
      p_remote_post_id: result.success ? result.remotePostId : null,
      p_error: result.success ? null : result.safeError,
    }),
  });
  if (!response.ok) return false;
  return await response.json() === true;
}

async function publish(job: Job, editorial: Record<string, unknown>): Promise<PublishResult> {
  const snapshot = job.payload_snapshot ?? {};
  const body = typeof editorial.body === "string" ? editorial.body : typeof snapshot.body === "string" ? snapshot.body : "";
  const title = typeof editorial.title === "string" ? editorial.title : typeof snapshot.title === "string" ? snapshot.title : "";
  const source = typeof editorial.source_url === "string" ? editorial.source_url : typeof snapshot.source_url === "string" ? snapshot.source_url : null;
  const mediaUrl = typeof snapshot.media_url === "string" ? snapshot.media_url : undefined;
  const input: PublishInput = { title, body, source_url: source, mediaUrl };

  switch (job.channel) {
    case "facebook":
      return await publishFacebook(input, { accessToken: env("META_ACCESS_TOKEN"), apiVersion: env("META_GRAPH_API_VERSION"), pageId: env("META_PAGE_ID") });
    case "instagram":
      return await publishInstagram(input, { accessToken: env("META_ACCESS_TOKEN"), apiVersion: env("META_GRAPH_API_VERSION"), instagramUserId: env("META_INSTAGRAM_USER_ID") });
    case "linkedin":
      return await publishLinkedIn(input, { accessToken: env("LINKEDIN_ACCESS_TOKEN"), apiVersion: env("LINKEDIN_API_VERSION"), authorUrn: env("LINKEDIN_AUTHOR_URN") });
    case "x":
      return await publishX(input, { accessToken: env("X_USER_ACCESS_TOKEN") });
    default:
      return { success: false, retryable: false, safeError: "Canal de publicação não suportado." };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const expected = env("ENAT_WORKER_CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) return json(401, { error: "unauthorized" });

  if (env("ENAT_SOCIAL_PUBLISHING_ENABLED") !== "true") {
    return json(200, { status: "safe_mode", claimed: 0, message: "Publicação externa desativada pela feature flag." });
  }

  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  if (required.some((key) => !env(key))) return json(200, { status: "safe_mode", claimed: 0, message: "Configuração básica do worker incompleta." });
  const channels = configuredChannels();
  if (channels.length === 0) return json(200, { status: "safe_mode", claimed: 0, message: "Nenhum canal possui credenciais completas." });

  try {
    // Stale publishing jobs are terminalized for manual reconciliation, never requeued automatically.
    const recoveryResponse = await serviceRequest("rpc/enat_recover_stale_publication_jobs", {
      method: "POST",
      body: JSON.stringify({ p_stale_minutes: 15 }),
    });
    if (!recoveryResponse.ok) return json(502, { status: "recovery_failed", claimed: 0 });

    const claimResponse = await serviceRequest("rpc/enat_claim_publication_jobs", {
      method: "POST",
      body: JSON.stringify({ p_limit: 10, p_channels: channels }),
    });
    if (!claimResponse.ok) return json(502, { status: "claim_failed", claimed: 0 });
    const jobs = await claimResponse.json() as Job[];
    let published = 0;
    let failed = 0;
    let needsReconciliation = 0;

    for (const job of jobs) {
      try {
        // Re-check approval immediately before any outbound request.
        const editorialResponse = await serviceRequest(
          `enat_editorial_items?id=eq.${encodeURIComponent(job.editorial_item_id)}&select=id,title,body,source_url,status`,
          { method: "GET" },
        );
        if (!editorialResponse.ok) {
          failed++;
          await finalize(job, { success: false, retryable: false, safeError: "Não foi possível revalidar o conteúdo editorial." });
          continue;
        }
        const rows = await editorialResponse.json() as Array<Record<string, unknown>>;
        const editorial = rows[0];
        if (!editorial || editorial.status !== "approved") {
          failed++;
          await finalize(job, { success: false, retryable: false, safeError: "Conteúdo deixou de estar aprovado antes da publicação." });
          continue;
        }

        const result = await publish(job, editorial);
        const finalized = await finalize(job, result);
        if (!finalized) {
          failed++;
          needsReconciliation++;
          continue;
        }
        if (result.success) published++;
        else failed++;
      } catch {
        // Never retry automatically after an ambiguous network/API outcome.
        failed++;
        needsReconciliation++;
        // Finalization itself can fail during a database/network outage. Do not let that
        // abort the whole batch; stale-claim recovery will move this job to manual review.
        try {
          await finalize(job, { success: false, retryable: false, safeError: "Resultado ambíguo; reconciliar na rede social antes de qualquer nova tentativa." });
        } catch {
          // Keep the claim intact. The recovery RPC will terminalize it after the stale threshold.
        }
      }
    }
    return json(200, { status: "completed", claimed: jobs.length, published, failed, needsReconciliation });
  } catch {
    return json(500, { status: "worker_error", message: "Falha interna; nenhum segredo ou resposta bruta foi registrado." });
  }
});
