# PRISM

Correction de copies pour un établissement. L’enseignant crée un compte dans son navigateur, dépose un corrigé et des copies, vérifie le barème extrait du document, puis lance la file.

Deux moteurs existent :

- **Comparaison locale** : la part des mots du corrigé retrouvée dans chaque copie, modulée par la rigueur. Aucune note n’est écrite si le fichier n’a pas de texte.
- **Gemini** : appel réel à l’API Google AI, seulement si la comparaison locale est coupée et qu’une clé a été testée dans Paramètres.

Les comptes, fichiers et notes restent dans le navigateur (stockage local et IndexedDB). Un export CSV télécharge le relevé de la session.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Créez un compte : mot de passe d’au moins 8 caractères, et un code de récupération que vous choisissez.

## Parcours

1. Déposer un corrigé (PDF texte, `.txt`, ou image).
2. Choisir le mode et la rigueur, puis ajouter les copies. Chaque fichier peut être retiré avant le lancement.
3. Corriger le barème dans les champs, ou par une demande précise (« retire 1 pt sur Question 1 »).
4. Lancer la file, relire chaque note, la modifier, puis exporter le CSV.
