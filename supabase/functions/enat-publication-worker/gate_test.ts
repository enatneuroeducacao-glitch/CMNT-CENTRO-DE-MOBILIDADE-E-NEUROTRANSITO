import { evaluateWorkerGate } from "./gate.ts";

Deno.test("worker gate rejects non-POST methods", () => {
  const result = evaluateWorkerGate("GET", "secret", "secret", "true");
  if (result.allowed || result.status !== 405 || result.code !== "method_not_allowed") throw new Error("GET must be rejected");
});

Deno.test("worker gate rejects missing or incorrect cron secret", () => {
  for (const supplied of [null, "", "wrong"]) {
    const result = evaluateWorkerGate("POST", supplied, "expected", "true");
    if (result.allowed || result.status !== 401 || result.code !== "unauthorized") throw new Error("Invalid cron secret must be rejected");
  }
});

Deno.test("worker gate keeps external publishing disabled unless flag is exactly true", () => {
  for (const flag of ["", "false", "TRUE", "1", "yes"]) {
    const result = evaluateWorkerGate("POST", "secret", "secret", flag);
    if (result.allowed || result.status !== 200 || result.code !== "safe_mode") throw new Error(`Flag ${flag} must remain in safe mode`);
  }
});

Deno.test("worker gate allows POST only with correct secret and explicit true flag", () => {
  const result = evaluateWorkerGate("POST", "secret", "secret", "true");
  if (!result.allowed) throw new Error("Authorized enabled worker request should pass gate");
});

Deno.test("OPTIONS preflight is allowed without exposing worker execution", () => {
  const result = evaluateWorkerGate("OPTIONS", null, "", "false");
  if (!result.allowed) throw new Error("OPTIONS preflight should be handled");
});
