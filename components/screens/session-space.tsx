"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadText, sessionCsv } from "@/lib/export";
import { getFile } from "@/lib/blobs";
import { gradeQueue } from "@/lib/grading";
import { copyStatusLabel, sessionStatusLabel } from "@/lib/labels";
import { formatFr, onTwenty, summarizeScores } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const copyDot: Record<string, string> = {
  corrigee: "bg-emerald-500",
  en_cours: "bg-amber-500",
  attente: "bg-slate-400",
  erreur: "bg-red-500",
};

export function SessionSpace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const session = store.sessions.find((item) => item.id === params.id);

  useEffect(() => {
    if (!session?.autoGrade) return;
    void gradeQueue({
      sessionId: session.id,
      settings: store.settings,
      read: () => store.readSession(session.id),
      patch: (id, recipe) => store.patchSession(id, recipe),
    });
  }, [session?.autoGrade, session?.id, store]);

  if (!session) return <p>Cette session n’est plus dans l’espace.</p>;

  const ratio = session.copiesTotal ? Math.round((session.copiesDone / session.copiesTotal) * 100) : 0;
  const waiting = session.copies.filter((copy) => copy.status === "attente").length;
  const failed = session.copies.filter((copy) => copy.status === "erreur").length;
  const scores = session.copies.map(onTwenty).filter((score): score is number => score !== null);
  const stats = summarizeScores(scores);

  function retryFailed() {
    store.patchSession(session!.id, (current) => ({
      ...current,
      autoGrade: true,
      copies: current.copies.map((copy) =>
        copy.status === "erreur" ? { ...copy, status: "attente", detail: "Replacée dans la file", error: "" } : copy,
      ),
    }));
  }

  async function exportOriginal() {
    const blob = await getFile(session!.supportFileId);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = session!.supportName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{session.title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {sessionStatusLabel[session.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{session.className} · {session.date} · {session.duration}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button variant="outline" onClick={() => downloadText(`${session.title}.csv`, sessionCsv(session), "text/csv;charset=utf-8")}>
            Exporter
          </Button>
          <Button variant="outline" onClick={retryFailed} disabled={failed === 0}>
            <RefreshCw />
            Relancer
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm("Supprimer cette session et ses fichiers ?")) {
                store.deleteSession(session.id);
                router.push("/sessions");
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="file">
        <TabsList variant="line" className="h-auto w-full min-w-0 justify-start gap-1 overflow-x-auto bg-transparent">
          <TabsTrigger value="file">File d’attente ({session.copies.length})</TabsTrigger>
          <TabsTrigger value="corrige">Corrigé</TabsTrigger>
          <TabsTrigger value="bareme">Barème</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4 pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">Avancement de la session</p>
              <p className="text-muted-foreground">Rigueur {session.rigor}/10 · {session.mode === "strict" ? "strict" : "équivalents"}</p>
            </div>
            <p className="mt-2 text-3xl font-semibold">{session.copiesDone}<span className="text-xl font-normal text-muted-foreground"> / {session.copiesTotal}</span></p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#1e50a0]" style={{ width: `${ratio}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{session.copiesDone} notées</span>
              <span>{waiting} en attente</span>
              <span>{failed} en erreur</span>
            </div>
          </article>
          <article className="overflow-hidden rounded-xl bg-white ring-1 ring-[#d5e0ee]">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-semibold">File de traitement</h2>
            </div>
            <ul className="divide-y divide-border">
              {session.copies.map((copy) => (
                <li key={copy.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                  <span className={cn("size-2 shrink-0 rounded-full", copyDot[copy.status])} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{copy.code} — {copy.student}</span>
                    <span className="block text-sm text-muted-foreground">{copy.detail}</span>
                  </span>
                  <span className="text-sm">{copyStatusLabel[copy.status]}</span>
                  <span className="w-20 text-sm font-medium">{copy.score === null ? "—" : `${copy.score}/${copy.max}`}</span>
                  <Link href={`/sessions/${session.id}/copies/${copy.id}`} className="text-sm font-semibold text-[#1e50a0]">Ouvrir</Link>
                </li>
              ))}
            </ul>
          </article>
        </TabsContent>

        <TabsContent value="corrige" className="pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{session.supportName}</h2>
              <button type="button" className="text-sm font-semibold text-[#1e50a0]" onClick={() => void exportOriginal()}>Télécharger le fichier</button>
            </div>
            <pre className="mt-4 max-h-[480px] overflow-auto text-sm whitespace-pre-wrap">{session.supportText || "Aucun texte extrait de ce fichier."}</pre>
          </article>
        </TabsContent>

        <TabsContent value="bareme" className="pt-4">
          <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
            {session.questions.map((question) => (
              <div key={question.id} className="mb-4">
                <p className="font-medium">{question.title} · {question.points} pts</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{question.expected}</p>
                <ul className="mt-1 text-sm text-muted-foreground">
                  {question.breakdown.map((row) => (
                    <li key={row.id}>{row.label} — {row.points} pts</li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href={`/sessions/${session.id}/corrige`} className="text-sm font-semibold text-[#1e50a0]">Modifier le barème</Link>
          </article>
        </TabsContent>

        <TabsContent value="stats" className="pt-4">
          <article className="rounded-xl bg-white p-5 text-sm leading-6 ring-1 ring-[#d5e0ee]">
            <p>Moyenne sur 20 : {formatFr(stats.mean)}. Médiane : {formatFr(stats.median)}. Écart-type : {formatFr(stats.deviation)}.</p>
            <p className="mt-2 text-muted-foreground">{scores.length} copie{scores.length > 1 ? "s" : ""} notée{scores.length > 1 ? "s" : ""}. Avancement {ratio} %.</p>
          </article>
        </TabsContent>

        <TabsContent value="journal" className="pt-4">
          <article className="space-y-2 rounded-xl bg-white p-5 text-sm ring-1 ring-[#d5e0ee]">
            {session.journal.length === 0 ? <p className="text-muted-foreground">Aucun événement.</p> : session.journal.map((entry) => <p key={entry.id}>{entry.text}</p>)}
          </article>
        </TabsContent>
      </Tabs>
    </div>
  );
}
