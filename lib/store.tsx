"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { deleteFile } from "@/lib/blobs";
import { defaultSettings } from "@/lib/labels";
import { setRemember, supabase, supabaseConfigured } from "@/lib/supabase";
import type { Copy, Question, Session, Settings, UploadedCopy, User } from "@/lib/types";

type Snapshot = {
  user: User | null;
  sessions: Session[];
  settings: Settings;
  syncError: string;
  recovery: boolean;
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

type Result = { ok: true; info?: string } | { ok: false; error: string };

type Store = Snapshot & {
  ready: boolean;
  register: (input: {
    name: string;
    establishment: string;
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<Result>;
  login: (email: string, password: string, remember: boolean) => Promise<Result>;
  resetPassword: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  logout: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createSession: (input: NewSession) => string;
  patchSession: (id: string, recipe: (session: Session) => Session) => void;
  deleteSession: (id: string) => void;
  eraseAccount: () => Promise<void>;
  readSession: (id: string) => Session | undefined;
};

const StoreContext = createContext<Store | null>(null);

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

function frenchAuth(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Adresse ou mot de passe incorrect.";
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Un compte existe déjà pour cette adresse.";
  }
  if (lower.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  return message;
}

const emptySnapshot = (): Snapshot => ({
  user: null,
  sessions: [],
  settings: { ...defaultSettings },
  syncError: "",
  recovery: false,
});

const serverSnapshot = emptySnapshot();
let snapshot = serverSnapshot;
let ready = false;
let userId: string | null = null;
let sessions: Session[] = [];
let settings: Settings = { ...defaultSettings };
let user: User | null = null;
let syncError = "";
let recovery = false;
let started = false;

const listeners = new Set<() => void>();

function emit() {
  snapshot = {
    user,
    sessions: sessions.map(decorate),
    settings,
    syncError,
    recovery,
  };
  listeners.forEach((listener) => listener());
}

function resetLocal() {
  userId = null;
  user = null;
  sessions = [];
  settings = { ...defaultSettings };
  syncError = "";
  recovery = false;
}

function fail(message: string) {
  syncError = message;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function subscribeReady(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function loadUser(authUser: AuthUser) {
  userId = authUser.id;
  const [profileResult, settingsResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("name, establishment, role").eq("id", authUser.id).maybeSingle(),
    supabase.from("settings").select("model, temperature, local_mode, anonymize, connection, last_check").eq("user_id", authUser.id).maybeSingle(),
    supabase.from("sessions").select("payload").eq("user_id", authUser.id).order("updated_at", { ascending: false }),
  ]);
  const problem = profileResult.error || settingsResult.error || sessionsResult.error;
  if (problem) {
    syncError = `Base Supabase : ${problem.message}`;
  } else {
    syncError = "";
  }
  const meta = authUser.user_metadata as { name?: string; establishment?: string };
  user = {
    email: authUser.email ?? "",
    name: profileResult.data?.name || meta.name || "",
    establishment: profileResult.data?.establishment || meta.establishment || "",
    role: profileResult.data?.role || "Enseignant",
  };
  const row = settingsResult.data;
  settings = row
    ? {
        provider: "Google AI Gemini",
        model: row.model,
        temperature: row.temperature,
        localMode: row.local_mode,
        anonymize: row.anonymize,
        connection: row.connection === "connecte" ? "connecte" : "a_verifier",
        lastCheck: row.last_check,
      }
    : { ...defaultSettings };
  sessions = (sessionsResult.data ?? []).map((item) => item.payload as Session);
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!supabaseConfigured) {
    syncError = "Les variables Supabase sont absentes de ce déploiement.";
    ready = true;
    emit();
    return;
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") recovery = true;
    if (!session) {
      resetLocal();
      ready = true;
      emit();
      return;
    }
    void loadUser(session.user).then(() => {
      ready = true;
      emit();
    });
  });
}

async function persistSession(session: Session) {
  if (!userId) return;
  const { error } = await supabase.from("sessions").upsert({
    id: session.id,
    user_id: userId,
    payload: session,
    updated_at: new Date().toISOString(),
  });
  if (error) fail(`Enregistrement de la session : ${error.message}`);
}

async function persistSettings(next: Settings) {
  if (!userId) return;
  const { error } = await supabase.from("settings").upsert({
    user_id: userId,
    model: next.model,
    temperature: next.temperature,
    local_mode: next.localMode,
    anonymize: next.anonymize,
    connection: next.connection,
    last_check: next.lastCheck,
  });
  if (error) fail(`Enregistrement des réglages : ${error.message}`);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const isReady = useSyncExternalStore(subscribeReady, () => ready, () => false);
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);

  useEffect(() => {
    start();
  }, []);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      ready: isReady,
      register: async (input) => {
        const email = input.email.trim().toLowerCase();
        const name = input.name.trim();
        const establishment = input.establishment.trim();
        if (!name || !establishment) return { ok: false, error: "Indiquez votre nom et l’établissement." };
        if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
          return { ok: false, error: "Indiquez une adresse email valide." };
        }
        if (input.password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
        setRemember(input.remember);
        const { data, error } = await supabase.auth.signUp({
          email,
          password: input.password,
          options: {
            data: { name, establishment },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) return { ok: false, error: frenchAuth(error.message) };
        if (!data.session || !data.user) {
          return { ok: true, info: "Confirmez l’adresse reçue par email, puis connectez-vous." };
        }
        await loadUser(data.user);
        ready = true;
        emit();
        return { ok: true };
      },
      login: async (emailValue, password, remember) => {
        setRemember(remember);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue.trim().toLowerCase(),
          password,
        });
        if (error || !data.user) return { ok: false, error: frenchAuth(error?.message || "Connexion impossible.") };
        await loadUser(data.user);
        ready = true;
        emit();
        return { ok: true };
      },
      resetPassword: async (emailValue) => {
        const email = emailValue.trim().toLowerCase();
        if (!email.includes("@")) return { ok: false, error: "Indiquez une adresse email valide." };
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) return { ok: false, error: frenchAuth(error.message) };
        return { ok: true, info: "Si un compte existe, un lien de réinitialisation vient d’être envoyé." };
      },
      updatePassword: async (password) => {
        if (password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { ok: false, error: frenchAuth(error.message) };
        recovery = false;
        emit();
        return { ok: true, info: "Mot de passe mis à jour." };
      },
      logout: () => {
        void supabase.auth.signOut();
      },
      updateSettings: (patch) => {
        settings = { ...settings, ...patch };
        emit();
        void persistSettings(settings);
      },
      createSession: (input) => {
        if (!userId) return "";
        const parsedDate = new Date(input.date);
        const date = Number.isNaN(parsedDate.getTime())
          ? input.date
          : parsedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        const id = crypto.randomUUID();
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
        const session = decorate({
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
              id: crypto.randomUUID(),
              role: "ai",
              text: input.supportText.trim()
                ? `J’ai découpé « ${input.supportName} » en ${input.questions.length} question${input.questions.length > 1 ? "s" : ""}. Vérifiez le texte attendu et les points avant de lancer les ${copies.length} copies.`
                : `« ${input.supportName} » ne contient pas de texte. Rédigez le barème dans le formulaire avant de lancer les ${copies.length} copies.`,
            },
          ],
          journal: [{ id: crypto.randomUUID(), text: `Session créée avec ${copies.length} fichier${copies.length > 1 ? "s" : ""}.` }],
        });
        sessions = [session, ...sessions];
        emit();
        void persistSession(session);
        return id;
      },
      patchSession: (id, recipe) => {
        sessions = sessions.map((session) => (session.id === id ? decorate(recipe(session)) : session));
        emit();
        const next = sessions.find((session) => session.id === id);
        if (next) void persistSession(next);
      },
      deleteSession: (id) => {
        const session = sessions.find((item) => item.id === id);
        if (session) {
          void deleteFile(session.supportFileId);
          session.copies.forEach((copy) => void deleteFile(copy.id));
        }
        sessions = sessions.filter((item) => item.id !== id);
        emit();
        void supabase.from("sessions").delete().eq("id", id).then(({ error }) => {
          if (error) fail(`Suppression : ${error.message}`);
        });
      },
      eraseAccount: async () => {
        await Promise.all(
          sessions.flatMap((session) => [deleteFile(session.supportFileId), ...session.copies.map((copy) => deleteFile(copy.id))]),
        );
        const { error } = await supabase.rpc("delete_own_account");
        if (error) fail(`Suppression du compte : ${error.message}`);
        await supabase.auth.signOut();
      },
      readSession: (id) => snapshot.sessions.find((session) => session.id === id),
    };
  }, [isReady, state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore doit être utilisé dans StoreProvider");
  return store;
}
