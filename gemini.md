# IZI Facture - Fiche Technique & Guide de Référence

Ce document sert de guide de référence pour comprendre le fonctionnement global, l'architecture technique, les choix de design, la structure des fichiers et les consignes d'implémentation de la plateforme SaaS de facturation **IZI Facture**.

---

## 1. Présentation de l'Application

**IZI Facture** est une application web moderne (SaaS) conçue pour permettre aux entreprises de gérer facilement leurs clients, de concevoir et de suivre leurs factures en un clic.

### Fonctionnalités Clés :
* **Tableau de bord (Dashboard)** : Métriques globales simplifiées (Chiffre d'Affaires, factures payées, en attente, en retard), liste des dernières factures créées et raccourcis rapides. Les pourcentages d'estimations ou indicateurs de tendance en sont exclus.
* **Gestion des Clients** : Création, modification et suppression de clients. La suppression affiche une modale de confirmation personnalisée et vérifie s'il existe des factures orphelines. Le bouton d'ajout et la modale de formulaire sont conçus pour être pleinement responsives sur mobile (s'adaptent en hauteur et disposent d'un scroll vertical).
* **Gestion des Factures** :
  * Formulaire de création/édition couplé dynamiquement avec les paramètres généraux (préfixe, numéro suivant, taux de TVA, devise).
  * Incrémentation automatique du compteur dans les paramètres lors de l'enregistrement.
  * Bouton "Ajouter une ligne" d'articles positionné de manière ergonomique en bas du tableau.
* **Détail Facture (Fiche A4)** : 
  * Affiche le résumé de la facture dans un format papier imprimable.
  * Affichage dynamique du logo de l'entreprise (ou de l'initiale par défaut) et de la devise sélectionnée.
  * Terminology : `Destinataire` a été renommé définitivement en `Client`.
  * La colonne des articles a pour titre `Article / Service` (au lieu de `Description`).
  * Repositionnement du tampon de statut (**PAYÉ**, **BROUILLON**, etc.) en bas à gauche de la facture, à côté du bloc des totaux pour ne cacher aucun texte.
* **Paramètres (Settings)** :
  * Profil d'entreprise, coordonnées, identifiant fiscal (NIF).
  * Upload interactif du logo de l'entreprise (conversion et stockage Base64).
  * Sélection de la devise de l'entreprise (XOF, XAF, USD, EUR, etc.) avec formatage dynamique dans toute l'application.
  * Modale de succès personnalisée lors de l'enregistrement des modifications.

---

## 2. Stack Technique

L'application est construite avec des technologies modernes et légères :
* **Framework principal** : [Next.js](https://nextjs.org/) (App Router, version 14+)
* **Langage** : [TypeScript](https://www.typescriptlang.org/)
* **Styles & UI** : [Tailwind CSS](https://tailwindcss.com/) avec des composants épurés
* **Gestion d'état local** : [Zustand](https://github.com/pmndrs/zustand) (stores réactifs pour les clients, les factures et les paramètres)
* **Icônes** : [Lucide React](https://lucide.dev/)

---

## 3. Structure des Fichiers Clés

Voici l'organisation des répertoires de développement (`/src`) :

```text
src/
├── app/                           # Dossier de routage Next.js (App Router)
│   ├── (dashboard)/               # Groupe de routes protégées du dashboard
│   │   ├── clients/               # Page de gestion des clients
│   │   │   └── page.tsx           # Table responsive et modale de client
│   │   ├── dashboard/             # Page d'accueil (métriques et résumés)
│   │   │   └── page.tsx
│   │   ├── invoices/              # Page des factures
│   │   │   ├── page.tsx           # Liste des factures avec téléphone client
│   │   │   ├── new/               # Formulaire de création de facture
│   │   │   └── [id]/              # Détails et édition de factures
│   │   │       ├── page.tsx       # Fiche papier A4, tampon en bas, logo
│   │   │       └── edit/          # Formulaire d'édition de facture
│   │   ├── settings/              # Page des paramètres généraux
│   │   │   └── page.tsx           # Logo upload Base64 et devises
│   │   └── layout.tsx             # Disposition générale (Sidebar + Main)
│   ├── layout.tsx                 # Configuration racine (Métadonnées, polices)
│   └── page.tsx                   # Point d'entrée de redirection
├── components/                    # Composants réutilisables de l'UI
│   ├── dashboard/                 # Composants du dashboard (StatCard...)
│   ├── invoices/                  # Formulaire complexe (InvoiceForm.tsx)
│   ├── layout/                    # Éléments de structure (Sidebar, Topbar)
│   └── ui/                        # Composants d'interface atomiques (Badge...)
├── lib/                           # Services et modules utilitaires
│   ├── store/                     # Stores d'état Zustand
│   │   ├── clientStore.ts         # Données des clients
│   │   ├── invoiceStore.ts        # Données des factures et updateInvoiceStatus
│   │   └── settingsStore.ts       # Configuration d'entreprise (TVA, devises)
│   └── utils/
│       └── format.ts              # Formatage des dates et devises dynamiques
└── types/
    └── invoice.ts                 # Interfaces TypeScript globales
```

---

## 4. Directives de Design & Style (Charte IZI Facture)

Chaque nouveau développement ou modification doit respecter scrupuleusement les règles de style de l'application (détaillées dans [.agents/AGENTS.md](file:///c:/Users/user/IZI%20FACTURE/.agents/AGENTS.md)) :
* **Couleurs** :
  * Vert primaire : `bg-primary` (`#00C853`) et hover `bg-primary-dark` (`#00A844`).
  * Vert clair : `bg-primary-light` (`#E8FDF0`) pour les boutons secondaires.
  * Barre latérale : `bg-sidebar` (`#004D40`).
  * Textes sombres : `text-brand-dark` (`#1A1A2E`).
* **Reliefs & Angles** :
  * Grands conteneurs (cartes, formulaires) : `rounded-2xl` (16px) avec une bordure fine `border border-gray-100` et une ombre discrète `shadow-sm shadow-gray-100/30`.
  * Boutons et champs : `rounded-xl` (12px).
* **Animations** :
  * Entrée de page : `@apply animate-in fade-in duration-500` sur le conteneur principal.
  * Clic de bouton : `active:scale-95 transition-all duration-200`.
  * Hover de carte interactive : `transition-all duration-300 hover:shadow-md hover:shadow-gray-200/40 hover:-translate-y-0.5`.

---

## 5. Instructions Importantes pour les Développeurs (et Assistants IA)

> [!IMPORTANT]
> - **Formatage de la Devise** : Toujours utiliser la fonction [formatFCFA](file:///c:/Users/user/IZI%20FACTURE/src/lib/utils/format.ts#L5) pour formater les prix. Elle lit automatiquement la devise configurée dans `settingsStore` et formate le montant de manière appropriée (avec `$`, `€`, `£` en préfixe ou `FCFA` en suffixe selon la devise active).
> - **Backdrop des Modales (Z-Index / Stacking context)** : Pour éviter que les overlays d'arrière-plan des modales ne soient coupés en haut au niveau de la Topbar, **ne jamais** placer les modales `fixed` à l'intérieur du conteneur de page animé. Toujours déclarer les modales en dehors du wrapper animé de la page sous un React Fragment (`<> ... </>`) comme frères du conteneur principal.
> - **Incrémentation de Numéro** : Lors de la création d'une nouvelle facture via `InvoiceForm.tsx`, le compteur `invoice_next_number` des paramètres généraux doit être incrémenté de `+1`.
