export type ReadKind = "text" | "pdf" | "image";

export async function readUpload(file: File): Promise<{ text: string; kind: ReadKind }> {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) {
    return { text: "", kind: "image" };
  }
  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return { text: (await file.text()).replace(/\u0000/g, "").trim(), kind: "text" };
  }
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(data);
    const result = await extractText(pdf, { mergePages: true });
    return { text: result.text.replace(/\u0000/g, "").trim(), kind: "pdf" };
  }
  throw new Error("Format non lu. Déposez un PDF, un fichier texte ou une image.");
}

export function studentFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "Copie";
}

export function anonymizeText(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[courriel]")
    .replace(/^\s*(nom|prénom|prenom|élève|eleve|candidat)\s*[:：].*$/gim, "[identité retirée]");
}
