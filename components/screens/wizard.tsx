"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { putFile } from "@/lib/blobs";
import { readUpload, studentFromFile } from "@/lib/files";
import { rubricFromText } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import type { UploadedCopy } from "@/lib/types";
import { cn } from "cn";

const steps = [
  { id: 1, label: "Identité" },
  { id: 2, label: "Épreuve" },
  { id: 3, label: "Support" },
  { id: 4, label: "Mode & rigueur" },
  { id: 5, label: "Copies" },
];

type Support = { name: string; text: string; fileId: string; mime: string };

export function Wizard() {
  const params = useSearchParams();
  const initialStep = Number(params.get("etape") || "1");
  const [step, setStep] = useState(initialStep >= 1 && initialStep <= 5 ? initialStep : 1);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [coefficient, setCoefficient] = useState("20");
  const [support, setSupport] = useState<Support | null>(null);
  const [imported, setImported] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [mode, setMode] = useState<"strict" | "equivalent">("equivalent");
  const [rigor, setRigor] = useState(5);
  const [copies, setCopies] = useState<UploadedCopy[]>([]);
  const [copyError, setCopyError] = useState("");
  const [error, setError] = useState("");
  const { createSession, user } = useStore();
  const router = useRouter();
  if (!imported && typeof window !== "undefined") {
    setImported(true);
    const raw = sessionStorage.getItem("prism-pending-support");
    if (raw) {
      sessionStorage.removeItem("prism-pending-support");
      try {
        const parsed = JSON.parse(raw) as Support;
        if (parsed?.fileId && parsed.name) {
          setSupport(parsed);
          if (!title) setTitle(parsed.name.replace(/\.[^.]+$/, ""));
        }
      } catch {
        setSupport(null);
      }
    }
  }

  const progress = ((step - 1) / 4) * 100;

  async function onSupport(file: File | undefined) {
    if (!file) return;
    setSupportError("");
    try {
      const extracted = await readUpload(file);
      const fileId = crypto.randomUUID();
      await putFile(fileId, file);
      setSupport({ name: file.name, text: extracted.text, fileId, mime: file.type || "application/octet-stream" });
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (reason) {
      setSupportError(reason instanceof Error ? reason.message : "Lecture impossible.");
    }
  }

  async function onCopies(list: FileList | null) {
    if (!list?.length) return;
    setCopyError("");
    const next: UploadedCopy[] = [];
    for (const file of list) {
      try {
        const extracted = await readUpload(file);
        const id = crypto.randomUUID();
        await putFile(id, file);
        next.push({ id, fileName: file.name, mime: file.type || "application/octet-stream", text: extracted.text, student: studentFromFile(file.name) });
      } catch (reason) {
        setCopyError(reason instanceof Error ? reason.message : "Un fichier n’a pas été lu.");
      }
    }
    setCopies((current) => [...current, ...next]);
  }

  function next() {
    setError("");
    if (step === 1 && (!title.trim() || !className.trim() || !subject.trim())) {
      setError("Renseignez l’intitulé, la classe et la discipline.");
      return;
    }
    if (step === 2 && (!date || !duration.trim() || Number(coefficient) <= 0)) {
      setError("Renseignez la date, la durée et un total de points supérieur à 0.");
      return;
    }
    if (step === 3 && !support) {
      setError("Déposez le corrigé, le sujet ou la grille.");
      return;
    }
    if (step < 5) {
      setStep((value) => value + 1);
      return;
    }
    if (!copies.length || !support) {
      setError("Déposez au moins une copie.");
      return;
    }
    const questions = rubricFromText(support.text, Number(coefficient) || 20);
    const id = createSession({
      title,
      subject,
      className,
      date,
      duration,
      mode,
      rigor,
      supportName: support.name,
      supportText: support.text,
      supportFileId: support.fileId,
      supportMime: support.mime,
      questions,
      copies,
    });
    router.push(`/sessions/${id}/corrige`);
  }

  return (
    <div className="mx-auto w-full max-w-[880px]">
      <ol className="relative grid grid-cols-5 gap-2">
        <span className="absolute top-4 right-6 left-6 h-0.5 bg-[#d5e0ee]" />
        <span className="absolute top-4 left-6 h-0.5 bg-[#1e50a0]" style={{ width: `calc(${progress}% )` }} />
        {steps.map((item) => {
          const done = item.id < step;
          const active = item.id === step;
          return (
            <li key={item.id} className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className={cn("grid size-8 place-items-center rounded-full text-sm font-semibold", active || done ? "bg-[#1e50a0] text-white" : "bg-white text-muted-foreground ring-1 ring-[#d5e0ee]")}>
                {done ? <Check className="size-4" /> : item.id}
              </span>
              <span className={cn("text-[11px] sm:text-xs", active ? "font-semibold text-[#1e50a0]" : "text-muted-foreground")}>{item.label}</span>
            </li>
          );
        })}
      </ol>

      <section className="mt-8 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee] sm:p-10">
        {step === 1 ? (
          <Fields kicker="Étape 1 — Qui corrige, et pour quelle classe" title="Identité de la session" text="Ces informations figurent sur l’export.">
            <Field label="Intitulé" value={title} onChange={setTitle} />
            <Field label="Classe" value={className} onChange={setClassName} />
            <Field label="Discipline" value={subject} onChange={setSubject} />
            <p className="text-sm text-muted-foreground">Enseignant : {user?.name} · {user?.establishment}</p>
          </Fields>
        ) : null}
        {step === 2 ? (
          <Fields kicker="Étape 2 — Le cadre de l’épreuve" title="Épreuve" text="Le total des points sert à répartir le barème quand le document ne les indique pas.">
            <Field label="Date" type="date" value={date} onChange={setDate} />
            <Field label="Durée" value={duration} onChange={setDuration} />
            <Field label="Total du barème" type="number" value={coefficient} onChange={setCoefficient} />
          </Fields>
        ) : null}
        {step === 3 ? (
          <Fields kicker="Étape 3 — Le document de référence" title="Support" text="PDF texte, fichier texte ou image. Seul le texte extrait sert à proposer le barème.">
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#1e50a0]/40 bg-[#f3f6fb] px-4 py-8 text-center text-sm">
              <input type="file" accept=".pdf,.txt,.md,text/plain,application/pdf,image/*" className="sr-only" onChange={(event) => void onSupport(event.target.files?.[0])} />
              {support ? support.name : "Choisir le corrigé"}
            </label>
            {support ? (
              <p className="text-sm text-muted-foreground">
                {support.text.trim() ? `${support.text.trim().split(/\s+/).length} mots extraits.` : "Aucun texte extrait : vous rédigerez le barème à l’étape suivante."}
              </p>
            ) : null}
            {support?.text ? <pre className="max-h-48 overflow-auto rounded-lg bg-[#f3f6fb] p-3 text-xs whitespace-pre-wrap">{support.text.slice(0, 2000)}</pre> : null}
            {supportError ? <p className="text-sm text-destructive">{supportError}</p> : null}
          </Fields>
        ) : null}
        {step === 4 ? (
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="rounded-full bg-[#e7eef8] px-2 py-0.5 text-xs font-medium text-[#1e50a0]">Assistant PRISM</span>
              <span className="mx-2">·</span>
              Rigueur {rigor}/10
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Étape 4 — Mode de correction & Niveau de rigueur</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Le mode et la rigueur changent la part de points attribuée quand le texte de la copie ne reprend pas tout le corrigé.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ModeCard selected={mode === "strict"} title="Aligné sur le corrigé" text="Une correspondance partielle retire davantage de points. Utile si la formulation attendue est fermée." foot="Comparaison stricte" onClick={() => setMode("strict")} />
              <ModeCard selected={mode === "equivalent"} title="Chemins équivalents" text="Les mêmes idées, écrites autrement, conservent plus de points. Utile pour une démonstration." foot="Comparaison souple" onClick={() => setMode("equivalent")} />
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Niveau de rigueur</span>
                <span>{rigor}/10</span>
              </div>
              <Slider className="mt-3" min={0} max={10} step={1} value={[rigor]} onValueChange={(value) => setRigor(Array.isArray(value) ? value[0] : value)} />
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {rigor <= 3 ? "Clémence : une couverture partielle du corrigé garde une grande part des points." : rigor <= 6 ? "Standard : la part de points suit de près la part du corrigé retrouvée." : "Sévérité : il faut retrouver presque tous les éléments du corrigé pour le total."}
              </p>
            </div>
          </div>
        ) : null}
        {step === 5 ? (
          <Fields kicker="Étape 5 — La pile à traiter" title="Copies" text="Chaque fichier déposé entre dans la file. Retirez ceux qui ne doivent pas être notés.">
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#1e50a0]/40 bg-[#f3f6fb] px-4 py-8 text-center text-sm">
              <input type="file" multiple accept=".pdf,.txt,.md,text/plain,application/pdf,image/*" className="sr-only" onChange={(event) => void onCopies(event.target.files)} />
              Ajouter des copies
            </label>
            {copies.length === 0 ? <p className="text-sm text-muted-foreground">Aucun fichier pour l’instant.</p> : null}
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {copies.map((copy) => (
                <li key={copy.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{copy.fileName}</span>
                    <span className="text-muted-foreground">{copy.text.trim() ? `${copy.text.trim().split(/\s+/).length} mots` : "Image ou PDF sans texte"}</span>
                  </span>
                  <button type="button" className="text-muted-foreground" aria-label={`Retirer ${copy.fileName}`} onClick={() => setCopies((current) => current.filter((item) => item.id !== copy.id))}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {copyError ? <p className="text-sm text-destructive">{copyError}</p> : null}
          </Fields>
        ) : null}
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button variant="outline" onClick={() => (step === 1 ? router.push("/tableau-de-bord") : setStep((value) => value - 1))}>
            <ChevronLeft />
            Retour
          </Button>
          <Button onClick={next}>
            {step === 5 ? "Préparer le barème" : "Continuer"}
            <ChevronRight />
          </Button>
        </div>
      </section>
    </div>
  );
}

function Fields({ kicker, title, text, children }: { kicker: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium tracking-wide text-[#1e50a0] uppercase">{kicker}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input className="h-11" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ModeCard({ selected, title, text, foot, onClick }: { selected: boolean; title: string; text: string; foot: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-xl border p-5 text-left", selected ? "border-[#1e50a0] bg-[#f3f6fb] ring-2 ring-[#1e50a0]" : "border-border bg-white")}>
      <span className="font-semibold">{title}</span>
      <span className="mt-3 block text-sm leading-6 text-muted-foreground">{text}</span>
      <span className="mt-3 block text-xs text-[#1e50a0]">{foot}</span>
    </button>
  );
}
