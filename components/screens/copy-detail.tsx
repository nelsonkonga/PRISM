"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { use, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFile } from "@/lib/blobs";
import { downloadBlob } from "@/lib/export";
import { copyStatusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Copy, Criterion, Session } from "@/lib/types";

const previews = new Map<string, Promise<string>>();

function previewOf(id: string) {
  const existing = previews.get(id);
  if (existing) return existing;
  const pending = getFile(id)
    .then((blob) => (blob ? URL.createObjectURL(blob) : ""))
    .catch(() => "");
  previews.set(id, pending);
  return pending;
}

export function CopyDetail() {
  const params = useParams<{ id: string; copyId: string }>();
  const { sessions } = useStore();
  const [notice, setNotice] = useState<{ copyId: string; text: string } | null>(null);
  const session = sessions.find((item) => item.id === params.id);
  const index = session?.copies.findIndex((copy) => copy.id === params.copyId) ?? -1;
  const copy = index >= 0 ? session?.copies[index] : undefined;
  if (!session || !copy) return <p>Cette copie n’est pas dans la session.</p>;
  const saved = notice?.copyId === copy.id ? notice.text : "";
  return (
    <Editor
      key={`${copy.id}:${copy.status}:${copy.score}:${copy.detail}`}
      session={session}
      copy={copy}
      index={index}
      saved={saved}
      onSaved={(text) => setNotice({ copyId: copy.id, text })}
    />
  );
}

function Editor({
  session,
  copy,
  index,
  saved,
  onSaved,
}: {
  session: Session;
  copy: Copy;
  index: number;
  saved: string;
  onSaved: (text: string) => void;
}) {
  const router = useRouter();
  const { patchSession } = useStore();
  const preview = use(previewOf(copy.id));
  const [student, setStudent] = useState(copy.student);
  const [criteria, setCriteria] = useState<Criterion[]>(copy.criteria);
  const [appreciation, setAppreciation] = useState(copy.appreciation);
  const [advice, setAdvice] = useState<string[]>(copy.advice);
  const [manualScore, setManualScore] = useState(copy.score === null ? "" : String(copy.score));
  const previous = index > 0 ? session.copies[index - 1] : null;
  const next = index < session.copies.length - 1 ? session.copies[index + 1] : null;
  const max = criteria.length ? criteria.reduce((sum, item) => sum + item.max, 0) : copy.max;
  const typed = manualScore === "" ? null : Number(manualScore);
  const score = criteria.length ? Math.round(criteria.reduce((sum, item) => sum + item.awarded, 0) * 2) / 2 : typed;
  const image = copy.mime.startsWith("image/");

  function save() {
    if (!criteria.length && (manualScore === "" || Number.isNaN(score))) {
      onSaved("Indiquez une note.");
      return;
    }
    patchSession(session.id, (current) => ({
      ...current,
      copies: current.copies.map((item) =>
        item.id === copy.id
          ? {
              ...item,
              student: student.trim() || item.student,
              criteria,
              appreciation,
              advice: advice.map((line) => line.trim()).filter(Boolean),
              score,
              max,
              status: "corrigee" as const,
              source: "manuel" as const,
              error: "",
              detail: "Note saisie par l’enseignant",
            }
          : item,
      ),
      journal: [{ id: `j-${crypto.randomUUID()}`, text: `${student || copy.student} : note saisie ${score}/${max}.` }, ...current.journal],
    }));
    onSaved("Note enregistrée.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#d5e0ee] sm:flex-row sm:items-center">
        <Link href={`/sessions/${session.id}`} className="inline-flex items-center gap-1 text-sm text-[#1e50a0]">
          <ChevronLeft className="size-4" />
          Toutes les copies
        </Link>
        <h1 className="text-lg font-semibold">{session.title}</h1>
        <span className="text-sm text-muted-foreground">{copyStatusLabel[copy.status]}</span>
        <p className="text-sm text-muted-foreground sm:ml-auto">{copy.fileName}{copy.score !== null ? ` · ${copy.score}/${copy.max}` : ""}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="flex min-h-[480px] flex-col rounded-xl bg-white ring-1 ring-[#d5e0ee]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Fichier déposé</h2>
            <button type="button" className="text-sm font-semibold text-[#1e50a0]" onClick={() => { void getFile(copy.id).then((blob) => { if (blob) downloadBlob(copy.fileName, blob); }); }}>
              Télécharger
            </button>
          </div>
          <div className="flex-1 bg-[#f7fafc] p-4 sm:p-6">
            {image && preview ? (
              // The address is a local blob URL of the file the teacher uploaded.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={copy.fileName} className="mx-auto max-h-[720px] rounded-lg bg-white shadow-sm" />
            ) : (
              <pre className="min-h-64 rounded-lg bg-white p-5 text-sm whitespace-pre-wrap shadow-sm">{copy.text || copy.error || "Aucun texte extrait. Saisissez la note à partir du fichier."}</pre>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Button variant="ghost" disabled={!previous} onClick={() => previous && router.push(`/sessions/${session.id}/copies/${previous.id}`)}>
              <ChevronLeft />
              Copie précédente
            </Button>
            <span className="text-sm text-muted-foreground">{index + 1} / {session.copies.length}</span>
            <Button variant="ghost" disabled={!next} onClick={() => next && router.push(`/sessions/${session.id}/copies/${next.id}`)}>
              Copie suivante
              <ChevronRight />
            </Button>
          </div>
        </section>
        <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee]">
          <div>
            <p className="text-sm text-muted-foreground">Élève, repris du nom de fichier</p>
            <Input className="mt-1 h-11" value={student} onChange={(event) => setStudent(event.target.value)} />
          </div>
          <p className="text-4xl font-semibold">{score !== null && Number.isFinite(score) ? score : "—"}<span className="text-xl font-normal text-muted-foreground"> / {max || copy.max}</span></p>
          {copy.detail && copy.detail !== copy.error ? <p className="text-sm text-muted-foreground">{copy.detail}</p> : null}
          {copy.error ? <p className="text-sm text-destructive">{copy.error}</p> : null}
          {criteria.length === 0 ? (
            <label className="block text-sm">
              Note
              <Input className="mt-1 h-11" type="number" min={0} step={0.5} value={manualScore} onChange={(event) => setManualScore(event.target.value)} />
            </label>
          ) : (
            <div className="space-y-3">
              {criteria.map((item) => (
                <article key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <Input className="h-9 w-24" type="number" min={0} max={item.max} step={0.5} value={item.awarded} onChange={(event) => setCriteria((current) => current.map((line) => line.id === item.id ? { ...line, awarded: Math.min(item.max, Number(event.target.value) || 0) } : line))} />
                  </div>
                  <Textarea className="mt-2" value={item.comment} onChange={(event) => setCriteria((current) => current.map((line) => line.id === item.id ? { ...line, comment: event.target.value } : line))} />
                </article>
              ))}
            </div>
          )}
          <label className="block text-sm">
            Appréciation
            <Textarea className="mt-1" value={appreciation} onChange={(event) => setAppreciation(event.target.value)} />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Conseils</p>
            {advice.map((line, lineIndex) => (
              <div key={`${lineIndex}-${line.slice(0, 8)}`} className="flex gap-2">
                <Input value={line} onChange={(event) => setAdvice((current) => current.map((item, itemIndex) => itemIndex === lineIndex ? event.target.value : item))} />
                <button type="button" aria-label="Retirer le conseil" onClick={() => setAdvice((current) => current.filter((_, itemIndex) => itemIndex !== lineIndex))}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setAdvice((current) => [...current, ""])}>
              <Plus />
              Conseil
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>Enregistrer la note</Button>
            <Button variant="outline" onClick={() => patchSession(session.id, (current) => ({ ...current, autoGrade: true, copies: current.copies.map((item) => item.id === copy.id ? { ...item, status: "attente", detail: "Replacée dans la file", error: "" } : item) }))}>
              Relancer l’analyse
            </Button>
          </div>
          {saved ? <p className="text-sm text-emerald-700">{saved}</p> : null}
        </section>
      </div>
    </div>
  );
}
