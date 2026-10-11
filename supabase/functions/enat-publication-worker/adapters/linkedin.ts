import { requestJson, safeFailure, type AdapterConfig, type PublishInput, type PublishResult } from "./types.ts";
export async function publishLinkedIn(input: PublishInput, config: AdapterConfig & { authorUrn: string }): Promise<PublishResult> {
  if (!input.body.trim()) return { success: false, retryable: false, safeError: "Texto vazio." };
  const version = config.apiVersion || Deno.env.get("LINKEDIN_API_VERSION");
  if (!version || !config.authorUrn || !config.accessToken) return { success: false, retryable: false, safeError: "LinkedIn não configurado." };
  try {
    const { response, data } = await requestJson("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json", "LinkedIn-Version": version, "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({ author: config.authorUrn, commentary: input.body, visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false })
    });
    const id = response.headers.get("x-restli-id") || (typeof data.id === "string" ? data.id : "");
    if (!response.ok || !id) return safeFailure(response.status, "LinkedIn API não confirmou a publicação.");
    return { success: true, remotePostId: id };
  } catch { return { success: false, retryable: false, safeError: "Falha ou timeout no LinkedIn; reconciliar antes de repetir." }; }
}
