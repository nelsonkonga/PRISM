export function HelpScreen() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Aide</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        PRISM note les copies à partir des fichiers que vous déposez. Rien n’est prérempli.
      </p>
      <ol className="mt-6 space-y-4">
        <li>
          <h2 className="font-semibold">1. Compte</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Le compte est créé dans ce navigateur. Le mot de passe fait au moins 8 caractères. Le code de récupération, choisi par vous, permet d’en définir un nouveau. « Se souvenir » garde la session après la fermeture de l’onglet.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">2. Corrigé et copies</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Déposez un PDF ou un texte. Les questions sont découpées sur Exercice, Question ou Partie, et les points sont lus dans le document. Une image ou un PDF sans texte reste visible : la note se saisit à la main.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">3. Deux moteurs</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            La comparaison locale mesure la part du corrigé retrouvée dans la copie, puis applique la rigueur. Gemini n’est contacté que si ce mode est coupé et qu’une clé a été enregistrée. Un échec laisse la copie en erreur, sans note de remplacement.
          </p>
        </li>
        <li>
          <h2 className="font-semibold">4. Relecture</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Sur chaque copie, la note, les commentaires et les conseils se modifient. L’export télécharge un CSV de la session. Supprimer une session retire aussi ses fichiers.
          </p>
        </li>
      </ol>
    </div>
  );
}
