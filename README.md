# FamilyHub 2

Version React + Supabase, prête pour Vercel.

## 1. Installer les outils

Installe Node.js, puis ouvre ce dossier dans Visual Studio Code.

Dans le Terminal :

```bash
npm install
npm run dev
```

## 2. Créer la base Supabase

1. Crée un projet Supabase.
2. Ouvre SQL Editor.
3. Colle le contenu de `supabase/schema.sql`.
4. Exécute le script.
5. Dans Project Settings > API, copie :
   - Project URL
   - anon public key

## 3. Configurer FamilyHub

Duplique `.env.example` et renomme la copie `.env`.

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Redémarre ensuite `npm run dev`.

## 4. Déployer sur Vercel

Importe ce dossier dans GitHub, puis importe le dépôt dans Vercel.
Ajoute les deux variables d’environnement dans Vercel avant le déploiement.

## Fonctions présentes

- connexion par lien magique;
- stockage sécurisé dans Supabase;
- ajout et suppression de dépenses;
- catégorisation automatique;
- budget mensuel;
- comparaison Nelson/Sofia;
- tableau de bord par mois;
- interface adaptée au téléphone.

## Étape suivante

Pour partager exactement le même budget entre deux comptes distincts, la prochaine version ajoutera une table `households` et des invitations familiales.
