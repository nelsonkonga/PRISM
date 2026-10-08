import type { Session } from "@/lib/types";

function cell(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export function sessionCsv(session: Session) {
  const header = ["Fichier", "Élève", "Note", "Sur", "Source", "Appréciation", "Critères", "Conseils"];
  const rows = session.copies.map((copy) => [
    copy.fileName,
    copy.student,
    copy.score ?? "",
    copy.max,
    copy.source ?? "",
    copy.appreciation,
    copy.criteria.map((item) => `${item.title} ${item.awarded}/${item.max} — ${item.comment}`).join(" | "),
    copy.advice.join(" | "),
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(cell).join(";")).join("\n")}`;
}

export function downloadText(filename: string, content: string, mime: string) {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
