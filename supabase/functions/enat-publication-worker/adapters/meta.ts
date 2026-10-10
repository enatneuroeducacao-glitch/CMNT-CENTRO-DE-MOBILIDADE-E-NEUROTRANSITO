import { requestJson, safeFailure, type AdapterConfig, type PublishInput, type PublishResult } from "./types.ts";

export async function publishFacebook(input: PublishInput, config: AdapterConfig & { pageId: string }): Promise<PublishResult> {
  if (!input.body.trim()) return { success: false, retryable: false, safeError: "Texto vazio." };
  const version = config.apiVersion || Deno.env.get("META_GRAPH_API_VERSION");
  if (!version || !/^v\\d+\\.\\d+$/.test(version) || !config.pageId || !config.accessToken) return { success: false, retryable: false, safeError: "Meta não configurada ou versão de API inválida." };
  try {
    const body = new URLSearchParams({ message: input.body, access_token: config.accessToken });
    if (input.source_url) body.set("link", input.source_url);
    const { response, data } = await requestJson(`https://graph.facebook.com/${version}/${encodeURIComponent(config.pageId)}/feed`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!response.ok || typeof data.id !== "string") return safeFailure(response.status, "Meta API recusou publicação.");
    return { success: true, remotePostId: data.id };
  } catch { return { success: false, retryable: false, safeError: "Falha de rede ao chamar Meta; verificar reconciliação antes de repetir." }; }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForInstagramContainer(containerId: string, config: AdapterConfig, version: string): Promise<PublishResult | null> {
  // Meta documents status_code values such as IN_PROGRESS, FINISHED and ERROR.
  // Bound the wait so a stuck container never occupies a worker indefinitely.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const query = new URLSearchParams({ fields: "status_code,status", access_token: config.accessToken });
    const { response, data } = await requestJson(
      `https://graph.facebook.com/${version}/${encodeURIComponent(containerId)}?${query.toString()}`,
      { method: "GET" },
      10_000,
    );
    if (!response.ok) return safeFailure(response.status, "Meta não permitiu consultar o estado do container Instagram.");
    const status = typeof data.status_code === "string" ? data.status_code : "";
    if (status === "FINISHED") return null;
    if (status === "ERROR" || status === "EXPIRED") {
      return { success: false, retryable: false, safeError: `Container Instagram terminou com estado ${status}; não repetir automaticamente.` };
    }
    if (status !== "IN_PROGRESS" && status !== "PUBLISHED") {
      return { success: false, retryable: false, safeError: "Meta retornou estado desconhecido para o container Instagram." };
    }
    await sleep(2_000);
  }
  return { success: false, retryable: false, safeError: "Timeout aguardando processamento do container Instagram; verificar estado antes de repetir." };
}

export async function publishInstagram(input: PublishInput, config: AdapterConfig & { instagramUserId: string }): Promise<PublishResult> {
  const version = config.apiVersion || Deno.env.get("META_GRAPH_API_VERSION");
  if (!version || !/^v\\d+\\.\\d+$/.test(version) || !config.instagramUserId || !config.accessToken) return { success: false, retryable: false, safeError: "Instagram não configurado ou versão de API inválida." };
  if (!input.mediaUrl || !/^https:\\/\\//i.test(input.mediaUrl)) return { success: false, retryable: false, safeError: "Instagram exige URL HTTPS pública de mídia nesta versão do adaptador." };
  try {
    const create = await requestJson(`https://graph.facebook.com/${version}/${encodeURIComponent(config.instagramUserId)}/media`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ image_url: input.mediaUrl, caption: input.body, access_token: config.accessToken }) });
    if (!create.response.ok || typeof create.data.id !== "string") return safeFailure(create.response.status, "Meta não criou o container de mídia.");
    const readiness = await waitForInstagramContainer(create.data.id, config, version);
    if (readiness) return readiness;
    const publish = await requestJson(`https://graph.facebook.com/${version}/${encodeURIComponent(config.instagramUserId)}/media_publish`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ creation_id: create.data.id, access_token: config.accessToken }) });
    if (!publish.response.ok || typeof publish.data.id !== "string") return safeFailure(publish.response.status, "Meta não confirmou publicação do container.");
    return { success: true, remotePostId: publish.data.id };
  } catch { return { success: false, retryable: false, safeError: "Falha ou timeout na publicação Instagram; reconciliar container antes de repetir." }; }
}
