"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { hashSecret, normalizeEmail, verifySecret } from "@/lib/auth";
import { deleteFile } from "@/lib/blobs";
import { defaultSettings } from "@/lib/labels";
import type { Account, Copy, Question, Session, Settings, UploadedCopy, User } from "@/lib/types";

const DATA_KEY = "prism-v2";
const ACTIVE_KEY = "prism-active";

type Work = { sessions: Session[]; settings: Settings };

type Database = {
  accounts: Account[];
  work: Record<string, Work>;
  rememberedEmail: string | null;
};

type Snapshot = {
  user: User | null;
  sessions: Session[];
  settings: Settings;
};

type NewSession = {
  title: string;
  subject: string;
  className: string;
  date: string;
  duration: string;
  mode: "strict" | "equivalent";
  rigor: number;
  supportName: string;
  supportText: string;
  supportFileId: string;
  supportMime: string;
  questions: Question[];
  copies: UploadedCopy[];
};

type Result = { ok: true } | { ok: false; error: string };

type Store = Snapshot & {
  ready: boolean;
  register: (input: {
    name: string;
    establishment: string;
    email: string;
    password: string;
    recovery: string;
    remember: boolean;
  }) => Promise<Result>;
  login: (email: string, password: string, remember: boolean) => Promise<Result>;
  resetPassword: (email: string, recovery: string, password: string) => Promise<Result>;
  logout: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createSession: (input: NewSession) => string;
  patchSession: (id: string, recipe: (session: Session) => Session) => void;
  deleteSession: (id: string) => void;
  eraseAccount: () => Promise<void>;
  readSession: (id: string) => Session | undefined;
};

const StoreContext = createContext<Store | null>(null);

const emptyWork = (): Work => ({ sessions: [], settings: { ...defaultSettings } });

const initialDb: Database = { accounts: [], work: {}, rememberedEmail: null };

function activeEmail(db: Database) {
  if (typeof window === "undefined") return null;
  return db.rememberedEmail ?? window.sessionStorage.getItem(ACTIVE_KEY);
}

function decorate(session: Session): Session {
  const done = session.copies.filter((copy) => copy.score !== null);
  const copiesDone = done.length;
  const average = done.length
    ? Math.round((done.reduce((sum, copy) => sum + ((copy.score ?? 0) / copy.max) * 20, 0) / done.length) * 10) / 10
    : null;
  let status: Session["status"] = "preparation";
  if (session.validated) {
    const settled = session.copies.every((copy) => copy.score !== null || copy.status === "erreur");
    status = session.copies.length > 0 && settled && !session.autoGrade ? "terminee" : "en_cours";
  }
  const summary = session.validated
    ? `${copiesDone}/${session.copies.length} notées${average !== null ? ` · moyenne ${average.toLocaleString("fr-FR")}/20` : ""}`
    : `${session.copies.length} copies · barème à valider`;
  return {
    ...session,
    copiesDone,
    copiesTotal: session.copies.length,
    average,
    status,
    summary,
  };
}

function project(db: Database): Snapshot {
  const email = activeEmail(db);
  const account = db.accounts.find((item) => item.email === email);
  const work = email ? db.work[email] : undefined;
  return {
    user: account
      ? { email: account.email, name: account.name, role: account.role, establishment: account.establishment }
      : null,
    sessions: (work?.sessions ?? []).map(decorate),
    settings: work?.settings ?? { ...defaultSettings },
  };
}

function load(): Database {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return initialDb;
    const parsed = JSON.parse(raw) as Database;
    if (!Array.isArray(parsed.accounts) || !parsed.work) return initialDb;
    return parsed;
  } catch {
    return initialDb;
  }
}

const serverSnapshot = project(initialDb);
let db = initialDb;
let snapshot = serverSnapshot;
if (typeof window !== "undefined") {
  db = load();
  snapshot = project(db);
}

const listeners = new Set<() => void>();

function persist(next: Database) {
  db = next;
  snapshot = project(db);
  localStorage.setItem(DATA_KEY, JSON.stringify(db));
  listeners.forEach((listener) => listener());
}

function setActive(email: string | null, remember: boolean) {
  if (remember && email) {
    sessionStorage.removeItem(ACTIVE_KEY);
    return email;
  }
  if (email) sessionStorage.setItem(ACTIVE_KEY, email);
  else sessionStorage.removeItem(ACTIVE_KEY);
  return null;
}

function workOf(email: string) {
  return db.work[email] ?? emptyWork();
}

function saveWork(email: string, work: Work, rememberedEmail = db.rememberedEmail) {
  persist({ ...db, rememberedEmail, work: { ...db.work, [email]: work } });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function subscribeReady() {
  return () => {};
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      ready,
      register: async (input) => {
        const email = normalizeEmail(input.email);
        const name = input.name.trim();
        const establishment = input.establishment.trim();
        if (!name || !establishment) return { ok: false, error: "Indiquez votre nom et l’établissement." };
        if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
          return { ok: false, error: "Indiquez une adresse email valide." };
        }
        if (input.password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
        if (input.recovery.trim().length < 6) {
          return { ok: false, error: "Le code de récupération doit contenir au moins 6 caractères." };
        }
        if (db.accounts.some((account) => account.email === email)) {
          return { ok: false, error: "Un compte existe déjà pour cette adresse." };
        }
        const password = await hashSecret(input.password);
        const recovery = await hashSecret(input.recovery.trim());
        const account: Account = {
          email,
          name,
          establishment,
          role: "Enseignant",
          salt: password.salt,
          hash: password.hash,
          recoverySalt: recovery.salt,
          recoveryHash: recovery.hash,
        };
        const rememberedEmail = setActive(email, input.remember);
        persist({
          accounts: [...db.accounts, account],
          work: { ...db.work, [email]: emptyWork() },
          rememberedEmail,
        });
        return { ok: true };
      },
      login: async (emailValue, password, remember) => {
        const email = normalizeEmail(emailValue);
        const account = db.accounts.find((item) => item.email === email);
        if (!account || !(await verifySecret(password, account.salt, account.hash))) {
          return { ok: false, error: "Adresse ou mot de passe incorrect." };
        }
        const rememberedEmail = setActive(email, remember);
        persist({ ...db, rememberedEmail });
        return { ok: true };
      },
      resetPassword: async (emailValue, recovery, password) => {
        const email = normalizeEmail(emailValue);
        const account = db.accounts.find((item) => item.email === email);
        if (!account) return { ok: false, error: "Aucun compte pour cette adresse." };
        if (!(await verifySecret(recovery.trim(), account.recoverySalt, account.recoveryHash))) {
          return { ok: false, error: "Code de récupération incorrect." };
        }
        if (password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
        const next = await hashSecret(password);
        persist({
          ...db,
          accounts: db.accounts.map((item) =>
            item.email === email ? { ...item, salt: next.salt, hash: next.hash } : item,
          ),
        });
        return { ok: true };
      },
      logout: () => {
        setActive(null, false);
        persist({ ...db, rememberedEmail: null });
      },
      updateSettings: (patch) => {
        const email = state.user?.email;
        if (!email) return;
        const work = workOf(email);
        saveWork(email, { ...work, settings: { ...work.settings, ...patch } });
      },
      createSession: (input) => {
        const email = activeEmail(db);
        if (!email) return "";
        const parsedDate = new Date(input.date);
        const date = Number.isNaN(parsedDate.getTime())
          ? input.date
          : parsedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        const id = `session-${crypto.randomUUID()}`;
        const copies: Copy[] = input.copies.map((copy, index) => ({
          id: copy.id,
          code: `Copie ${String(index + 1).padStart(2, "0")}`,
          student: copy.student,
          fileName: copy.fileName,
          mime: copy.mime,
          text: copy.text,
          status: "attente",
          score: null,
          max: input.questions.reduce((sum, question) => sum + question.points, 0),
          detail: "Dans la file",
          source: null,
          criteria: [],
          appreciation: "",
          advice: [],
          analysisSeconds: null,
          error: "",
        }));
        const session: Session = decorate({
          id,
          title: input.title.trim(),
          subject: input.subject.trim(),
          className: input.className.trim(),
          status: "preparation",
          date,
          duration: input.duration.trim(),
          copiesDone: 0,
          copiesTotal: copies.length,
          average: null,
          mode: input.mode,
          rigor: input.rigor,
          validated: false,
          autoGrade: false,
          summary: "",
          supportName: input.supportName,
          supportText: input.supportText,
          supportFileId: input.supportFileId,
          supportMime: input.supportMime,
          questions: input.questions,
          copies,
          chat: [
            {
              id: `chat-${crypto.randomUUID()}`,
              role: "ai",
              text: input.supportText.trim()
                ? `J’ai découpé « ${input.supportName} » en ${input.questions.length} question${input.questions.length > 1 ? "s" : ""}. Vérifiez le texte attendu et les points avant de lancer les ${copies.length} copies.`
                : `« ${input.supportName} » ne contient pas de texte. Rédigez le barème dans le formulaire avant de lancer les ${copies.length} copies.`,
            },
          ],
          journal: [{ id: `j-${crypto.randomUUID()}`, text: `Session créée avec ${copies.length} fichier${copies.length > 1 ? "s" : ""}.` }],
        });
        const work = workOf(email);
        saveWork(email, { ...work, sessions: [session, ...work.sessions] });
        return id;
      },
      patchSession: (id, recipe) => {
        const email = activeEmail(db);
        if (!email) return;
        const work = workOf(email);
        saveWork(email, {
          ...work,
          sessions: work.sessions.map((session) => (session.id === id ? decorate(recipe(session)) : session)),
        });
      },
      deleteSession: (id) => {
        const email = activeEmail(db);
        if (!email) return;
        const work = workOf(email);
        const session = work.sessions.find((item) => item.id === id);
        if (session) {
          void deleteFile(session.supportFileId);
          session.copies.forEach((copy) => void deleteFile(copy.id));
        }
        saveWork(email, { ...work, sessions: work.sessions.filter((item) => item.id !== id) });
      },
      eraseAccount: async () => {
        const email = activeEmail(db);
        if (!email) return;
        const work = workOf(email);
        await Promise.all(
          work.sessions.flatMap((session) => [deleteFile(session.supportFileId), ...session.copies.map((copy) => deleteFile(copy.id))]),
        );
        setActive(null, false);
        const workNext = { ...db.work };
        delete workNext[email];
        persist({
          accounts: db.accounts.filter((account) => account.email !== email),
          work: workNext,
          rememberedEmail: null,
        });
      },
      readSession: (id) => snapshot.sessions.find((session) => session.id === id),
    };
  }, [ready, state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore doit être utilisé dans StoreProvider");
  return store;
}
