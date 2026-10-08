import type {
  Copy,
  CopyStatus,
  Question,
  Session,
  SessionStatus,
  Settings,
  User,
  WorkBlock,
} from "@/lib/types";

export const teacher: User = {
  email: "claire.morel@etablissement.fr",
  name: "C. Morel",
  role: "Enseignant",
  establishment: "Lycée Jean Moulin",
};

export const defaultSettings: Settings = {
  provider: "Gemini API (Google Cloud Vertex)",
  connection: "connecte",
  apiKey: "sk-prism-ai-live-demo-9482",
  lastCheck: "24/05/2025 à 09:14 CEST",
  fallbackProvider: "Mistral OCR & Small (Instance locale ONNX)",
  fallbackStatus: "En veille",
  model: "Gemini 2.5 Pro (Raisonnement poussé & Mathématiques)",
  temperature: "0.1 (Déterministe et rigoureux)",
  localMode: false,
  anonymize: true,
};

export const mathQuestions: Question[] = [
  {
    id: "q1",
    title: "Question 1 — Système linéaire",
    points: 4,
    expected:
      "Résolution par substitution ou combinaison. Le couple solution est (x ; y) = (3 ; −1), vérifié dans les deux équations.",
    breakdown: [
      { label: "Choix et écriture de la méthode", points: "1 pt" },
      { label: "Calculs de substitution", points: "2 pts" },
      { label: "Vérification du couple", points: "1 pt" },
    ],
  },
  {
    id: "q2",
    title: "Question 2 — Dérivée et primitive",
    points: 8,
    expected:
      "Dérivée formelle exacte, ensemble de dérivabilité explicite. Primitive exacte, puis évaluation des bornes en conservant le signe de la borne inférieure.",
    breakdown: [
      { label: "Dérivée et domaine", points: "3 pts" },
      { label: "Primitive", points: "3 pts" },
      { label: "Évaluation des bornes", points: "2 pts" },
    ],
  },
  {
    id: "q3",
    title: "Question 3 — Asymptotes et analyse",
    points: 8,
    expected:
      "Factorisation du terme prépondérant, asymptotes identifiées et justifiées, conclusion rédigée jusqu’au bout.",
    breakdown: [
      { label: "Terme prépondérant", points: "3 pts" },
      { label: "Asymptotes justifiées", points: "3 pts" },
      { label: "Conclusion rédigée", points: "2 pts" },
    ],
    updatedByAi: true,
    aiNote:
      "Asymptote identifiée mais non justifiée : 0,5 pt au lieu de 0, pour ne pas confondre repérage et démonstration.",
  },
];

const paper: WorkBlock[] = [
  {
    title: "Exercice 1 — Système",
    lines: [
      { text: "{ 2x + y = 5  (L1)", mark: "Exact" },
      { text: "{ x − 3y = 6  (L2)", mark: "Exact" },
      { text: "⇒ 12 + 6y + y = 5 ⇒ 12 + 7y = 5", mark: "Exact" },
      { text: "⇒ y = −1, puis x = 3", mark: "Exact" },
    ],
    note: "Substitution menée depuis (L2). Le couple est revérifié dans (L1).",
  },
  {
    title: "Exercice 2 — Dérivée",
    lines: [
      { text: "f(x) = (2x − 1) e^x", mark: "Exact" },
      { text: "f′(x) = (2x + 1) e^x sur ℝ", mark: "Exact" },
    ],
  },
  {
    title: "Exercice 3 — Primitive",
    lines: [
      { text: "∫ de −1 à 2 de (2x + 1) dx = [x² + x] de −1 à 2", mark: "Exact" },
      { text: "= (4 + 2) − (1 − 1) = 6", mark: "Signe" },
    ],
    note: "La primitive est exacte. L’évaluation de la borne inférieure oublie le signe : (1) − (−1) et non (1 − 1).",
  },
  {
    title: "Exercice 4 — Asymptotes",
    lines: [
      { text: "f(x) = (x² + 1) / x = x + 1/x", mark: "Exact" },
      { text: "Asymptote oblique y = x, asymptote verticale x = 0", mark: "Exact" },
    ],
  },
  {
    title: "Exercice 5 — Analyse",
    lines: [
      { text: "On factorise le terme prépondérant…", mark: "Partiel" },
    ],
    note: "Le raisonnement s’arrête avant la conclusion sur la limite.",
  },
];

const criteria: Copy["criteria"] = [
  {
    id: "c1",
    title: "Système — substitution",
    comment:
      "Démarche rigoureuse, substitution bien menée, système résolu sans erreur.",
    score: "4 / 4",
    tone: "ok",
  },
  {
    id: "c2",
    title: "Dérivée",
    comment:
      "Dérivée formelle exacte, ensemble de dérivabilité explicitement mentionné.",
    score: "3 / 3",
    tone: "ok",
  },
  {
    id: "c3",
    title: "Primitive et bornes",
    comment:
      "Primitive exacte mais erreur de signe sur l'évaluation de la borne inférieure (-1 pt).",
    score: "3 / 4",
    tone: "warn",
  },
  {
    id: "c4",
    title: "Asymptotes",
    comment:
      "Factorisation du terme prépondérant impeccable, asymptotes identifiées.",
    score: "4 / 4",
    tone: "ok",
  },
  {
    id: "c5",
    title: "Analyse de limite",
    comment:
      "Début d'analyse prometteur mais raisonnement interrompu avant la conclusion.",
    score: "2 / 5",
    tone: "partial",
  },
];

function gradedCopy(partial: Omit<Copy, "max"> & { max?: number }): Copy {
  return { max: 20, ...partial };
}

export const featuredCopy: Copy = gradedCopy({
  id: "c07",
  code: "Copie 07",
  student: "L. Martin",
  status: "en_cours",
  score: 16,
  blocks: paper,
  criteria,
  appreciation:
    "Très bonne copie dans l'ensemble. La rédaction est soignée et les étapes logiques sont bien posées. Attention au calcul des intégrales avec bornes négatives.",
  advice: [
    "Revoir l’évaluation d’une primitive lorsque la borne inférieure est négative.",
    "Mener l’analyse jusqu’à la conclusion : une factorisation juste ne remplace pas la limite écrite.",
  ],
  analysisSeconds: 1.4,
  detail: "Relecture du signe",
});

export const seedSessions: Session[] = [
  {
    id: "ds-term",
    title: "Devoir surveillé n°2",
    subject: "Mathématiques",
    className: "Terminale spécialité",
    status: "terminee",
    date: "12 mai 2025",
    copiesDone: 28,
    copiesTotal: 28,
    average: 13.4,
    mode: "equivalent",
    rigor: 5,
    validated: true,
    summary: "28 copies · moyenne 13,4",
    questions: mathQuestions,
    copies: [],
    chat: [],
  },
  {
    id: "bac-blanc",
    title: "Bac blanc — Spécialité maths",
    subject: "Mathématiques",
    className: "Terminale spécialité",
    status: "en_cours",
    date: "2 juin 2025",
    copiesDone: 12,
    copiesTotal: 27,
    average: null,
    mode: "equivalent",
    rigor: 5,
    validated: true,
    summary: "12 / 27 copies · 44 %",
    questions: mathQuestions,
    chat: [
      {
        id: "m1",
        role: "ai",
        text: "J’ai lu le corrigé et préparé trois questions, pour 20 points. La question 3 ne distinguait pas une asymptote repérée d’une asymptote justifiée. Je propose un critère intermédiaire.",
      },
      {
        id: "m2",
        role: "user",
        text: "Ajoute un demi-point si l’asymptote est identifiée mais non justifiée.",
      },
      {
        id: "m3",
        role: "ai",
        text: "Critère ajouté à la question 3. Le total reste sur 20 : le demi-point est pris sur la justification, pas ajouté au barème.",
      },
    ],
    copies: [
      featuredCopy,
      gradedCopy({
        id: "c03",
        code: "Copie 03",
        student: "A. Bernard",
        status: "haute",
        score: 18,
        detail: "Démarche complète",
        appreciation:
          "Copie solide, justifications présentes jusqu’à la conclusion.",
        criteria: criteria.map((item) =>
          item.id === "c3" || item.id === "c5"
            ? { ...item, tone: "ok" as const, score: item.id === "c5" ? "5 / 5" : "4 / 4", comment: "Critère entièrement satisfait." }
            : item,
        ),
      }),
      gradedCopy({
        id: "c11",
        code: "Copie 11",
        student: "N. Diallo",
        status: "normale",
        score: 13,
        detail: "Calculs justes, rédaction courte",
        appreciation: "Les résultats sont justes. Les domaines et les conclusions restent trop elliptiques.",
      }),
      gradedCopy({
        id: "c18",
        code: "Copie 18",
        student: "S. Nguyen",
        status: "attente",
        score: null,
        detail: "Dans la file",
      }),
      gradedCopy({
        id: "c21",
        code: "Copie 21",
        student: "I. Rossi",
        status: "attente",
        score: null,
        detail: "Dans la file",
      }),
      gradedCopy({
        id: "c09",
        code: "Copie 09",
        student: "M. Cohen",
        status: "erreur",
        score: null,
        detail: "Scan tronqué, OCR bloqué",
      }),
    ],
  },
  {
    id: "controle-premiere",
    title: "Contrôle commun",
    subject: "Mathématiques",
    className: "Première spécialité",
    status: "preparation",
    date: "28 mai 2025",
    copiesDone: 0,
    copiesTotal: 32,
    average: null,
    mode: "strict",
    rigor: 6,
    validated: false,
    summary: "Barème à valider · 32 copies déposées",
    questions: mathQuestions,
    copies: [],
    chat: [
      {
        id: "p1",
        role: "ai",
        text: "Le corrigé est indexé. Vérifiez les critères avant d’ouvrir la file : aucune copie n’est encore notée.",
      },
    ],
  },
  {
    id: "anglais-ce",
    title: "Compréhension écrite",
    subject: "Anglais",
    className: "Terminale LVC",
    status: "preparation",
    date: "4 juin 2025",
    copiesDone: 0,
    copiesTotal: 18,
    average: null,
    mode: "equivalent",
    rigor: 4,
    validated: false,
    summary: "18 copies importées · barème en préparation",
    questions: [
      {
        id: "a1",
        title: "Question 1 — Compréhension globale",
        points: 8,
        expected: "Idée directrice du texte restituée sans contresens.",
        breakdown: [
          { label: "Idée principale", points: "5 pts" },
          { label: "Nuance de l’auteur", points: "3 pts" },
        ],
      },
      {
        id: "a2",
        title: "Question 2 — Expression",
        points: 12,
        expected: "Réponse personnelle appuyée sur deux arguments du texte.",
        breakdown: [
          { label: "Appui sur le texte", points: "6 pts" },
          { label: "Correction de la langue", points: "6 pts" },
        ],
      },
    ],
    copies: [],
    chat: [
      {
        id: "a0",
        role: "ai",
        text: "Pour l’anglais, le mode équivalent accepte une reformulation fidèle. Le mode strict exige les formulations du corrigé.",
      },
    ],
  },
];

export const histogram = [
  { tier: "E", range: "< 8", count: 6, height: 22 },
  { tier: "D", range: "8 – 10", count: 11, height: 41 },
  { tier: "C", range: "10 – 12", count: 21, height: 76 },
  { tier: "B", range: "12 – 15", count: 28, height: 100 },
  { tier: "A", range: "15 – 18", count: 16, height: 59 },
  { tier: "S", range: "18 – 20", count: 7, height: 27 },
];

export const statusLabel: Record<SessionStatus | CopyStatus, string> = {
  terminee: "Terminée",
  en_cours: "En cours",
  preparation: "Préparation",
  haute: "Note haute",
  normale: "Notée",
  attente: "En attente",
  erreur: "Bloquée",
};
