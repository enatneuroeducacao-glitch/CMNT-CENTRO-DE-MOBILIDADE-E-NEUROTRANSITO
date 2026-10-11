export type Channel = "instagram" | "facebook" | "linkedin" | "x";
export type PublishInput = { title: string; body: string; source_url?: string | null; authorUrn?: string; pageId?: string; instagramUserId?: string; mediaUrl?: string };
export type PublishResult = { success: true; remotePostId: string } | { success: false; retryable: boolean; safeError: string };
export type AdapterConfig = { accessToken: string; apiVersion?: string };
export function safeFailure(status: number, message: string): PublishResult {
  const safe = message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").replace(/access_token[=:]\s*[^&\s]+/gi, "access_token=[REDACTED]").slice(0, 500);
  return { success: false, retryable: status === 429, safeError: safe || `Provider HTTP ${status}` };
}
export async function requestJson(url: string, init: RequestInit, timeoutMs = 20000): Promise<{ response: Response; data: Record<string, unknown> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try { data = text ? JSON.parse(text) as Record<string, unknown> : {}; } catch { data = { message: "Provider returned non-JSON response" }; }
    return { response, data };
  } finally { clearTimeout(timer); }
}
