export function HelpScreen() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Aide</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        PRISM prépare la correction d’une épreuve. L’enseignant dépose le corrigé, choisit la rigueur, valide le barème, puis laisse la file traiter les copies une par une.
      </p>
      <ol className="mt-6 space-y-4">
        <li>
          <h2 className="font-semibold">1. Identité, épreuve, support</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            La classe, la date et le document de référence cadrent la session. Sans corrigé, l’assistant ne propose pas de critères.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">2. Mode et rigueur</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Le mode strict suit le document. Le mode équivalent accepte un autre chemin de résolution, à condition qu’il soit juste. La rigueur, de 0 à 10, fixe la sévérité commune à toutes les copies.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">3. Validation du barème</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            L’assistant peut ajouter un critère. Rien n’est noté tant que la case de confirmation n’est pas cochée.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">4. File et détail de copie</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Chaque copie reçoit une note sur 20, un commentaire par critère et des conseils de révision. Vous pouvez retirer un point ou valider la copie.
          </p>
        </li>
      </ol>
      <p className="mt-8 text-sm text-muted-foreground">
        Les fournisseurs affichés dans Paramètres — Gemini pour l’arbitrage, Mistral en secours local — décrivent l’architecture prévue. Cette démonstration ne contacte aucun de ces services.
      </p>
    </div>
  );
}
