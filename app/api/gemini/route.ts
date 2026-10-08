export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    apiKey?: string;
    model?: string;
    temperature?: number;
    prompt?: string;
  };
  const apiKey = body.apiKey?.trim() ?? "";
  if (apiKey.length < 10 || apiKey.length > 256) {
    return Response.json({ error: "Clé API invalide." }, { status: 400 });
  }
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
    const model = body.model?.trim() || "gemini-2.5-flash";
    if (!/^[a-zA-Z0-9._-]{3,80}$/.test(model)) {
      return Response.json({ error: "Nom de modèle invalide." }, { status: 400 });
    }
    const temperature = Math.min(1, Math.max(0, Number(body.temperature) || 0.1));
    const prompt = String(body.prompt ?? "").slice(0, 120_000);
    if (!prompt) return Response.json({ error: "Demande vide." }, { status: 400 });
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature, responseMimeType: "application/json" },
        }),
      },
    );
    const data = (await response.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    if (!response.ok) {
      return Response.json({ error: data.error?.message || "Échec Gemini." }, { status: response.status });
    }
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) return Response.json({ error: "Réponse Gemini vide." }, { status: 502 });
    return Response.json({ text });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
