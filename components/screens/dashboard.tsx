"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { histogram, statusLabel } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const dot: Record<string, string> = {
  terminee: "bg-emerald-500",
  en_cours: "bg-amber-500",
  preparation: "bg-sky-500",
};

export function Dashboard() {
  const { sessions, user } = useStore();
  const router = useRouter();
  const active = sessions.filter((session) => session.status === "en_cours").length;
  const preparing = sessions.filter((session) => session.status === "preparation").length;
  const corrected = sessions.reduce((sum, session) => sum + session.copiesDone, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-[#1e50a0] ring-1 ring-[#d5e0ee]">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {user?.establishment} · Année scolaire 2024-2025
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Bonjour, {user?.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Voici un aperçu de votre activité de correction et de vos flux d&apos;évaluation assistée.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-[#d5e0ee]">
            <span className="size-2 rounded-full bg-emerald-500" />
            Moteur nominal
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-[#d5e0ee]">
            Référentiel synchronisé
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          label="Sessions actives"
          value={String(active + preparing)}
          hint={`+${preparing} en préparation`}
          icon={<FolderOpen className="size-4" />}
        />
        <Metric
          label="Corrections en cours"
          value={String(sessions.find((item) => item.status === "en_cours")?.copiesTotal ?? 0)}
          hint="File du bac blanc ouverte"
          icon={<ClipboardCheck className="size-4" />}
          live
        />
        <Metric
          label="Copies corrigées"
          value={String(corrected)}
          hint="Depuis le début du mois"
          icon={<FileStack className="size-4" />}
          bar={81}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl bg-[#1e50a0] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ouvrir une session de correction</h2>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            Déposez le corrigé, choisissez la rigueur, puis laissez l’assistant préparer le barème avant la file des copies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="bg-white text-[#1e50a0] hover:bg-white/90"
            onClick={() => router.push("/sessions/nouvelle?etape=3")}
          >
            Importer un corrigé
          </Button>
          <Button
            className="bg-[#163e7c] text-white hover:bg-[#122f5e]"
            onClick={() => router.push("/sessions/nouvelle")}
          >
            <Plus />
            Nouvelle session
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Ce mois</p>
              <h2 className="text-xl font-semibold">Distribution des résultats</h2>
            </div>
            <p className="rounded-full bg-muted px-2 py-1 text-xs">Notes sur 20</p>
          </div>
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
            {histogram.map((bar) => (
              <div key={bar.tier} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium">{bar.count}</span>
                <div
                  className={cn(
                    "w-full rounded-t-md",
                    bar.tier === "B" ? "bg-[#1e50a0]" : "bg-[#c5d4ea]",
                  )}
                  style={{ height: `${bar.height}%` }}
                />
                <span className="text-xs font-semibold">{bar.tier}</span>
                <span className="text-center text-[10px] text-muted-foreground">{bar.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-sm">
            <Stat label="Moyenne" value="12,8" />
            <Stat label="Médiane" value="13" />
            <Stat label="Écart-type" value="3,1" />
          </div>
        </article>

        <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Activité</p>
              <h2 className="text-xl font-semibold">Sessions récentes</h2>
            </div>
            <Link href="/sessions" className="text-sm font-medium text-[#1e50a0]">
              Voir tout
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {sessions.slice(0, 4).map((session) => (
              <li key={session.id}>
                <Link
                  href={
                    session.validated
                      ? `/sessions/${session.id}`
                      : `/sessions/${session.id}/corrige`
                  }
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <span>
                    <span className="block font-medium">{session.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {session.className} · {session.summary}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
                    <span className={cn("size-1.5 rounded-full", dot[session.status])} />
                    {statusLabel[session.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <h2 className="font-semibold">Diagnostic de calibration</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Le niveau de rigueur des sessions ouvertes est à 5/10. La masse des notes se situe entre 12 et 15, conforme au profil attendu pour ce niveau.
          </p>
          <div className="mt-4 flex h-16 items-end gap-1">
            {[18, 28, 36, 52, 70, 88, 76, 60, 44, 30, 22, 16].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-sm bg-[#1e50a0]/80"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </article>
        <article className="rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-[#1e50a0]" />
            Vérification des grilles
          </div>
          <p className="mt-3 text-sm leading-6">
            Vos grilles d&apos;évaluation sont synchronisées avec le référentiel national 2024-2025.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            Conforme charte RGPD Académique
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/parametres")}>
            Revoir les modèles
            <ArrowUpRight />
          </Button>
        </article>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
  live,
  bar,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  live?: boolean;
  bar?: number;
}) {
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
        <span className="grid size-10 place-items-center rounded-lg bg-[#e7eef8] text-[#1e50a0]">
          {icon}
        </span>
      </div>
      {bar ? (
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
