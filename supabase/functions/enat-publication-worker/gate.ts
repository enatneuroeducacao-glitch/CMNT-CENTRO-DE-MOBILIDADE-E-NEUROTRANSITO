export type WorkerGateResult =
  | { allowed: true }
  | { allowed: false; status: number; code: "method_not_allowed" | "unauthorized" | "safe_mode" };

export function evaluateWorkerGate(method: string, providedSecret: string | null, expectedSecret: string, publishingEnabled: string): WorkerGateResult {
  if (method === "OPTIONS") return { allowed: true };
  if (method !== "POST") return { allowed: false, status: 405, code: "method_not_allowed" };
  if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
    return { allowed: false, status: 401, code: "unauthorized" };
  }
  if (publishingEnabled !== "true") return { allowed: false, status: 200, code: "safe_mode" };
  return { allowed: true };
}
