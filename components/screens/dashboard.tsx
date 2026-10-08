"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ClipboardCheck, FileStack, FolderOpen, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { putFile } from "@/lib/blobs";
import { readUpload } from "@/lib/files";
import { sessionStatusLabel } from "@/lib/labels";
import { distribution, formatFr, gradedCopies, onTwenty, summarizeScores } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const dot: Record<string, string> = {
  terminee: "bg-emerald-500",
  en_cours: "bg-amber-500",
  preparation: "bg-sky-500",
};

export function Dashboard() {
  const { sessions, user, settings } = useStore();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const active = sessions.filter((session) => session.status === "en_cours").length;
  const preparing = sessions.filter((session) => session.status === "preparation").length;
  const corrected = sessions.reduce((sum, session) => sum + session.copiesDone, 0);
  const totalCopies = sessions.reduce((sum, session) => sum + session.copiesTotal, 0);
  const bars = distribution(sessions);
  const scores = gradedCopies(sessions).map(onTwenty).filter((score): score is number => score !== null);
  const stats = summarizeScores(scores);
  const openRigor = sessions.filter((session) => session.status !== "terminee");
  const rigor = openRigor.length
    ? Math.round(openRigor.reduce((sum, session) => sum + session.rigor, 0) / openRigor.length)
    : null;
  const peak = bars.reduce((best, bar) => (bar.count > best.count ? bar : best), bars[0]);

  async function importSupport(file: File | undefined) {
    if (!file) return;
    const extracted = await readUpload(file);
    const fileId = crypto.randomUUID();
    await putFile(fileId, file);
    sessionStorage.setItem(
      "prism-pending-support",
      JSON.stringify({ name: file.name, text: extracted.text, fileId, mime: file.type || "application/octet-stream" }),
    );
    router.push("/sessions/nouvelle?etape=3");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-[#1e50a0] ring-1 ring-[#d5e0ee]">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {user?.establishment}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Bonjour, {user?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Les sessions, les copies et les notes de ce compte.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-[#d5e0ee]">
            <span className={cn("size-2 rounded-full", settings.connection === "connecte" ? "bg-emerald-500" : "bg-amber-500")} />
            {settings.connection === "connecte" ? "Gemini connecté" : "Gemini non vérifié"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-[#d5e0ee]">
            {settings.localMode ? "Comparaison locale" : settings.model}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Sessions ouvertes" value={String(active + preparing)} hint={`${preparing} en préparation`} icon={<FolderOpen className="size-4" />} />
        <Metric label="Copies en file" value={String(totalCopies - corrected)} hint={active ? "Sessions en cours" : "Aucune file ouverte"} icon={<ClipboardCheck className="size-4" />} live={active > 0} />
        <Metric
          label="Copies notées"
          value={String(corrected)}
          hint={totalCopies ? `${Math.round((corrected / totalCopies) * 100)} % du total déposé` : "Aucun fichier déposé"}
          icon={<FileStack className="size-4" />}
          bar={totalCopies ? Math.round((corrected / totalCopies) * 100) : undefined}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl bg-[#1e50a0] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ouvrir une session de correction</h2>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            Déposez le corrigé, choisissez la rigueur, puis lancez la file sur les copies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf,image/*"
            className="hidden"
            onChange={(event) => {
              void importSupport(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button variant="secondary" className="bg-white text-[#1e50a0] hover:bg-white/90" onClick={() => input.current?.click()}>
            Importer un corrigé
          </Button>
          <Button className="bg-[#163e7c] text-white hover:bg-[#122f5e]" onClick={() => router.push("/sessions/nouvelle")}>
            <Plus />
            Nouvelle session
          </Button>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="min-w-0 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Notes enregistrées</p>
              <h2 className="text-xl font-semibold">Distribution des résultats</h2>
            </div>
            <p className="rounded-full bg-muted px-2 py-1 text-xs">Notes ramenées sur 20</p>
          </div>
          {scores.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Aucune note pour l’instant. La répartition apparaîtra après la première copie notée.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <div className="flex h-56 min-w-[420px] items-end gap-2 sm:gap-3">
                {bars.map((bar) => (
                  <div key={bar.tier} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium">{bar.count}</span>
                    <div className={cn("w-full rounded-t-md", bar.tier === peak.tier && bar.count > 0 ? "bg-[#1e50a0]" : "bg-[#c5d4ea]")} style={{ height: `${bar.height}%` }} />
                    <span className="text-xs font-semibold">{bar.tier}</span>
                    <span className="text-center text-[10px] text-muted-foreground">{bar.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-sm">
            <Stat label="Moyenne" value={formatFr(stats.mean)} />
            <Stat label="Médiane" value={formatFr(stats.median)} />
            <Stat label="Écart-type" value={formatFr(stats.deviation)} />
          </div>
        </article>

        <article className="min-w-0 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Activité</p>
              <h2 className="text-xl font-semibold">Sessions récentes</h2>
            </div>
            <Link href="/sessions" className="text-sm font-medium text-[#1e50a0]">Voir tout</Link>
          </div>
          {sessions.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Aucune session. Importez un corrigé pour commencer.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {sessions.slice(0, 4).map((session) => (
                <li key={session.id}>
                  <Link
                    href={session.validated ? `/sessions/${session.id}` : `/sessions/${session.id}/corrige`}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <span>
                      <span className="block font-medium">{session.title}</span>
                      <span className="block text-sm text-muted-foreground">{session.className} · {session.summary}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
                      <span className={cn("size-1.5 rounded-full", dot[session.status])} />
                      {sessionStatusLabel[session.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="min-w-0 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <h2 className="font-semibold">Rigueur des sessions ouvertes</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {rigor === null
              ? "Aucune session ouverte. La rigueur se choisit à la création, de 0 à 10."
              : `Rigueur moyenne des sessions ouvertes : ${rigor}/10.${scores.length ? ` Le palier le plus rempli est ${peak.tier} (${peak.range}).` : ""}`}
          </p>
          <div className="mt-4 flex h-16 items-end gap-1 overflow-x-auto">
            {bars.map((bar) => (
              <span key={bar.tier} className="min-w-6 flex-1 rounded-sm bg-[#1e50a0]/80" style={{ height: `${Math.max(bar.height, 6)}%` }} />
            ))}
          </div>
        </article>
        <article className="min-w-0 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-[#1e50a0]" />
            Où vont les copies
          </div>
          <p className="mt-3 text-sm leading-6">
            Les fichiers et les notes restent dans ce navigateur. Avec Gemini activé, le texte de la copie et le barème sont envoyés à Google le temps de l’analyse.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/parametres")}>
            Revoir le moteur
            <ArrowUpRight />
          </Button>
        </article>
      </section>
    </div>
  );
}

function Metric({ label, value, hint, icon, live, bar }: { label: string; value: string; hint: string; icon: ReactNode; live?: boolean; bar?: number }) {
  return (
    <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {label}
            {live ? <span className="size-2 rounded-full bg-amber-500" /> : null}
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-[#e7eef8] text-[#1e50a0]">{icon}</span>
      </div>
      {bar !== undefined ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[#1e50a0]" style={{ width: `${bar}%` }} />
        </div>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">{hint}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}
