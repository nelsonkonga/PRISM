"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export function Validation() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, patchSession } = useStore();
  const session = sessions.find((item) => item.id === params.id);
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return <p>Cette session n’est plus dans l’espace.</p>;
  }

  function send() {
    const message = text.trim();
    if (!message || !session) return;
    patchSession(session.id, (current) => ({
      ...current,
      chat: [
        ...current.chat,
        { id: `u-${Date.now()}`, role: "user", text: message },
        {
          id: `a-${Date.now()}`,
          role: "ai",
          text: "J’ai intégré la demande au barème de la question concernée. Le total reste sur 20 points. Relisez la colonne de gauche avant de lancer la file.",
        },
      ],
      questions: current.questions.map((question, index) =>
        index === current.questions.length - 1
          ? {
              ...question,
              updatedByAi: true,
              aiNote: message,
            }
          : question,
      ),
    }));
    setText("");
  }

  function launch() {
    if (!session) return;
    if (!confirmed) {
      setError("Confirmez le barème avant de lancer le traitement.");
      return;
    }
    patchSession(session.id, (current) => ({
      ...current,
      validated: true,
      status: current.copies.length ? "en_cours" : current.status,
      copies: current.copies.map((copy, index) =>
        index === 0 ? { ...copy, status: "en_cours" } : copy,
      ),
    }));
    router.push(`/sessions/${session.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1e50a0]/20 bg-[#e7eef8] px-4 py-3 text-sm leading-6">
        <p className="font-medium">
          {session.title}
          <sup className="ml-0.5 text-[0.7em]">e</sup>
          <span className="font-normal text-muted-foreground"> · {session.className}</span>
        </p>
        <p>
          Vérifiez les critères d&apos;évaluation et affinez le barème avec l&apos;assistant avant de lancer le traitement des copies.
        </p>
      </div>
      <div className="grid gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-[#d5e0ee] sm:grid-cols-3">
        <p>Mode {session.mode === "strict" ? "strict" : "chemins équivalents"}</p>
        <p>Rigueur {session.rigor}/10</p>
        <p>{session.copiesTotal} copies en attente</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <h1 className="text-lg font-semibold">Corrigé et barème analytique</h1>
          <div className="mt-4 space-y-4">
            {session.questions.map((question) => (
              <article key={question.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium">{question.title}</h2>
                  <span className="shrink-0 text-sm text-muted-foreground">{question.points} pts</span>
                </div>
                {question.updatedByAi ? (
                  <p className="mt-2 text-xs font-medium text-[#1e50a0]">Mis à jour par l’assistant</p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.expected}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {question.breakdown.map((row) => (
                    <li key={row.label} className="flex justify-between gap-3">
                      <span>{row.label}</span>
                      <span className="text-muted-foreground">{row.points}</span>
                    </li>
                  ))}
                </ul>
                {question.aiNote ? (
                  <p className="mt-3 rounded-md bg-[#f3f6fb] px-3 py-2 text-sm">
                    Critère ajouté : {question.aiNote}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-xl bg-white ring-1 ring-[#d5e0ee]">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Assistant d’ajustement</h2>
            <p className="text-sm text-muted-foreground">Le barème ne change qu’après votre message.</p>
          </div>
          <div className="flex-1 space-y-3 px-5 py-4">
            {session.chat.map((message) => (
              <p
                key={message.id}
                className={
                  message.role === "ai"
                    ? "rounded-lg bg-[#f3f6fb] px-3 py-2 text-sm leading-6"
                    : "ml-8 rounded-lg bg-[#1e50a0] px-3 py-2 text-sm leading-6 text-white"
                }
              >
                {message.text}
              </p>
            ))}
            <div className="flex flex-wrap gap-2">
              {["Pénaliser le signe oublié", "Accepter une autre méthode"].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="rounded-full bg-muted px-3 py-1 text-xs"
                  onClick={() => setText(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
          <form
            className="flex gap-2 border-t border-border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Demander une modification du barème..."
              className="h-11"
            />
            <Button type="submit" size="icon" className="size-11" aria-label="Envoyer">
              <Send />
            </Button>
          </form>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-[#d5e0ee] sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={confirmed}
            onCheckedChange={(checked) => {
              setConfirmed(checked);
              setError("");
            }}
          />
          Je confirme que le barème correspond à l’épreuve et peut s’appliquer à toutes les copies.
        </label>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/sessions" />}>
            Retour
          </Button>
          <Button onClick={launch}>Lancer le traitement</Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
