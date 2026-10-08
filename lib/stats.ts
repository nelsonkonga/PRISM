import type { Copy, Session } from "@/lib/types";

export const tiers = [
  { tier: "E", range: "< 8", test: (score: number) => score < 8 },
  { tier: "D", range: "8 – 10", test: (score: number) => score >= 8 && score < 10 },
  { tier: "C", range: "10 – 12", test: (score: number) => score >= 10 && score < 12 },
  { tier: "B", range: "12 – 15", test: (score: number) => score >= 12 && score < 15 },
  { tier: "A", range: "15 – 18", test: (score: number) => score >= 15 && score < 18 },
  { tier: "S", range: "18 – 20", test: (score: number) => score >= 18 },
];

export function onTwenty(copy: Copy) {
  if (copy.score === null || copy.max <= 0) return null;
  return (copy.score / copy.max) * 20;
}

export function gradedCopies(sessions: Session[]) {
  return sessions.flatMap((session) => session.copies).filter((copy) => copy.score !== null);
}

export function distribution(sessions: Session[]) {
  const scores = gradedCopies(sessions)
    .map(onTwenty)
    .filter((score): score is number => score !== null);
  const max = Math.max(1, ...tiers.map((tier) => scores.filter(tier.test).length));
  return tiers.map((tier) => {
    const count = scores.filter(tier.test).length;
    return { ...tier, count, height: scores.length ? Math.max(8, Math.round((count / max) * 100)) : 0 };
  });
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function summarizeScores(values: number[]) {
  if (!values.length) return { mean: null as number | null, median: null as number | null, deviation: null as number | null };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean: round1(mean), median: round1(median), deviation: round1(Math.sqrt(variance)) };
}

export function formatFr(value: number | null) {
  return value === null ? "—" : value.toLocaleString("fr-FR");
}
