# PRISM

Correction de copies pour un établissement. L’enseignant crée un compte, dépose un corrigé et des copies, vérifie le barème extrait du document, puis lance la file.

Les comptes, sessions et fichiers sont dans Supabase. La correction par défaut appelle Gemini avec la clé du serveur. La comparaison locale reste disponible dans Paramètres : elle mesure la part du corrigé retrouvée dans la copie. Aucune note n’est écrite si le fichier n’a pas de texte, ni si Gemini échoue.

## Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
GEMINI_API_KEY=votre_clé_google
```

En local, placez-les dans `.env.local`. Sur Vercel, les mêmes noms suffisent. `GEMINI_API_KEY` n’est jamais envoyée au navigateur.

Avant le premier compte, ouvrez Supabase → SQL Editor et exécutez `supabase/schema.sql`. Cela crée les tables, les règles d’accès et le stockage privé `prism`.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Le mot de passe fait au moins 8 caractères. Si Supabase demande une confirmation, le lien arrive par email.

## Parcours

1. Déposer un corrigé (PDF texte, `.txt`, ou image).
2. Choisir le mode et la rigueur, puis ajouter les copies. Chaque fichier peut être retiré avant le lancement.
3. Corriger le barème dans les champs, ou par une demande précise (« retire 1 pt sur Question 1 »).
4. Lancer la file, relire chaque note, la modifier, puis exporter le CSV.
