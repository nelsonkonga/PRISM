"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";

const sections = [
  "Fournisseur",
  "Secours",
  "Modèle",
  "Données",
];

export function SettingsScreen() {
  const { settings, updateSettings } = useStore();
  const [showKey, setShowKey] = useState(false);
  const [section, setSection] = useState(sections[0]);
  const [testing, setTesting] = useState(false);

  const masked = `${settings.apiKey.slice(0, 16)}••••${settings.apiKey.slice(-4)}`;

  function testConnection() {
    setTesting(true);
    window.setTimeout(() => {
      const now = new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date());
      updateSettings({
        connection: "connecte",
        lastCheck: `${now} CEST`,
      });
      setTesting(false);
    }, 600);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Les modèles, la clé d’accès et le cloisonnement des copies. Rien n’est envoyé hors de cette démonstration.
          </p>
        </div>
        <p className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-[#d5e0ee]">
          Connexion {settings.connection === "connecte" ? "active" : "à vérifier"}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-auto lg:flex-col">
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={
                section === item
                  ? "rounded-lg bg-[#1e50a0] px-3 py-2 text-left text-sm text-white"
                  : "rounded-lg bg-white px-3 py-2 text-left text-sm ring-1 ring-[#d5e0ee]"
              }
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee] sm:p-6">
          {section === "Fournisseur" ? (
            <section>
              <h2 className="text-lg font-semibold">Fournisseur principal d&apos;inférence</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fournisseur</Label>
                  <p className="mt-2 rounded-lg border border-border px-3 py-2 text-sm">{settings.provider}</p>
                </div>
                <div>
                  <Label>Statut de connexion</Label>
                  <p className="mt-2 text-sm">
                    {settings.connection === "connecte" ? "Connecté" : "À vérifier"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="key">Clé API (Token d&apos;accès sécurisé)</Label>
                <div className="mt-2 flex gap-2">
                  <Input id="key" readOnly value={showKey ? settings.apiKey : masked} className="h-11 font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                    onClick={() => setShowKey((value) => !value)}
                  >
                    {showKey ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button type="button" className="h-11" onClick={testConnection} disabled={testing}>
                    {testing ? "Test…" : "Tester"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Dernière vérification cryptographique réussie le {settings.lastCheck}.
                </p>
              </div>
            </section>
          ) : null}

          {section === "Secours" ? (
            <section>
              <h2 className="text-lg font-semibold">Fournisseur de secours (Fallback)</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Bascule automatique en cas de rupture de quota, latence supérieure à 1200ms ou incident réseau.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fournisseur secondaire</Label>
                  <p className="mt-2 text-sm">{settings.fallbackProvider}</p>
                </div>
                <div>
                  <Label>Statut du relais</Label>
                  <p className="mt-2 text-sm">{settings.fallbackStatus}</p>
                </div>
              </div>
            </section>
          ) : null}

          {section === "Modèle" ? (
            <section>
              <h2 className="text-lg font-semibold">Modèle LLM d&apos;arbitrage pédagogique</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Moteur cognitif d&apos;interprétation qualitative des démonstrations mathématiques et formulations textuelles.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Modèle actif</Label>
                  <p className="mt-2 text-sm">{settings.model}</p>
                </div>
                <div>
                  <Label>Température d&apos;échantillonnage</Label>
                  <p className="mt-2 text-sm">{settings.temperature}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium">Calibration de la rigueur</p>
                <div className="mt-3 grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      key={index}
                      className={index < 5 ? "h-8 rounded-sm bg-[#1e50a0]" : "h-8 rounded-sm bg-[#d5e0ee]"}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Le cran 5, au centre, correspond à la rigueur standard utilisée sur les copies de mathématiques.
                </p>
              </div>
            </section>
          ) : null}

          {section === "Données" ? (
            <section>
              <h2 className="text-lg font-semibold">Préférences rapides et données</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Gestion du cloisonnement des données souveraines et de l&apos;impartialité des notations.
              </p>
              <div className="mt-4 space-y-3">
                <Toggle
                  title="Mode local strict"
                  text="L’inférence passe par l’instance de secours ONNX, sans appel au fournisseur principal."
                  checked={settings.localMode}
                  onChange={(localMode) => updateSettings({ localMode })}
                />
                <Toggle
                  title="Anonymisation automatique"
                  text="Les noms sont retirés des fichiers avant l’analyse. L’enseignant les retrouve seulement dans l’export."
                  checked={settings.anonymize}
                  onChange={(anonymize) => updateSettings({ anonymize })}
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
