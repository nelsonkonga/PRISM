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

export function LoginForm() {
  const { ready, user, login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("claire.morel@etablissement.fr");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/tableau-de-bord");
  }, [ready, user, router]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
      setError("Indiquez l’adresse professionnelle de l’établissement.");
      return;
    }
    if (password.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    setError("");
    login(email.trim());
    router.push("/tableau-de-bord");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f3f6fb] px-4 py-10">
      <div className="pointer-events-none absolute size-[500px] rounded-full bg-[#1e50a0]/15 blur-3xl" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={60} withWord={false} />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#1e50a0]">PRISM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L’espace de correction de votre établissement.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl bg-white p-8 shadow-[0_12px_40px_rgba(18,35,60,0.08)] ring-1 ring-[#d5e0ee]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@etablissement.fr"
              className="h-11"
            />
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
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
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked)} />
              Se souvenir
            </label>
            <button
              type="button"
              className="text-[#1e50a0] hover:underline"
              onClick={() =>
                setHint(
                  "Dans cette démonstration, aucun email n’est envoyé. Choisissez un mot de passe d’au moins 4 caractères.",
                )
              }
            >
              Mot de passe oublié
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {hint ? <p className="mt-3 text-sm text-muted-foreground">{hint}</p> : null}
          <Button type="submit" className="mt-6 h-12 w-full text-base">
            Se connecter
            <ArrowRight />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accès réservé aux comptes de l’établissement.
        </p>
      </div>
    </div>
  );
}
