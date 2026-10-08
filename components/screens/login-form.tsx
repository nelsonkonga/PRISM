"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

type Mode = "login" | "signup" | "reset" | "choose";

export function LoginForm() {
  const { ready, user, recovery, login, register, resetPassword, updatePassword } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  const shown: Mode = recovery ? "choose" : mode;

  useEffect(() => {
    if (ready && user && !recovery) router.replace("/tableau-de-bord");
  }, [ready, user, router, recovery]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    const result =
      shown === "signup"
        ? await register({ name, establishment, email, password, remember })
        : shown === "reset"
          ? await resetPassword(email)
          : shown === "choose"
            ? await updatePassword(password)
            : await login(email, password, remember);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.info) {
      setInfo(result.info);
      if (shown === "reset" || shown === "choose") {
        setMode("login");
        setPassword("");
      }
      return;
    }
    router.push("/tableau-de-bord");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f3f6fb] px-4 py-10">
      <div className="pointer-events-none absolute size-[500px] rounded-full bg-[#1e50a0]/15 blur-3xl" />
      <div className="relative w-full max-w-[440px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={60} withWord={false} />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#1e50a0]">PRISM</h1>
          <p className="mt-2 text-sm text-muted-foreground">L’espace de correction de votre établissement.</p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl bg-white p-8 shadow-[0_12px_40px_rgba(18,35,60,0.08)] ring-1 ring-[#d5e0ee]"
        >
          <div className="mb-5 flex gap-2 text-sm">
            {(
              [
                ["login", "Connexion"],
                ["signup", "Créer un compte"],
                ["reset", "Mot de passe oublié"],
                ...(shown === "choose" ? [["choose", "Nouveau mot de passe"] as const] : []),
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={shown === id ? "font-semibold text-[#1e50a0]" : "text-muted-foreground"}
                onClick={() => {
                  setMode(id);
                  setError("");
                  setInfo("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {shown === "signup" ? (
            <div className="space-y-3">
              <Field label="Nom" value={name} onChange={setName} autoComplete="name" />
              <Field label="Établissement" value={establishment} onChange={setEstablishment} autoComplete="organization" />
            </div>
          ) : null}
          {shown !== "choose" ? (
            <div className={shown === "signup" ? "mt-3" : ""}>
              <Field label="Adresse email" value={email} onChange={setEmail} type="email" autoComplete="username" />
            </div>
          ) : null}
          {shown !== "reset" ? (
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="password">{shown === "choose" ? "Nouveau mot de passe" : "Mot de passe"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={shown === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 pr-12"
              />
              <button
                type="button"
                className="absolute top-0 right-0 grid h-11 w-11 place-items-center text-muted-foreground"
                aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShow((value) => !value)}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Un lien est envoyé à cette adresse s’il existe un compte.</p>
          )}
          {shown === "login" ? (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked)} />
              Se souvenir sur cet appareil
            </label>
          ) : null}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {info ? <p className="mt-3 text-sm text-emerald-700">{info}</p> : null}
          <Button type="submit" className="mt-6 h-12 w-full text-base" disabled={pending}>
            {pending ? "Vérification…" : shown === "signup" ? "Créer le compte" : shown === "reset" ? "Envoyer le lien" : shown === "choose" ? "Enregistrer" : "Se connecter"}
            <ArrowRight />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Le compte, les sessions et les fichiers sont enregistrés dans Supabase.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-11" type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
