import { publishFacebook, publishInstagram } from "./meta.ts";
import { publishLinkedIn } from "./linkedin.ts";
import { publishX } from "./x.ts";
import type { PublishInput } from "./types.ts";

const input: PublishInput = {
  title: "Teste de homologação",
  body: "Publicação de teste — não enviar para redes reais.",
  source_url: "https://example.com/teste",
  authorUrn: "urn:li:organization:123",
  pageId: "123",
  instagramUserId: "456",
  mediaUrl: "https://example.com/teste.jpg",
};

Deno.test("adaptadores oficiais usam respostas simuladas e nunca dependem de rede real", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let nextResponses: Array<{ status: number; body: unknown; headers?: Record<string, string> }> = [];

  globalThis.fetch = (async (inputUrl: string | URL | Request, init?: RequestInit) => {
    const url = String(inputUrl);
    calls.push({ url, init });
    const next = nextResponses.shift() ?? { status: 500, body: { error: "unexpected mocked request" } };
    return new Response(JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json", ...(next.headers ?? {}) },
    });
  }) as typeof fetch;

  try {
    nextResponses = [{ status: 200, body: { id: "page_post_1" } }];
    const fb = await publishFacebook(input, { accessToken: "test-token", apiVersion: "v99.0", pageId: "123" });
    if (!fb.success || fb.remotePostId !== "page_post_1") throw new Error("Facebook success response not parsed");
    if (!calls.at(-1)?.url.includes("/v99.0/123/feed")) throw new Error("Facebook endpoint mismatch");

    nextResponses = [{ status: 200, body: { id: "container_1" } }, { status: 200, body: { status_code: "FINISHED", status: "Finished" } }, { status: 200, body: { id: "ig_post_1" } }];
    const ig = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (!ig.success || ig.remotePostId !== "ig_post_1") throw new Error("Instagram publish response not parsed");
    if (!calls.at(-3)?.url.includes("/456/media") || !calls.at(-2)?.url.includes("/container_1?") || !calls.at(-1)?.url.includes("/456/media_publish")) {
      throw new Error("Instagram container flow mismatch");
    }

    nextResponses = [{ status: 201, body: {}, headers: { "x-restli-id": "urn:li:share:1" } }];
    const li = await publishLinkedIn(input, { accessToken: "test-token", apiVersion: "202610", authorUrn: "urn:li:organization:123" });
    if (!li.success || li.remotePostId !== "urn:li:share:1") throw new Error("LinkedIn response header not parsed");
    const liCall = calls.at(-1);
    if (liCall?.url !== "https://api.linkedin.com/rest/posts" || new Headers(liCall.init?.headers).get("LinkedIn-Version") !== "202610") {
      throw new Error("LinkedIn endpoint/version headers mismatch");
    }

    nextResponses = [{ status: 201, body: { data: { id: "x_post_1" } } }];
    const x = await publishX(input, { accessToken: "user-context-test-token" });
    if (!x.success || x.remotePostId !== "x_post_1") throw new Error("X response not parsed");
    if (calls.at(-1)?.url !== "https://api.x.com/2/tweets") throw new Error("X endpoint mismatch");

    nextResponses = [{ status: 429, body: { error: "rate limited" } }];
    const rateLimited = await publishX(input, { accessToken: "test-token" });
    if (rateLimited.success || !rateLimited.retryable) throw new Error("HTTP 429 should be marked retryable");

    const noMedia = await publishInstagram({ ...input, mediaUrl: undefined }, {
      accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456",
    });
    if (noMedia.success || noMedia.retryable) throw new Error("Instagram without media must fail closed");

    const beforeInProgress = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_processing" } },
      { status: 200, body: { status_code: "IN_PROGRESS", status: "In Progress" } },
    ];
    const igInProgress = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igInProgress.success || igInProgress.retryable) throw new Error("IN_PROGRESS beyond bounded polling must not publish");
    const inProgressCalls = calls.slice(beforeInProgress);
    if (inProgressCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish a container still processing");

    const beforeRateLimitStatus = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_rate_limited" } },
      { status: 429, body: { error: { message: "rate limited" } } },
    ];
    const igStatusRateLimit = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igStatusRateLimit.success || igStatusRateLimit.retryable) throw new Error("Instagram status 429 must not auto-repeat the publication attempt");
    const rateLimitCalls = calls.slice(beforeRateLimitStatus);
    if (rateLimitCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish after rate-limited status query");

    const beforeStatusTimeout = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_timeout" } },
      { status: 200, body: { error: { message: "request timed out" } } },
    ];
    const igTimeout = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igTimeout.success || igTimeout.retryable) throw new Error("Instagram status timeout/invalid status must fail closed");
    const timeoutCalls = calls.slice(beforeStatusTimeout);
    if (timeoutCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish after status timeout");

    const beforeErrorContainer = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_error" } },
      { status: 200, body: { status_code: "ERROR", status: "Error" } },
    ];
    const igError = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igError.success || igError.retryable) throw new Error("Instagram ERROR container must fail closed");
    const errorCalls = calls.slice(beforeErrorContainer);
    if (errorCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish an ERROR container");

    const beforeExpiredContainer = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_expired" } },
      { status: 200, body: { status_code: "EXPIRED", status: "Expired" } },
    ];
    const igExpired = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igExpired.success || igExpired.retryable) throw new Error("Instagram EXPIRED container must fail closed");
    const expiredCalls = calls.slice(beforeExpiredContainer);
    if (expiredCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish an EXPIRED container");

    const beforeStatusFailure = calls.length;
    nextResponses = [
      { status: 200, body: { id: "container_status_failure" } },
      { status: 403, body: { error: "forbidden" } },
    ];
    const igStatusFailure = await publishInstagram(input, { accessToken: "test-token", apiVersion: "v99.0", instagramUserId: "456" });
    if (igStatusFailure.success || igStatusFailure.retryable) throw new Error("Instagram status-query failure must fail closed");
    const statusFailureCalls = calls.slice(beforeStatusFailure);
    if (statusFailureCalls.some((call) => call.url.includes("/media_publish"))) throw new Error("Instagram must not publish when status cannot be verified");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
