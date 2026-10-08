"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { sessionStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { SessionStatus } from "@/lib/types";
import { cn } from "cn";

const filters: { id: "toutes" | SessionStatus; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "en_cours", label: "En cours" },
  { id: "preparation", label: "Préparation" },
  { id: "terminee", label: "Terminées" },
];

export function SessionList() {
  const { sessions, deleteSession } = useStore();
  const params = useSearchParams();
  const historique = params.get("vue") === "historique";
  const [filter, setFilter] = useState<"toutes" | SessionStatus>(
    historique ? "terminee" : "toutes",
  );
  const [scope, setScope] = useState(historique);
  if (scope !== historique) {
    setScope(historique);
    setFilter(historique ? "terminee" : "toutes");
  }

  const visible = useMemo(
    () => sessions.filter((session) => filter === "toutes" || session.status === filter),
    [sessions, filter],
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {historique ? "Historique" : "Sessions"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {historique
          ? "Les sessions déjà closes, avec leur moyenne et le nombre de copies traitées."
          : "Reprendre une file, valider un barème, ou ouvrir une session encore en préparation."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm ring-1 ring-[#d5e0ee]",
              filter === item.id ? "bg-[#1e50a0] text-white ring-[#1e50a0]" : "bg-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-[#d5e0ee]">
        {visible.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">Aucune session dans cette vue.</p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((session) => (
              <li key={session.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.subject} · {session.className} · {session.date}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{session.summary}</p>
                <span className="text-sm font-medium">{sessionStatusLabel[session.status]}</span>
                <button
                  type="button"
                  className="text-sm text-muted-foreground"
                  onClick={() => {
                    if (window.confirm(`Supprimer « ${session.title} » ?`)) deleteSession(session.id);
                  }}
                >
                  Supprimer
                </button>
                <Link
                  href={
                    session.status === "preparation" && !session.validated
                      ? `/sessions/${session.id}/corrige`
                      : `/sessions/${session.id}`
                  }
                  className="text-sm font-semibold text-[#1e50a0]"
                >
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
