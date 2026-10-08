import type { CopyStatus, SessionStatus } from "@/lib/types";

export const sessionStatusLabel: Record<SessionStatus, string> = {
  terminee: "Terminée",
  en_cours: "En cours",
  preparation: "Préparation",
};

export const copyStatusLabel: Record<CopyStatus, string> = {
  en_cours: "En cours",
  corrigee: "Notée",
  attente: "En attente",
  erreur: "Bloquée",
};

export const defaultSettings = {
  provider: "Google AI Gemini",
  connection: "a_verifier" as const,
  lastCheck: "",
  model: "gemini-3.8-flash",
  temperature: "0.1",
  localMode: false,
  anonymize: true,
};
