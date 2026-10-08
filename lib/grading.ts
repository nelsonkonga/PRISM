import { anonymizeText } from "@/lib/files";
import { gradeWithGemini } from "@/lib/gemini";
import { gradeLocal } from "@/lib/rubric";
import type { Copy, Session, Settings } from "@/lib/types";

function stamp(copy: Copy, patch: Partial<Copy>): Copy {
  return { ...copy, ...patch };
}

export async function gradeOne(copy: Copy, session: Session, settings: Settings): Promise<Copy> {
  const started = performance.now();
  const sourceText = settings.anonymize ? anonymizeText(copy.text) : copy.text;
  if (!sourceText.trim()) {
    return stamp(copy, {
      status: "erreur",
      score: null,
      source: null,
      error: "Aucun texte dans ce fichier. Ouvrez la copie et saisissez la note.",
      detail: "Fichier sans texte",
    });
  }
  try {
    const useGemini = !settings.localMode;
    const result = useGemini
      ? await gradeWithGemini({
          model: settings.model.trim() || "gemini-2.5-flash",
          temperature: settings.temperature,
          questions: session.questions,
          studentText: sourceText,
          rigor: session.rigor,
          strict: session.mode === "strict",
        })
      : gradeLocal({
          questions: session.questions,
          studentText: sourceText,
          rigor: session.rigor,
          strict: session.mode === "strict",
        });
    if ("error" in result) {
      return stamp(copy, {
        status: "erreur",
        score: null,
        source: null,
        error: result.error,
        detail: result.error,
      });
    }
    const seconds = Math.round((performance.now() - started) / 100) / 10;
    const engine = useGemini ? `Gemini ${settings.model}` : "Comparaison locale";
    return stamp(copy, {
      status: "corrigee",
      score: result.score,
      max: result.max,
      criteria: result.criteria,
      appreciation: result.appreciation,
      advice: result.advice,
      source: useGemini ? "gemini" : "local",
      error: "",
      analysisSeconds: seconds,
      detail: `${engine} · rigueur ${session.rigor}/10 · ${seconds.toLocaleString("fr-FR")} s`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de l’analyse.";
    return stamp(copy, {
      status: "erreur",
      score: null,
      source: null,
      error: message,
      detail: message,
    });
  }
}

const running = new Set<string>();

export async function gradeQueue(input: {
  sessionId: string;
  settings: Settings;
  read: () => Session | undefined;
  patch: (id: string, recipe: (session: Session) => Session) => void;
}) {
  if (running.has(input.sessionId)) return;
  running.add(input.sessionId);
  try {
    const initial = input.read();
    if (!initial?.autoGrade) return;
    for (const copy of initial.copies) {
      const current = input.read();
      const target = current?.copies.find((item) => item.id === copy.id);
      if (!current || !target || target.status !== "attente") continue;
      input.patch(current.id, (session) => ({
        ...session,
        copies: session.copies.map((item) =>
          item.id === target.id ? { ...item, status: "en_cours", detail: "Analyse en cours" } : item,
        ),
      }));
      const graded = await gradeOne(target, current, input.settings);
      input.patch(current.id, (session) => ({
        ...session,
        copies: session.copies.map((item) => (item.id === graded.id ? graded : item)),
        journal: [
          {
            id: `j-${Date.now()}-${graded.id}`,
            text: `${graded.student} : ${graded.detail}`,
          },
          ...session.journal,
        ],
      }));
    }
    input.patch(input.sessionId, (session) => ({ ...session, autoGrade: false }));
  } finally {
    running.delete(input.sessionId);
  }
}
