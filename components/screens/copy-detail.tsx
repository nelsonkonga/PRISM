"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "cn";

export function CopyDetail() {
  const params = useParams<{ id: string; copyId: string }>();
  const router = useRouter();
  const { sessions, patchSession } = useStore();
  const session = sessions.find((item) => item.id === params.id);
  const index = session?.copies.findIndex((copy) => copy.id === params.copyId) ?? -1;
  const copy = index >= 0 ? session?.copies[index] : undefined;
  const [saved, setSaved] = useState("");

  if (!session || !copy) {
    return <p>Cette copie n’est pas dans la session.</p>;
  }

  const previous = index > 0 ? session.copies[index - 1] : null;
  const next = index < session.copies.length - 1 ? session.copies[index + 1] : null;

  function go(id: string) {
    router.push(`/sessions/${session!.id}/copies/${id}`);
  }

  function validate() {
    patchSession(session!.id, (current) => {
      const copies = current.copies.map((item) =>
        item.id === copy!.id
          ? { ...item, status: item.score !== null && item.score >= 16 ? "haute" as const : "normale" as const }
          : item,
      );
      return {
        ...current,
        copies,
        copiesDone: copies.filter((item) => item.score !== null && item.status !== "en_cours" && item.status !== "attente" && item.status !== "erreur").length,
      };
    });
    setSaved("Copie validée. La note reste modifiable.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#d5e0ee] sm:flex-row sm:items-center">
        <Link href={`/sessions/${session.id}`} className="inline-flex items-center gap-1 text-sm text-[#1e50a0]">
          <ChevronLeft className="size-4" />
          Toutes les copies
        </Link>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <h1 className="text-lg font-semibold">
          Contrôle commun n<sup className="text-[0.65em]">e</sup> de maths
        </h1>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {copy.status === "erreur" ? "Bloquée" : copy.status === "attente" ? "En attente" : "Corrigée"}
        </span>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {copy.code} · {copy.student}
          {copy.score !== null ? ` · ${copy.score}/20` : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="flex min-h-[640px] flex-col rounded-xl bg-white ring-1 ring-[#d5e0ee]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Copie de l’élève</h2>
            <p className="text-xs text-muted-foreground">{session.title}</p>
          </div>
          <div className="flex-1 bg-[linear-gradient(180deg,#f7fafc,#eef3f8)] p-4 sm:p-6">
            {copy.blocks ? (
              <div className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
                {copy.blocks.map((block) => (
                  <div key={block.title}>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {block.title}
                    </p>
                    <div className="mt-2 space-y-1 font-serif text-[15px] leading-7">
                      {block.lines.map((line) => (
                        <p key={line.text} className="flex items-start justify-between gap-3">
                          <span>{line.text}</span>
                          {line.mark ? (
                            <span className="mt-1 shrink-0 rounded bg-[#e7eef8] px-1.5 py-0.5 font-sans text-[11px] text-[#1e50a0]">
                              {line.mark}
                            </span>
                          ) : null}
                        </p>
                      ))}
                    </div>
                    {block.note ? (
                      <p className="mt-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {block.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-64 place-items-center rounded-lg bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
                {copy.status === "erreur"
                  ? "Lecture bloquée. Le scan est tronqué : relancez l’OCR depuis la file, ou remplacez le fichier."
                  : copy.status === "attente"
                    ? "Cette copie est encore dans la file. Le détail apparaîtra dès que l’analyse sera terminée."
                    : copy.appreciation || "Analyse enregistrée."}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Button variant="ghost" disabled={!previous} onClick={() => previous && go(previous.id)}>
              <ChevronLeft />
              Copie précédente
            </Button>
            <span className="text-sm text-muted-foreground">
              {index + 1} / {session.copies.length}
            </span>
            <Button variant="ghost" disabled={!next} onClick={() => next && go(next.id)}>
              Copie suivante
              <ChevronRight />
            </Button>
          </div>
        </section>

        <section className="rounded-xl bg-white ring-1 ring-[#d5e0ee]">
          <div className="border-b border-border px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-[#1e50a0]" />
              Retour de correction
            </p>
            <p className="mt-3 text-4xl font-semibold">
              {copy.score === null ? "—" : copy.score}
              <span className="text-xl font-normal text-muted-foreground"> / 20</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Correction automatique · Rigueur standard ({session.rigor}/10)
              {copy.analysisSeconds ? ` · Temps d'analyse : ${copy.analysisSeconds.toLocaleString("fr-FR")}s` : ""}
            </p>
          </div>
          <div className="space-y-3 px-5 py-4">
            {(copy.criteria ?? []).map((item) => (
              <article key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      item.tone === "ok" && "bg-emerald-50 text-emerald-800",
                      item.tone === "warn" && "bg-amber-50 text-amber-900",
                      item.tone === "partial" && "bg-sky-50 text-sky-900",
                    )}
                  >
                    {item.score}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.comment}</p>
              </article>
            ))}
            {!copy.criteria?.length ? (
              <p className="text-sm text-muted-foreground">
                Pas encore de critères détaillés pour cette copie.
              </p>
            ) : null}
          </div>
          {copy.appreciation ? (
            <div className="mx-5 mb-5 rounded-lg bg-[#f3f6fb] p-4">
              <p className="text-sm leading-6">{copy.appreciation}</p>
              {copy.advice?.length ? (
                <>
                  <p className="mt-3 text-xs font-semibold tracking-wide">CONSEILS DE RÉVISION :</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                    {copy.advice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <Button
              variant="outline"
              onClick={() =>
                patchSession(session.id, (current) => ({
                  ...current,
                  copies: current.copies.map((item) =>
                    item.id === copy.id && item.score !== null
                      ? { ...item, score: Math.max(0, item.score - 1) }
                      : item,
                  ),
                }))
              }
              disabled={copy.score === null}
            >
              Ajuster −1
            </Button>
            <Button onClick={validate}>Valider la copie</Button>
          </div>
          {saved ? <p className="px-5 pb-4 text-sm text-emerald-700">{saved}</p> : null}
        </section>
      </div>
    </div>
  );
}
