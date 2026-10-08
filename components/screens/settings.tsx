"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { testGemini } from "@/lib/gemini";
import { useStore } from "@/lib/store";

const sections = ["Fournisseur", "Moteur", "Modèle", "Données"];

export function SettingsScreen() {
  const { settings, updateSettings, eraseAccount } = useStore();
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [section, setSection] = useState(sections[0]);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  async function testConnection() {
    setTesting(true);
    setMessage("");
    try {
      const models = await testGemini(settings.apiKey.trim());
      const now = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
      updateSettings({ connection: "connecte", lastCheck: now });
      setMessage(models.length ? `Connexion établie. Modèles vus : ${models.slice(0, 4).join(", ")}.` : "Connexion établie. Aucun modèle listé.");
    } catch (error) {
      updateSettings({ connection: "a_verifier", lastCheck: "" });
      setMessage(error instanceof Error ? error.message : "Échec du test.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            La comparaison locale lit vos fichiers dans le navigateur. Gemini n’est appelé que si vous coupez ce mode et qu’une clé a été testée.
          </p>
        </div>
        <p className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-[#d5e0ee]">
          {settings.connection === "connecte" ? "Gemini vérifié" : "Gemini non vérifié"}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-auto lg:flex-col">
          {sections.map((item) => (
            <button key={item} type="button" onClick={() => setSection(item)} className={section === item ? "rounded-lg bg-[#1e50a0] px-3 py-2 text-left text-sm text-white" : "rounded-lg bg-white px-3 py-2 text-left text-sm ring-1 ring-[#d5e0ee]"}>
              {item}
            </button>
          ))}
        </nav>
        <div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#d5e0ee] sm:p-6">
          {section === "Fournisseur" ? (
            <section>
              <h2 className="text-lg font-semibold">{settings.provider}</h2>
              <p className="mt-2 text-sm text-muted-foreground">La clé est envoyée uniquement à Google, lors d’un test ou d’une correction Gemini.</p>
              <div className="mt-4">
                <Label htmlFor="key">Clé API Gemini</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="key"
                    className="h-11 font-mono text-xs"
                    type={showKey ? "text" : "password"}
                    value={settings.apiKey}
                    autoComplete="off"
                    onChange={(event) => updateSettings({ apiKey: event.target.value, connection: "a_verifier", lastCheck: "" })}
                  />
                  <Button type="button" variant="outline" className="h-11" aria-label={showKey ? "Masquer la clé" : "Afficher la clé"} onClick={() => setShowKey((value) => !value)}>
                    {showKey ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button type="button" className="h-11" onClick={() => void testConnection()} disabled={testing || settings.apiKey.trim().length < 10}>
                    {testing ? "Test…" : "Tester"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {settings.lastCheck ? `Dernier test réussi le ${settings.lastCheck}.` : "Aucun test réussi pour cette clé."}
                </p>
                {message ? <p className="mt-2 text-sm">{message}</p> : null}
              </div>
            </section>
          ) : null}
          {section === "Moteur" ? (
            <section>
              <h2 className="text-lg font-semibold">Comparaison locale</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chaque critère reçoit une part des points selon les mots du corrigé retrouvés dans la copie. La rigueur et le mode choisi à la session rendent cette part plus ou moins sévère. Aucun score n’est inventé si le fichier n’a pas de texte.
              </p>
              <div className="mt-4">
                <Toggle
                  title="Utiliser la comparaison locale"
                  text="Coupé, la file appelle Gemini avec la clé et le modèle indiqués."
                  checked={settings.localMode}
                  onChange={(localMode) => updateSettings({ localMode })}
                />
              </div>
            </section>
          ) : null}
          {section === "Modèle" ? (
            <section>
              <h2 className="text-lg font-semibold">Modèle Gemini</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <Label>Identifiant du modèle</Label>
                  <Input className="mt-2 h-11" value={settings.model} onChange={(event) => updateSettings({ model: event.target.value })} />
                </label>
                <label className="text-sm">
                  <Label>Température</Label>
                  <Input className="mt-2 h-11" type="number" min={0} max={1} step={0.1} value={settings.temperature} onChange={(event) => updateSettings({ temperature: event.target.value })} />
                </label>
              </div>
            </section>
          ) : null}
          {section === "Données" ? (
            <section>
              <h2 className="text-lg font-semibold">Données de ce navigateur</h2>
              <div className="mt-4 space-y-3">
                <Toggle
                  title="Anonymisation avant envoi"
                  text="Retire les lignes Nom, Prénom, Élève et les adresses email du texte envoyé à Gemini. Le nom de fichier reste visible ici."
                  checked={settings.anonymize}
                  onChange={(anonymize) => updateSettings({ anonymize })}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Effacer le compte, les sessions et les fichiers de ce navigateur ?")) {
                      void eraseAccount().then(() => router.replace("/"));
                    }
                  }}
                >
                  Effacer ce compte
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Toggle({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
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
