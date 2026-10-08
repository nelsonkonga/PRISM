export type SessionStatus = "terminee" | "en_cours" | "preparation";

export type CopyStatus = "en_cours" | "corrigee" | "attente" | "erreur";

export type GradeSource = "gemini" | "local" | "manuel";

export type Criterion = {
  id: string;
  title: string;
  comment: string;
  awarded: number;
  max: number;
};

export type Copy = {
  id: string;
  code: string;
  student: string;
  fileName: string;
  mime: string;
  text: string;
  status: CopyStatus;
  score: number | null;
  max: number;
  detail: string;
  source: GradeSource | null;
  criteria: Criterion[];
  appreciation: string;
  advice: string[];
  analysisSeconds: number | null;
  error: string;
};

export type RubricRow = {
  id: string;
  label: string;
  points: number;
};

export type Question = {
  id: string;
  title: string;
  points: number;
  expected: string;
  breakdown: RubricRow[];
};

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

export type JournalEntry = {
  id: string;
  text: string;
};

export type Session = {
  id: string;
  title: string;
  subject: string;
  className: string;
  status: SessionStatus;
  date: string;
  duration: string;
  copiesDone: number;
  copiesTotal: number;
  average: number | null;
  mode: "strict" | "equivalent";
  rigor: number;
  validated: boolean;
  autoGrade: boolean;
  summary: string;
  supportName: string;
  supportText: string;
  supportFileId: string;
  supportMime: string;
  questions: Question[];
  copies: Copy[];
  chat: ChatMessage[];
  journal: JournalEntry[];
};

export type Settings = {
  provider: string;
  connection: "connecte" | "a_verifier";
  apiKey: string;
  lastCheck: string;
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

export type Account = {
  email: string;
  name: string;
  role: string;
  establishment: string;
  salt: string;
  hash: string;
  recoverySalt: string;
  recoveryHash: string;
};

export type UploadedCopy = {
  id: string;
  fileName: string;
  mime: string;
  text: string;
  student: string;
};
