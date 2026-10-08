"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { defaultSettings, mathQuestions, seedSessions, teacher } from "@/lib/data";
import type { Draft, Session, Settings, User } from "@/lib/types";

const KEY = "prism-v1";

type Persisted = {
  user: User | null;
  sessions: Session[];
  settings: Settings;
};

type Store = Persisted & {
  ready: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createSession: (draft: Draft) => string;
  patchSession: (id: string, recipe: (session: Session) => Session) => void;
};

const StoreContext = createContext<Store | null>(null);

const initial: Persisted = {
  user: null,
  sessions: seedSessions,
  settings: defaultSettings,
};

const listeners = new Set<() => void>();
let current = initial;

function load(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed.sessions || !parsed.settings) return null;
    return parsed;
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  current = load() ?? initial;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClient() {
  return current;
}

function getServer() {
  return initial;
}

function emit(next: Persisted) {
  current = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribeReady() {
  return () => {};
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const state = useSyncExternalStore(subscribe, getClient, getServer);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      ready,
      login: (email) =>
        emit({
          ...getClient(),
          user: { ...teacher, email },
        }),
      logout: () => emit({ ...getClient(), user: null }),
      updateSettings: (patch) =>
        emit({
          ...getClient(),
          settings: { ...getClient().settings, ...patch },
        }),
      createSession: (draft) => {
        const parsedDate = new Date(draft.date);
        const date = Number.isNaN(parsedDate.getTime())
          ? draft.date
          : parsedDate.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
        const id = `session-${Date.now()}`;
        const copies = Array.from({ length: draft.copyCount }, (_, index) => ({
          id: `${id}-c${index + 1}`,
          code: `Copie ${String(index + 1).padStart(2, "0")}`,
          student: `Élève ${index + 1}`,
          status: "attente" as const,
          score: null,
          max: 20,
          detail: "Dans la file",
        }));
        const maths = draft.subject.toLowerCase().includes("math");
        const session: Session = {
          id,
          title: draft.title,
          subject: draft.subject,
          className: draft.className,
          status: "preparation",
          date,
          copiesDone: 0,
          copiesTotal: draft.copyCount,
          average: null,
          mode: draft.mode,
          rigor: draft.rigor,
          validated: false,
          summary: `${draft.copyCount} copies · barème à valider`,
          questions: maths
            ? mathQuestions
            : [
                {
                  id: "g1",
                  title: "Question 1",
                  points: 10,
                  expected: "Réponse conforme au document de référence déposé.",
                  breakdown: [
                    { label: "Résultat", points: "6 pts" },
                    { label: "Justification", points: "4 pts" },
                  ],
                },
                {
                  id: "g2",
                  title: "Question 2",
                  points: 10,
                  expected: "Deuxième partie du corrigé, critères à affiner avec l’assistant.",
                  breakdown: [{ label: "Ensemble de la question", points: "10 pts" }],
                },
              ],
          copies,
          chat: [
            {
              id: "intro",
              role: "ai",
              text: `J’ai préparé le barème de « ${draft.title} » à partir de ${draft.supportName}. Vérifiez les critères avant de lancer les ${draft.copyCount} copies.`,
            },
          ],
        };
        emit({ ...getClient(), sessions: [session, ...getClient().sessions] });
        return id;
      },
      patchSession: (id, recipe) =>
        emit({
          ...getClient(),
          sessions: getClient().sessions.map((session) =>
            session.id === id ? recipe(session) : session,
          ),
        }),
    };
  }, [state, ready]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore doit être utilisé dans StoreProvider");
  return store;
}
