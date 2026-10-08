# PRISM

Application de correction assistée pour un établissement. L’enseignant prépare une session, valide le barème avec l’assistant, puis relit chaque copie : note sur 20, critères et conseils de révision.

Les écrans reprennent le fichier Figma [PRISM](https://www.figma.com/design/AbFCJtnjqGwF5kh4P32KDy/PRISM) : connexion, tableau de bord, assistant de session, validation du corrigé, file de traitement, détail d’une copie, paramètres et aide. Le quota de lecture Figma du plan Starter a empêché d’exporter les rendus et le texte des calques simplement nommés « Text ». Les phrases présentes dans les noms de calques sont reprises telles quelles. Le reste du libellé suit la structure de ces écrans.

Aucune clé ni aucun modèle externe n’est appelé. La session reste dans le navigateur.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Pour entrer, utiliser une adresse du type `claire.morel@etablissement.fr` et un mot de passe d’au moins 4 caractères.

## Parcours

1. Tableau de bord : indicateurs, distribution des notes, sessions récentes.
2. Nouvelle session : identité, épreuve, support, mode et rigueur, copies.
3. Validation du corrigé : barème et assistant.
4. Espace de session : file, corrigé, barème, statistiques, journal.
5. Détail de copie : travail de l’élève et retour par critère.
6. Paramètres : fournisseur, secours, modèle, anonymisation.
