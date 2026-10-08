import type { Question } from "@/lib/types";
import { questionPoints, syncQuestion } from "@/lib/rubric";
import { supabase } from "@/lib/supabase";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session absente.");
  return { authorization: `Bearer ${token}`, "content-type": "application/json" };
}

async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string; text?: string; models?: string[]; model?: string };
  if (!response.ok) {
    throw new Error(data.error || "L’appel Gemini a échoué.");
  }
  return data;
}

export async function geminiConfigured() {
  const response = await fetch("/api/gemini", { headers: await authHeaders() });
  const data = (await response.json()) as { configured?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || "Impossible de lire la configuration Gemini.");
  return Boolean(data.configured);
}

export async function testGemini() {
  const data = await post({ action: "test" });
  return data.models ?? [];
}

export async function gradeWithGemini(input: {
  model: string;
  temperature: string;
  questions: Question[];
  studentText: string;
  rigor: number;
  strict: boolean;
}) {
  const rubric = input.questions.map((question) => ({
    id: question.id,
    title: question.title,
    expected: question.expected,
    rows: question.breakdown.map((row) => ({ id: row.id, label: row.label, max: row.points })),
  }));
  const prompt = [
    "Tu corriges une copie à partir du seul texte fourni et du barème. N’invente pas de passage absent de la copie.",
    `Mode : ${input.strict ? "strict, aligné sur le corrigé" : "les chemins équivalents justes sont acceptés"}.`,
    `Rigueur de 0 à 10 : ${input.rigor}.`,
    "Réponds en JSON : {\"criteria\":[{\"questionId\":\"\",\"rowId\":\"\",\"awarded\":0,\"comment\":\"\"}],\"appreciation\":\"\",\"advice\":[\"\"]}.",
    "Un objet criteria par ligne de barème, awarded entre 0 et max, par pas de 0,5.",
    `Barème : ${JSON.stringify(rubric)}`,
    `Copie :\n${input.studentText}`,
  ].join("\n\n");
  const data = await post({
    action: "generate",
    model: input.model,
    temperature: Number(input.temperature) || 0.1,
    prompt,
  });
  return { ...parseGeminiGrade(data.text || "", input.questions), model: data.model || input.model };
}

export function parseGeminiGrade(raw: string, questions: Question[]) {
  const parsed = JSON.parse(raw) as {
    criteria?: { questionId?: string; rowId?: string; awarded?: number; comment?: string }[];
    appreciation?: string;
    advice?: string[];
  };
  if (!Array.isArray(parsed.criteria)) {
    throw new Error("Gemini n’a pas renvoyé de critères.");
  }
  const criteria = questions.flatMap((question) =>
    question.breakdown.map((row) => {
      const found = parsed.criteria?.find((item) => item.questionId === question.id && item.rowId === row.id);
      if (!found || typeof found.awarded !== "number") {
        throw new Error(`Gemini n’a pas noté « ${row.label} ».`);
      }
      const awarded = Math.max(0, Math.min(row.points, Math.round(found.awarded * 2) / 2));
      return {
        id: `${question.id}-${row.id}`,
        title: row.label,
        comment: String(found.comment || "").trim() || "Commentaire non fourni.",
        awarded,
        max: row.points,
      };
    }),
  );
  const max = criteria.reduce((sum, item) => sum + item.max, 0);
  const score = Math.round(criteria.reduce((sum, item) => sum + item.awarded, 0) * 2) / 2;
  return {
    score,
    max,
    criteria,
    appreciation: String(parsed.appreciation || "").trim() || "Appréciation non fournie.",
    advice: Array.isArray(parsed.advice) ? parsed.advice.map((item) => String(item)).filter(Boolean) : [],
  };
}

export async function reviseWithGemini(input: {
  model: string;
  temperature: string;
  questions: Question[];
  message: string;
}) {
  const prompt = [
    "Tu modifies un barème d’examen selon la demande de l’enseignant. Conserve les id existants.",
    "Réponds en JSON : {\"reply\":\"\",\"questions\":[{\"id\":\"\",\"title\":\"\",\"expected\":\"\",\"breakdown\":[{\"id\":\"\",\"label\":\"\",\"points\":0}]}]}.",
    "Les points sont des nombres. N’ajoute pas de question qui n’est pas demandée.",
    `Demande : ${input.message}`,
    `Barème actuel : ${JSON.stringify(input.questions)}`,
  ].join("\n\n");
  const data = await post({
    action: "generate",
    model: input.model,
    temperature: Number(input.temperature) || 0.1,
    prompt,
  });
  const parsed = JSON.parse(data.text || "") as { reply?: string; questions?: Question[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Gemini n’a pas renvoyé de barème.");
  }
  const questions = parsed.questions.map((question, index) =>
    syncQuestion({
      id: question.id || `q-${index + 1}`,
      title: String(question.title || `Question ${index + 1}`),
      expected: String(question.expected || ""),
      points: 0,
      breakdown: (question.breakdown || []).map((row, rowIndex) => ({
        id: row.id || `r-${index}-${rowIndex}`,
        label: String(row.label || "Critère"),
        points: Number(row.points) || 0,
      })),
    }),
  );
  if (questions.some((question) => questionPoints(question) < 0)) {
    throw new Error("Barème renvoyé invalide.");
  }
  return {
    questions,
    reply: String(parsed.reply || "Barème mis à jour.").trim(),
  };
}
