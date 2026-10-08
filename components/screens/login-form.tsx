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

type Mode = "login" | "signup" | "reset";

export function LoginForm() {
  const { ready, user, login, register, resetPassword } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/tableau-de-bord");
  }, [ready, user, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    const result =
      mode === "signup"
        ? await register({ name, establishment, email, password, recovery, remember })
        : mode === "reset"
          ? await resetPassword(email, recovery, password)
          : await login(email, password, remember);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (mode === "reset") {
      setMode("login");
      setPassword("");
      setInfo("Mot de passe mis à jour. Vous pouvez vous connecter.");
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
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={mode === id ? "font-semibold text-[#1e50a0]" : "text-muted-foreground"}
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
          {mode === "signup" ? (
            <div className="space-y-3">
              <Field label="Nom" value={name} onChange={setName} autoComplete="name" />
              <Field label="Établissement" value={establishment} onChange={setEstablishment} autoComplete="organization" />
            </div>
          ) : null}
          <div className={mode === "signup" ? "mt-3" : ""}>
            <Field label="Adresse email" value={email} onChange={setEmail} type="email" autoComplete="username" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="password">{mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
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
          {mode !== "login" ? (
            <div className="mt-3">
              <Field
                label="Code de récupération"
                value={recovery}
                onChange={setRecovery}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "signup"
                  ? "Choisissez-le maintenant : il sert à changer le mot de passe, il n’est pas envoyé par email."
                  : "Le code choisi à la création du compte."}
              </p>
            </div>
          ) : (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked)} />
              Se souvenir sur cet appareil
            </label>
          )}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {info ? <p className="mt-3 text-sm text-emerald-700">{info}</p> : null}
          <Button type="submit" className="mt-6 h-12 w-full text-base" disabled={pending}>
            {pending ? "Vérification…" : mode === "signup" ? "Créer le compte" : mode === "reset" ? "Mettre à jour" : "Se connecter"}
            <ArrowRight />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Le compte et les copies restent dans ce navigateur.
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
