import { requestJson, safeFailure, type AdapterConfig, type PublishInput, type PublishResult } from "./types.ts";
export async function publishX(input: PublishInput, config: AdapterConfig): Promise<PublishResult> {
  if (!input.body.trim()) return { success: false, retryable: false, safeError: "Texto vazio." };
  if (!config.accessToken) return { success: false, retryable: false, safeError: "X não configurado." };
  try {
    const { response, data } = await requestJson("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.body })
    });
    const id = (data.data && typeof data.data === "object" && typeof (data.data as Record<string, unknown>).id === "string") ? (data.data as Record<string, unknown>).id as string : "";
    if (!response.ok || !id) return safeFailure(response.status, "X API não confirmou a publicação.");
    return { success: true, remotePostId: id };
  } catch { return { success: false, retryable: false, safeError: "Falha ou timeout no X; reconciliar antes de repetir." }; }
}
