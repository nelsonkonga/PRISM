import { createClient } from "@supabase/supabase-js";

async function caller(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const header = request.headers.get("authorization");
  if (!url || !anon || !header?.startsWith("Bearer ")) return null;
  const supabase = createClient(url, anon, { global: { headers: { Authorization: header } } });
  const { data } = await supabase.auth.getUser();
  return data.user;
}

function serverKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  return apiKey.length >= 10 ? apiKey : "";
}

export async function GET(request: Request) {
  const user = await caller(request);
  if (!user) return Response.json({ error: "Session absente." }, { status: 401 });
  return Response.json({ configured: Boolean(serverKey()) });
}

export async function POST(request: Request) {
  const user = await caller(request);
  if (!user) return Response.json({ error: "Session absente." }, { status: 401 });
  const apiKey = serverKey();
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY est absente du serveur." }, { status: 500 });
  }
  const body = (await request.json()) as {
    action?: string;
    model?: string;
    temperature?: number;
    prompt?: string;
  };
  if (body.action === "test") {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=20", {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = (await response.json()) as { error?: { message?: string }; models?: { name?: string }[] };
    if (!response.ok) {
      return Response.json({ error: data.error?.message || "Gemini a refusé la clé." }, { status: response.status });
    }
    const models = (data.models ?? [])
      .map((model) => model.name?.replace("models/", "") ?? "")
      .filter(Boolean);
    return Response.json({ models });
  }
  if (body.action === "generate") {
    const requested = body.model?.trim().replace(/^models\//, "") || "gemini-3.8-flash";
    const model = requested === "gemini-2.5-flash" ? "gemini-3.8-flash" : requested;
    if (!/^[a-zA-Z0-9._-]{3,80}$/.test(model)) {
      return Response.json({ error: "Nom de modèle invalide." }, { status: 400 });
    }
    const temperature = Math.min(1, Math.max(0, Number(body.temperature) || 0.1));
    const prompt = String(body.prompt ?? "").slice(0, 120_000);
    if (!prompt) return Response.json({ error: "Demande vide." }, { status: 400 });
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: prompt,
        generation_config: { temperature },
        response_format: { type: "text", mime_type: "application/json" },
      }),
    });
    const data = (await response.json()) as {
      error?: { message?: string };
      output_text?: string;
      steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
    };
    if (!response.ok) {
      return Response.json({ error: data.error?.message || "Échec Gemini." }, { status: response.status });
    }
    const fromSteps = (data.steps ?? [])
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
    const text = (data.output_text || fromSteps).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    if (!text) return Response.json({ error: "Réponse Gemini vide." }, { status: 502 });
    return Response.json({ text });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
