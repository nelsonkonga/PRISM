"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { cn } from "cn";

const steps = [
  { id: 1, label: "Identité" },
  { id: 2, label: "Épreuve" },
  { id: 3, label: "Support" },
  { id: 4, label: "Mode & rigueur" },
  { id: 5, label: "Copies" },
];

const empty: Draft = {
  title: "Contrôle commun n°4",
  subject: "Mathématiques",
  className: "Terminale spécialité",
  date: "2025-06-08",
  duration: "4 h",
  coefficient: "20",
  supportName: "Corrigé_DS4.pdf",
  mode: "equivalent",
  rigor: 5,
  copyCount: 24,
};

function rigorCopy(value: number) {
  if (value <= 3) {
    return "Clémence — les démarches équivalentes sont largement acceptées, une erreur de calcul isolée retire peu de points.";
  }
  if (value <= 6) {
    return "Standard — le barème validé s’applique tel quel. Une erreur de signe coûte le point prévu, pas la question entière.";
  }
  return "Sévérité — une justification manquante retire les points du critère, sans compensation entre les questions.";
}

export function Wizard() {
  const params = useSearchParams();
  const initialStep = Number(params.get("etape") || "1");
  const [step, setStep] = useState(initialStep >= 1 && initialStep <= 5 ? initialStep : 1);
  const [draft, setDraft] = useState<Draft>(empty);
  const [supportReady, setSupportReady] = useState(true);
  const { createSession, user } = useStore();
  const router = useRouter();

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function next() {
    if (step < 5) {
      setStep((value) => value + 1);
      return;
    }
    const id = createSession(draft);
    router.push(`/sessions/${id}/corrige`);
  }

  return (
    <div className="mx-auto w-full max-w-[880px]">
      <ol className="relative grid grid-cols-5 gap-2">
        <span className="absolute top-4 right-6 left-6 h-0.5 bg-[#d5e0ee]" />
        <span
          className="absolute top-4 left-6 h-0.5 bg-[#1e50a0]"
          style={{ width: `calc(${progress}% - 0px)` }}
        />
        {steps.map((item) => {
          const done = item.id < step;
          const active = item.id === step;
          return (
            <li key={item.id} className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm font-semibold",
                  active && "bg-[#1e50a0] text-white shadow",
                  done && "bg-white text-[#1e50a0] ring-2 ring-[#1e50a0]",
                  !active && !done && "bg-white text-muted-foreground ring-1 ring-[#d5e0ee]",
                )}
              >
                {done ? <Check className="size-4" /> : item.id}
              </span>
              <span className={cn("text-xs sm:text-sm", active ? "font-semibold" : "text-muted-foreground")}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <section className="mt-8 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee] sm:p-10">
        {step === 1 ? (
          <Fields
            kicker="Étape 1 — Qui corrige, et pour quelle classe"
            title="Identité de la session"
            text="Ces informations figurent sur les exports et séparent les files lorsque plusieurs enseignants partagent l’établissement."
          >
            <Field label="Intitulé" value={draft.title} onChange={(title) => patch({ title })} />
            <Field label="Classe" value={draft.className} onChange={(className) => patch({ className })} />
            <Field label="Discipline" value={draft.subject} onChange={(subject) => patch({ subject })} />
            <p className="text-sm text-muted-foreground">
              Enseignant : {user?.name} · {user?.establishment}
            </p>
          </Fields>
        ) : null}

        {step === 2 ? (
          <Fields
            kicker="Étape 2 — Le cadre de l’épreuve"
            title="Épreuve"
            text="La durée et le coefficient servent à calibrer le temps d’analyse et le poids de chaque question."
          >
            <Field label="Date" type="date" value={draft.date} onChange={(date) => patch({ date })} />
            <Field label="Durée" value={draft.duration} onChange={(duration) => patch({ duration })} />
            <Field
              label="Total du barème"
              value={draft.coefficient}
              onChange={(coefficient) => patch({ coefficient })}
            />
          </Fields>
        ) : null}

        {step === 3 ? (
          <Fields
            kicker="Étape 3 — Le document de référence"
            title="Support"
            text="Le corrigé, le sujet ou une grille déjà rédigée. L’assistant s’en sert pour proposer les critères, il ne note rien tant que vous n’avez pas validé."
          >
            <button
              type="button"
              onClick={() => setSupportReady(true)}
              className="rounded-xl border border-dashed border-[#1e50a0]/40 bg-[#f3f6fb] px-4 py-8 text-sm"
            >
              {supportReady
                ? `${draft.supportName} est prêt. Cliquez pour confirmer le dépôt.`
                : "Déposer un PDF de corrigé"}
            </button>
            <Field
              label="Nom du fichier"
              value={draft.supportName}
              onChange={(supportName) => patch({ supportName })}
            />
          </Fields>
        ) : null}

        {step === 4 ? (
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="rounded-full bg-[#e7eef8] px-2 py-0.5 text-xs font-medium text-[#1e50a0]">
                Assistant PRISM
              </span>
              <span className="mx-2">·</span>
              Rigueur {draft.rigor}/10
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Étape 4 — Mode de correction & Niveau de rigueur
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configurez l’alignement pédagogique du modèle d’évaluation et définissez la sévérité du barème pour assurer l’équité inter-copies.
            </p>
            <div className="mt-6 flex items-end justify-between gap-3">
              <h2 className="text-base font-semibold">Mode de correction</h2>
              <p className="text-xs text-muted-foreground">Un seul mode pour toute la session</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <ModeCard
                selected={draft.mode === "strict"}
                title="Aligné sur le corrigé"
                text="Le modèle s’aligne strictement sur votre document de référence. Aucune interprétation alternative n’est accordée sans pénalité."
                foot="Utile pour un QCM ou une rédaction très normée."
                onClick={() => patch({ mode: "strict" })}
              />
              <ModeCard
                selected={draft.mode === "equivalent"}
                title="Chemins équivalents"
                text="L’IA analyse l’épreuve, détecte les chemins de résolution équivalents et génère une matrice critériée que vous validez préalablement."
                foot="Recommandé pour les mathématiques."
                onClick={() => patch({ mode: "equivalent" })}
              />
            </div>
            <h2 className="mt-8 text-base font-semibold">Niveau de rigueur</h2>
            <div className="mt-4 rounded-xl bg-[#f3f6fb] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>0 · clément</span>
                <span className="font-semibold text-[#1e50a0]">{draft.rigor}/10</span>
                <span>10 · sévère</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[draft.rigor]}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value;
                  patch({ rigor: next });
                }}
              />
              <p className="mt-3 text-sm leading-6">{rigorCopy(draft.rigor)}</p>
            </div>
            <details className="mt-4 rounded-lg border border-border px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">Réglages avancés</summary>
              <p className="mt-2 text-muted-foreground">
                Température du modèle fixée à 0,1 pour cette session. L’anonymisation des copies suit le réglage général, modifiable dans Paramètres.
              </p>
            </details>
          </div>
        ) : null}

        {step === 5 ? (
          <Fields
            kicker="Étape 5 — La pile à traiter"
            title="Copies"
            text="Les fichiers restent en attente tant que le barème n’est pas confirmé. Vous pourrez en retirer avant le lancement."
          >
            <label className="block text-sm font-medium">
              Nombre de copies
              <Input
                className="mt-1.5 h-11"
                type="number"
                min={1}
                max={80}
                value={draft.copyCount}
                onChange={(event) => patch({ copyCount: Number(event.target.value) || 1 })}
              />
            </label>
            <ul className="max-h-48 divide-y divide-border overflow-auto rounded-lg border border-border">
              {Array.from({ length: Math.min(draft.copyCount, 6) }, (_, index) => (
                <li key={index} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>Copie {String(index + 1).padStart(2, "0")}.pdf</span>
                  <span className="text-muted-foreground">En attente</span>
                </li>
              ))}
            </ul>
            {draft.copyCount > 6 ? (
              <p className="text-xs text-muted-foreground">
                {draft.copyCount - 6} autres fichiers suivent la même file.
              </p>
            ) : null}
          </Fields>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? router.push("/tableau-de-bord") : setStep((value) => value - 1))}
          >
            <ChevronLeft />
            Retour
          </Button>
          <Button onClick={next}>
            {step === 5 ? "Valider le barème" : "Continuer"}
            <ChevronRight />
          </Button>
        </div>
      </section>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Brouillon · {user?.establishment} · Gemini 2.5 Pro · les copies ne partent pas tant que le barème n’est pas confirmé.
      </p>
    </div>
  );
}

function Fields({
  kicker,
  title,
  text,
  children,
}: {
  kicker: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium tracking-wide text-[#1e50a0] uppercase">{kicker}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input className="h-11" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ModeCard({
  selected,
  title,
  text,
  foot,
  onClick,
}: {
  selected: boolean;
  title: string;
  text: string;
  foot: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 text-left",
        selected ? "border-[#1e50a0] bg-[#f3f6fb] ring-2 ring-[#1e50a0]" : "border-border bg-white",
      )}
    >
      <span className="flex items-center gap-2 font-semibold">
        <span
          className={cn(
            "grid size-4 place-items-center rounded-full border",
            selected ? "border-[#1e50a0]" : "border-[#9aabbf]",
          )}
        >
          {selected ? <span className="size-2 rounded-full bg-[#1e50a0]" /> : null}
        </span>
        {title}
      </span>
      <span className="mt-3 block text-sm leading-6 text-muted-foreground">{text}</span>
      <span className="mt-3 block text-xs text-[#1e50a0]">{foot}</span>
    </button>
  );
}
