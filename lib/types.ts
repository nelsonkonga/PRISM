export type SessionStatus = "terminee" | "en_cours" | "preparation";

export type CopyStatus = "en_cours" | "haute" | "normale" | "attente" | "erreur";

export type Criterion = {
  id: string;
  title: string;
  comment: string;
  score: string;
  tone: "ok" | "warn" | "partial";
};

export type WorkLine = {
  text: string;
  mark?: string;
};

export type WorkBlock = {
  title: string;
  lines: WorkLine[];
  note?: string;
};

export type Copy = {
  id: string;
  code: string;
  student: string;
  status: CopyStatus;
  score: number | null;
  max: number;
  detail?: string;
  blocks?: WorkBlock[];
  criteria?: Criterion[];
  appreciation?: string;
  advice?: string[];
  analysisSeconds?: number;
};

export type RubricRow = {
  label: string;
  points: string;
};

export type Question = {
  id: string;
  title: string;
  points: number;
  expected: string;
  breakdown: RubricRow[];
  updatedByAi?: boolean;
  aiNote?: string;
};

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

export type Session = {
  id: string;
  title: string;
  subject: string;
  className: string;
  status: SessionStatus;
  date: string;
  copiesDone: number;
  copiesTotal: number;
  average: number | null;
  mode: "strict" | "equivalent";
  rigor: number;
  validated: boolean;
  summary: string;
  questions: Question[];
  copies: Copy[];
  chat: ChatMessage[];
};

export type Settings = {
  provider: string;
  connection: "connecte" | "a_verifier";
  apiKey: string;
  lastCheck: string;
  fallbackProvider: string;
  fallbackStatus: string;
  model: string;
  temperature: string;
  localMode: boolean;
  anonymize: boolean;
};

export type User = {
  email: string;
  name: string;
  role: string;
  establishment: string;
};

export type Draft = {
  title: string;
  subject: string;
  className: string;
  date: string;
  duration: string;
  coefficient: string;
  supportName: string;
  mode: "strict" | "equivalent";
  rigor: number;
  copyCount: number;
};
