"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { statusLabel } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { CopyStatus } from "@/lib/types";
import { cn } from "cn";

const copyDot: Record<CopyStatus, string> = {
  en_cours: "bg-amber-500",
  haute: "bg-emerald-600",
  normale: "bg-emerald-500",
  attente: "bg-slate-400",
  erreur: "bg-red-500",
};

export function SessionSpace() {
  const params = useParams<{ id: string }>();
  const { sessions, patchSession } = useStore();
  const session = sessions.find((item) => item.id === params.id);
  const [notice, setNotice] = useState("");

  if (!session) return <p>Session introuvable.</p>;

  const ratio = session.copiesTotal
    ? Math.round((session.copiesDone / session.copiesTotal) * 100)
    : 0;
  const waiting = session.copies.filter((copy) => copy.status === "attente").length;
  const failed = session.copies.filter((copy) => copy.status === "erreur").length;

  function retryFailed() {
    patchSession(session!.id, (current) => ({
      ...current,
      copies: current.copies.map((copy) =>
        copy.status === "erreur" ? { ...copy, status: "attente", detail: "Replacée dans la file" } : copy,
      ),
    }));
    setNotice("La copie bloquée est revenue dans la file.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{session.title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {statusLabel[session.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {session.className} · {session.date}
          </p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" onClick={() => setNotice("Export préparé pour l’établissement. Aucun fichier n’est téléchargé dans cette démonstration.")}>
            Exporter
          </Button>
          <Button variant="outline" onClick={retryFailed}>
            <RefreshCw />
            Relancer
          </Button>
          <Button variant="outline" size="icon" aria-label="Plus d’actions" onClick={() => setNotice("Les actions groupées se règlent copie par copie.")}>
            <MoreHorizontal />
          </Button>
        </div>
      </div>
      {notice ? <p className="text-sm text-[#1e50a0]">{notice}</p> : null}

      <Tabs defaultValue="file">
        <TabsList variant="line" className="h-auto w-full justify-start gap-1 bg-transparent">
          <TabsTrigger value="file">File d’attente ({session.copies.length || session.copiesTotal})</TabsTrigger>
          <TabsTrigger value="corrige">Corrigé</TabsTrigger>
          <TabsTrigger value="bareme">Barème</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4 pt-4">
          <article className="relative overflow-hidden rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            <div className="pointer-events-none absolute -top-10 -right-6 size-40 rounded-full bg-[#1e50a0]/10 blur-2xl" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">Avancement de la session</p>
              <p className="text-muted-foreground">Rigueur {session.rigor}/10</p>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {session.copiesDone}
              <span className="text-xl font-normal text-muted-foreground"> / {session.copiesTotal}</span>
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1e50a0] to-[#4f7ac4]" style={{ width: `${ratio}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <i className="size-2 rounded-full bg-emerald-500" /> {session.copiesDone} traitées
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="size-2 rounded-full bg-slate-400" /> {waiting} en attente
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="size-2 rounded-full bg-red-500" /> {failed} en erreur
              </span>
            </div>
          </article>

          <article className="overflow-hidden rounded-xl bg-white ring-1 ring-[#d5e0ee]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
              <h2 className="font-semibold">File de traitement</h2>
              <p className="text-xs text-muted-foreground">Une copie à la fois, dans l’ordre de dépôt</p>
            </div>
            {session.copies.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                Aucune copie détaillée dans cette session.{" "}
                <Link className="font-medium text-[#1e50a0]" href={`/sessions/${session.id}/corrige`}>
                  Revoir le barème
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {session.copies.map((copy) => (
                  <li key={copy.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                    <span className={cn("size-2 rounded-full", copyDot[copy.status])} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {copy.code} — {copy.student}
                      </span>
                      <span className="block text-sm text-muted-foreground">{copy.detail}</span>
                    </span>
                    <span className="text-sm">{statusLabel[copy.status]}</span>
                    <span className="w-16 text-sm font-medium">
                      {copy.score === null ? "—" : `${copy.score}/20`}
                    </span>
                    <Link href={`/sessions/${session.id}/copies/${copy.id}`} className="text-sm font-semibold text-[#1e50a0]">
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </TabsContent>

        <TabsContent value="corrige" className="pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            <h2 className="font-semibold">Document de référence</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Le corrigé validé pour {session.title}. Les chemins équivalents {session.mode === "equivalent" ? "sont acceptés" : "ne sont pas acceptés"}.
            </p>
            <ul className="mt-4 space-y-3">
              {session.questions.map((question) => (
                <li key={question.id}>
                  <p className="font-medium">{question.title}</p>
                  <p className="text-sm text-muted-foreground">{question.expected}</p>
                </li>
              ))}
            </ul>
          </article>
        </TabsContent>

        <TabsContent value="bareme" className="pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            {session.questions.map((question) => (
              <div key={question.id} className="mb-4">
                <p className="font-medium">
                  {question.title} · {question.points} pts
                </p>
                <ul className="mt-1 text-sm text-muted-foreground">
                  {question.breakdown.map((row) => (
                    <li key={row.label}>
                      {row.label} — {row.points}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href={`/sessions/${session.id}/corrige`} className="text-sm font-semibold text-[#1e50a0]">
              Ajuster avec l’assistant
            </Link>
          </article>
        </TabsContent>

        <TabsContent value="stats" className="pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            <p className="text-sm leading-6">
              {session.average
                ? `Moyenne de la session : ${session.average.toLocaleString("fr-FR")}/20.`
                : "La moyenne sera calculée quand la file sera close."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Avancement {ratio} %. Rigueur standard ({session.rigor}/10).
            </p>
          </article>
        </TabsContent>

        <TabsContent value="journal" className="pt-4">
          <article className="space-y-2 rounded-xl bg-white p-5 text-sm ring-1 ring-[#d5e0ee]">
            {session.chat.length === 0 ? (
              <p className="text-muted-foreground">Aucun échange sur cette session.</p>
            ) : (
              session.chat.map((message) => (
                <p key={message.id}>
                  <span className="font-medium">{message.role === "ai" ? "Assistant" : "Vous"}.</span>{" "}
                  {message.text}
                </p>
              ))
            )}
          </article>
        </TabsContent>
      </Tabs>
    </div>
  );
}
