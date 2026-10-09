import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function resolveSecret() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.default === "string") return parsed.default;
        const first = Object.values(parsed).find((v) => typeof v === "string");
        if (typeof first === "string") return first;
      }
    } catch {
      return raw;
    }
    return raw;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!legacy) throw new Error("Configuração de chave administrativa ausente.");
  return legacy;
}

const url = Deno.env.get("SUPABASE_URL");
if (!url) throw new Error("SUPABASE_URL ausente.");
const admin = createClient(url, resolveSecret(), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const credentialTypes = new Set([
  "CNH",
  "Instrutor de Trânsito",
  "Profissional de mobilidade",
  "Pesquisador",
  "Gestor público",
  "Usuário da comunidade",
  "Outra",
]);
const privacyPolicyVersion = "1.0";

function isAdult(dateText: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return false;
  const birth = new Date(dateText + "T00:00:00.000Z");
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== dateText) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  ) age--;
  return age >= 18;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Autenticação necessária." }, 401);
  const token = authorization.slice(7);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json({ error: "Sessão inválida ou expirada." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo JSON inválido." }, 400);
  }

  const birthDate = String(body.birth_date || "").trim();
  const credentialType = String(body.credential_type || "").trim();
  const credentialNumber = String(body.credential_number || "").trim();
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim().toUpperCase();
  if (body.lgpd_consent !== true || body.community_guidelines_accepted !== true) {
    return json({ error: "É necessário aceitar o Aviso de Privacidade e o Compromisso de Convivência." }, 400);
  }
  if (!isAdult(birthDate)) return json({ error: "É necessário ter pelo menos 18 anos e informar uma data válida." }, 400);
  if (!credentialTypes.has(credentialType)) return json({ error: "Tipo de credencial inválido." }, 400);
  if (credentialNumber.length < 1 || credentialNumber.length > 120) {
    return json({ error: "Informe um número de credencial válido." }, 400);
  }
  if (city.length < 2 || city.length > 100 || !/^[A-Z]{2}$/.test(state)) {
    return json({ error: "Informe uma cidade e uma UF válida." }, 400);
  }

  const now = new Date().toISOString();
  const existingResult = await admin
    .from("social_identity")
    .select("user_id,birth_date,credential_type,credential_number,lgpd_consent,community_guidelines_accepted,consent_at,guidelines_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingResult.error) {
    console.error("identity lookup failed", existingResult.error);
    return json({ error: "Não foi possível validar o cadastro. Tente novamente." }, 500);
  }

  const existing = existingResult.data;
  const identityComplete = !!(
    existing &&
    existing.birth_date &&
    existing.credential_type &&
    existing.credential_number &&
    existing.lgpd_consent === true &&
    existing.community_guidelines_accepted === true &&
    existing.consent_at &&
    existing.guidelines_accepted_at
  );

  if (!identityComplete) {
    const identityValues = {
      user_id: user.id,
      birth_date: birthDate,
      credential_type: credentialType,
      credential_number: credentialNumber,
      lgpd_consent: true,
      community_guidelines_accepted: true,
      privacy_policy_version: privacyPolicyVersion,
      consent_at: existing?.consent_at || now,
      guidelines_accepted_at: existing?.guidelines_accepted_at || now,
    };
    const identityWrite = existing
      ? await admin.from("social_identity").update(identityValues).eq("user_id", user.id)
      : await admin.from("social_identity").insert(identityValues);
    if (identityWrite.error) {
      console.error("identity write failed", identityWrite.error);
      return json({ error: "Não foi possível salvar os dados de cadastro. Tente novamente." }, 500);
    }
  }

  const profileUpdate = await admin
    .from("social_profiles")
    .update({ city, state, updated_at: now })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (profileUpdate.error) {
    console.error("profile location update failed", profileUpdate.error);
    return json({ error: "Os dados foram validados, mas não foi possível atualizar o perfil." }, 500);
  }
  if (!profileUpdate.data) {
    const emailPrefix = String(user.email || "").split("@")[0];
    const rawName = String(user.user_metadata?.display_name || user.user_metadata?.full_name || emailPrefix || "usuario");
    const base = rawName.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "usuario";
    const username = base + "_" + user.id.replace(/-/g, "").slice(0, 5);
    const profileInsert = await admin.from("social_profiles").upsert({
      id: user.id,
      username,
      display_name: rawName,
      city,
      state,
      updated_at: now,
    }, { onConflict: "id" });
    if (profileInsert.error) {
      console.error("profile fallback failed", profileInsert.error);
      return json({ error: "Não foi possível finalizar o perfil social." }, 500);
    }
  }

  return json({ ok: true, identity_complete: true });
});
