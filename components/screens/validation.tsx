"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reviseWithGemini } from "@/lib/gemini";
import { questionPoints, reviseRubric, syncQuestion } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import type { Question } from "@/lib/types";

export function Validation() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, settings, patchSession } = useStore();
  const session = sessions.find((item) => item.id === params.id);
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!session) return <p>Cette session n’est plus dans l’espace.</p>;

  const engine = settings.localMode
    ? "Comparaison locale au corrigé"
    : settings.apiKey.trim()
      ? `Gemini · ${settings.model}`
      : "Aucun moteur : ajoutez une clé ou activez la comparaison locale";

  function updateQuestions(questions: Question[]) {
    patchSession(session!.id, (current) => ({ ...current, questions }));
  }

  function editQuestion(id: string, recipe: (question: Question) => Question) {
    updateQuestions(session!.questions.map((question) => (question.id === id ? syncQuestion(recipe(question)) : question)));
  }

  async function send() {
    const message = text.trim();
    if (!message || !session) return;
    setSending(true);
    setError("");
    try {
      const local = reviseRubric(session.questions, message);
      const revised =
        local ??
        (!settings.localMode && settings.apiKey.trim()
          ? await reviseWithGemini({
              apiKey: settings.apiKey.trim(),
              model: settings.model,
              temperature: settings.temperature,
              questions: session.questions,
              message,
            })
          : null);
      const reply = revised
        ? revised.reply
        : "Le barème n’a pas changé. Écrivez par exemple « retire 1 pt sur Question 1 » ou « ajoute un critère Justification de 2 pts sur la question 2 », ou modifiez les champs.";
      patchSession(session.id, (current) => ({
        ...current,
        questions: revised?.questions ?? current.questions,
        chat: [
          ...current.chat,
          { id: `u-${crypto.randomUUID()}`, role: "user", text: message },
          { id: `a-${crypto.randomUUID()}`, role: "ai", text: reply },
        ],
      }));
      setText("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La modification a échoué.");
    } finally {
      setSending(false);
    }
  }

  function launch() {
    if (!session) return;
    if (!confirmed) {
      setError("Confirmez le barème avant de lancer le traitement.");
      return;
    }
    if (session.questions.some((question) => !question.expected.trim() || questionPoints(question) <= 0)) {
      setError("Chaque question doit avoir un texte attendu et au moins un point.");
      return;
    }
    if (!settings.localMode && !settings.apiKey.trim()) {
      setError("Activez la comparaison locale dans Paramètres, ou enregistrez une clé Gemini.");
      return;
    }
    patchSession(session.id, (current) => ({ ...current, validated: true, autoGrade: true }));
    router.push(`/sessions/${session.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1e50a0]/20 bg-[#e7eef8] px-4 py-3 text-sm leading-6">
        <p className="font-medium">{session.title}<span className="font-normal text-muted-foreground"> · {session.className}</span></p>
        <p>Vérifiez le texte extrait de {session.supportName}, les points, puis lancez la file. Moteur : {engine}.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold">Corrigé et barème</h1>
            <Button
              variant="outline"
              onClick={() =>
                updateQuestions([
                  ...session.questions,
                  syncQuestion({
                    id: `q-${crypto.randomUUID()}`,
                    title: `Question ${session.questions.length + 1}`,
                    points: 1,
                    expected: "",
                    breakdown: [{ id: `r-${crypto.randomUUID()}`, label: "Ensemble de la question", points: 1 }],
                  }),
                ])
              }
            >
              <Plus />
              Question
            </Button>
          </div>
          {session.supportText ? (
            <pre className="max-h-40 overflow-auto rounded-lg bg-[#f3f6fb] p-3 text-xs whitespace-pre-wrap">{session.supportText}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">Le fichier déposé ne contient pas de texte. Rédigez ce qui est attendu.</p>
          )}
          {session.questions.map((question, index) => (
            <article key={question.id} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Question {index + 1} · {questionPoints(question)} pts</p>
                <button type="button" className="text-muted-foreground" aria-label="Supprimer la question" onClick={() => updateQuestions(session.questions.filter((item) => item.id !== question.id))}>
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Input value={question.title} onChange={(event) => editQuestion(question.id, (item) => ({ ...item, title: event.target.value }))} />
              <Textarea value={question.expected} placeholder="Texte attendu, extrait du corrigé ou rédigé ici" onChange={(event) => editQuestion(question.id, (item) => ({ ...item, expected: event.target.value }))} />
              <ul className="space-y-2">
                {question.breakdown.map((row) => (
                  <li key={row.id} className="flex gap-2">
                    <Input value={row.label} onChange={(event) => editQuestion(question.id, (item) => ({ ...item, breakdown: item.breakdown.map((line) => line.id === row.id ? { ...line, label: event.target.value } : line) }))} />
                    <Input className="w-24" type="number" min={0} step={0.5} value={row.points} onChange={(event) => editQuestion(question.id, (item) => ({ ...item, breakdown: item.breakdown.map((line) => line.id === row.id ? { ...line, points: Number(event.target.value) || 0 } : line) }))} />
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" onClick={() => editQuestion(question.id, (item) => ({ ...item, breakdown: [...item.breakdown, { id: `r-${crypto.randomUUID()}`, label: "Nouveau critère", points: 1 }] }))}>
                Ajouter un critère
              </Button>
            </article>
          ))}
        </section>

        <section className="flex flex-col rounded-xl bg-white ring-1 ring-[#d5e0ee]">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Assistant d’ajustement</h2>
            <p className="text-sm text-muted-foreground">Une demande précise modifie les points. Le reste se corrige dans les champs.</p>
          </div>
          <div className="flex-1 space-y-3 px-5 py-4">
            {session.chat.map((message) => (
              <p key={message.id} className={message.role === "ai" ? "rounded-lg bg-[#f3f6fb] px-3 py-2 text-sm leading-6" : "ml-8 rounded-lg bg-[#1e50a0] px-3 py-2 text-sm leading-6 text-white"}>
                {message.text}
              </p>
            ))}
          </div>
          <form className="flex gap-2 border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Demander une modification du barème..." className="h-11" />
            <Button type="submit" size="icon" className="size-11" aria-label="Envoyer" disabled={sending}>
              <Send />
            </Button>
          </form>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-[#d5e0ee] sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox className="mt-0.5" checked={confirmed} onCheckedChange={(checked) => { setConfirmed(checked); setError(""); }} />
          Je confirme que le barème correspond à l’épreuve et peut s’appliquer à toutes les copies.
        </label>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/sessions" />}>Retour</Button>
          <Button onClick={launch}>Lancer le traitement</Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
