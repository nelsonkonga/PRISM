import type { Question, RubricRow } from "@/lib/types";

const STOP = new Set([
  "les", "des", "une", "dans", "pour", "avec", "sur", "par", "que", "qui", "est", "sont", "cette",
  "aux", "son", "ses", "leur", "plus", "pas", "nous", "vous", "elle", "ils", "elles", "comme",
  "tout", "tous", "fait", "etre", "ete", "the", "and", "from", "dont", "dans", "entre", "apres",
  "après", "avant", "sous", "vers", "chez", "donc", "alors", "ainsi", "aussi", "mais", "ou",
]);

export function tokens(text: string) {
  return [
    ...new Set(
      text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !STOP.has(word)),
    ),
  ];
}

function parseNumber(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function detectPoints(chunk: string) {
  const match = chunk.match(/(\d+(?:[.,]\d+)?)\s*(?:points?|pts)\b/i) ?? chunk.match(/\/\s*(\d+(?:[.,]\d+)?)\s*$/m);
  return match ? parseNumber(match[1]) : 0;
}

function detectRows(lines: string[], questionIndex: number): RubricRow[] {
  const rows: RubricRow[] = [];
  lines.forEach((line, index) => {
    const match = line.match(/^[-•*]\s*(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)?\s*$/i);
    if (!match) return;
    rows.push({ id: `r-${questionIndex}-${index}`, label: match[1].trim(), points: parseNumber(match[2]) });
  });
  return rows;
}

function emptyQuestion(totalPoints: number): Question {
  return {
    id: "q-1",
    title: "Question 1",
    points: totalPoints,
    expected: "",
    breakdown: [{ id: "r-1", label: "Ensemble de la question", points: totalPoints }],
  };
}

export function rubricFromText(text: string, totalPoints: number): Question[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [emptyQuestion(totalPoints)];
  const parts = clean
    .split(/\n(?=\s*(?:exercice|question|partie)\b)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks = parts.length > 1 ? parts : [clean];
  const parsed = chunks.map((chunk, index) => {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    const rows = detectRows(lines.slice(1), index);
    return {
      title: (lines[0] || `Question ${index + 1}`).slice(0, 140),
      points: detectPoints(chunk),
      rows,
      expected: (lines.slice(1).join("\n") || chunk).trim(),
    };
  });
  const known = parsed.reduce((sum, item) => sum + item.points, 0);
  const missing = parsed.filter((item) => item.points <= 0).length;
  const share = missing > 0 ? Math.round(((Math.max(totalPoints - known, 0) / missing) * 2)) / 2 : 0;
  return parsed.map((item, index) => {
    const points = item.points > 0 ? item.points : share || (parsed.length === 1 ? totalPoints : 0);
    const breakdown = item.rows.length
      ? item.rows
      : [{ id: `r-${index}-0`, label: "Ensemble de la question", points }];
    const sum = Math.round(breakdown.reduce((total, row) => total + row.points, 0) * 2) / 2;
    return {
      id: `q-${index + 1}`,
      title: item.title,
      points: sum,
      expected: item.expected,
      breakdown,
    };
  });
}

export function questionPoints(question: Question) {
  return Math.round(question.breakdown.reduce((sum, row) => sum + row.points, 0) * 2) / 2;
}

export function syncQuestion(question: Question): Question {
  return { ...question, points: questionPoints(question) };
}

function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}

export function coverage(expected: string, student: string) {
  const expectedTokens = tokens(expected);
  const studentTokens = new Set(tokens(student));
  if (expectedTokens.length < 3) {
    return { ratio: 0, missing: [] as string[], tooShort: true };
  }
  const missing = expectedTokens.filter((token) => !studentTokens.has(token));
  const ratio = (expectedTokens.length - missing.length) / expectedTokens.length;
  return { ratio, missing, tooShort: false };
}

export function adjustRatio(ratio: number, rigor: number, strict: boolean) {
  const gamma = strict ? 0.6 + rigor / 10 : 0.35 + rigor / 25;
  return Math.pow(ratio, gamma);
}

export type LocalGrade = {
  score: number;
  max: number;
  criteria: { id: string; title: string; comment: string; awarded: number; max: number }[];
  appreciation: string;
  advice: string[];
};

export function gradeLocal(input: {
  questions: Question[];
  studentText: string;
  rigor: number;
  strict: boolean;
}): LocalGrade | { error: string } {
  if (tokens(input.studentText).length < 3) {
    return { error: "Le fichier ne contient pas assez de texte pour être comparé au corrigé." };
  }
  const criteria: LocalGrade["criteria"] = [];
  const missingAll: string[] = [];
  for (const question of input.questions) {
    const compared = coverage(question.expected, input.studentText);
    if (compared.tooShort) {
      for (const row of question.breakdown) {
        criteria.push({
          id: `${question.id}-${row.id}`,
          title: row.label,
          comment: "Le texte de référence de cette question est trop court pour attribuer des points.",
          awarded: 0,
          max: row.points,
        });
      }
      continue;
    }
    const factor = adjustRatio(compared.ratio, input.rigor, input.strict);
    missingAll.push(...compared.missing);
    const comment =
      compared.missing.length === 0
        ? "Les éléments du corrigé pour cette question sont présents dans la copie."
        : `Éléments du corrigé absents : ${compared.missing.slice(0, 8).join(", ")}.`;
    for (const row of question.breakdown) {
      criteria.push({
        id: `${question.id}-${row.id}`,
        title: row.label,
        comment,
        awarded: roundHalf(row.points * factor),
        max: row.points,
      });
    }
  }
  const max = roundHalf(criteria.reduce((sum, item) => sum + item.max, 0));
  const score = roundHalf(Math.min(max, criteria.reduce((sum, item) => sum + item.awarded, 0)));
  const ratio = max > 0 ? score / max : 0;
  const appreciation =
    ratio >= 0.85
      ? "Les éléments attendus du corrigé sont en grande partie présents dans le texte de la copie."
      : ratio >= 0.5
        ? "La copie reprend une partie du corrigé. Les manques sont indiqués sur chaque critère."
        : "Peu d’éléments du corrigé ont été retrouvés dans le texte de la copie.";
  const advice = [...new Set(missingAll)].slice(0, 5);
  return {
    score,
    max,
    criteria,
    appreciation,
    advice: advice.length ? [`Revoir : ${advice.join(", ")}.`] : [],
  };
}

export function reviseRubric(questions: Question[], message: string): { questions: Question[]; reply: string } | null {
  const text = message.trim();
  const add = text.match(
    /ajoute(?:r)?\s+un\s+crit[eè]re\s+(.+?)\s+(?:de|pour)\s+(\d+(?:[.,]\d+)?)\s*pts?\s+(?:à|sur)\s+(?:la\s+)?question\s+(\d+)/i,
  );
  if (add) {
    const index = Number(add[3]) - 1;
    const question = questions[index];
    if (!question) return { questions, reply: `Il n’y a pas de question ${add[3]}.` };
    const points = parseNumber(add[2]);
    const next = questions.map((item, itemIndex) =>
      itemIndex === index
        ? syncQuestion({
            ...item,
            breakdown: [...item.breakdown, { id: `r-add-${Date.now()}`, label: add[1].trim(), points }],
          })
        : item,
    );
    return { questions: next, reply: `Critère « ${add[1].trim()} » ajouté à la question ${add[3]}, pour ${points} pts.` };
  }
  const remove = text.match(/retire(?:r)?\s+(\d+(?:[.,]\d+)?)\s*pts?\s+(?:à|sur)\s+(.+)/i);
  if (remove) {
    const amount = parseNumber(remove[1]);
    const target = remove[2].trim().toLowerCase();
    let changed = false;
    const next = questions.map((question) => {
      const titleHit = question.title.toLowerCase().includes(target);
      const breakdown = question.breakdown.map((row) => {
        if (!titleHit && !row.label.toLowerCase().includes(target)) return row;
        changed = true;
        return { ...row, points: Math.max(0, roundHalf(row.points - amount)) };
      });
      return syncQuestion({ ...question, breakdown });
    });
    if (!changed) return { questions, reply: `Aucun critère ne correspond à « ${remove[2].trim()} ».` };
    return { questions: next, reply: `${amount} pt retirés sur « ${remove[2].trim()} ». Le total a été recalculé.` };
  }
  const rename = text.match(/renomme(?:r)?\s+(?:la\s+)?question\s+(\d+)\s+en\s+(.+)/i);
  if (rename) {
    const index = Number(rename[1]) - 1;
    if (!questions[index]) return { questions, reply: `Il n’y a pas de question ${rename[1]}.` };
    const title = rename[2].trim();
    const next = questions.map((question, indexQuestion) =>
      indexQuestion === index ? { ...question, title } : question,
    );
    return { questions: next, reply: `La question ${rename[1]} s’appelle maintenant « ${title} ».` };
  }
  return null;
}
