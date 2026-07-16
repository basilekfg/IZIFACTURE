# Règles de Style & d'Interface - IZI Facture

Ces directives de design garantissent la cohérence esthétique et l'expérience utilisateur premium de la plateforme SaaS **IZI Facture**. Elles doivent s'appliquer à chaque nouvelle page ou composant.

## 1. Palette de Couleurs (Tokens Tailwind)

Chaque composant doit exploiter exclusivement la charte graphique configurée :
- **Accents & Boutons Principaux (CTA) :** `bg-primary` (`#00C853`) et hover `bg-primary-dark` (`#00A844`). Le vert clair `bg-primary-light` (`#E8FDF0`) s'utilise pour les boutons secondaires ou les indicateurs discrets.
- **Barre Latérale (Sidebar) :** Fond uniforme `bg-sidebar` (`#004D40`) avec états actifs/inactifs `bg-white/10` et `hover:bg-white/5`.
- **Texte & Titres :** Couleur sombre `text-brand-dark` (`#1A1A2E`) ou `text-gray-800` pour un contraste premium.
- **Fond de Contenu :** `#F8F9FA` pour le fond principal de l'espace de travail (zone centrale).
- **Statuts (Badges & Alertes) :**
  - *Payé / Succès :* `emerald-500` (texte `emerald-700`, fond `emerald-50`)
  - *En attente / Warning :* `amber-500` (texte `amber-700`, fond `amber-50`)
  - *En retard / Danger :* `red-500` (texte `red-700`, fond `red-50`)
  - *Brouillon / Neutre :* `gray-400` (texte `gray-700`, fond `gray-100`)

---

## 2. Contours et Ombres (Borders & Shadows)

Pour obtenir l'effet moderne "glassmorphism / soft-card" :
- **Arrondis standards :** Toujours utiliser `rounded-2xl` (16px) sur les cartes, les panneaux et les grands conteneurs de formulaires ou tableaux. Les boutons utilisent `rounded-xl` (12px).
- **Bordures :** Une bordure très fine `border border-gray-100` doit délimiter chaque carte pour marquer le relief de manière subtile.
- **Ombrages :** Utiliser une ombre très légère pour éviter d'alourdir le design : `shadow-sm shadow-gray-100/30`.

---

## 3. Animations & Micro-Interactions

L'interface doit paraître réactive et vivante :
- **Entrée de Page :** Ajouter la classe d'animation globale `@apply animate-in fade-in duration-500` sur le conteneur principal de chaque route.
- **Cartes :** Pour les cartes interactives (StatCards, ClientCards, Raccourcis), utiliser la transition suivante :
  `transition-all duration-300 hover:shadow-md hover:shadow-gray-200/40 hover:-translate-y-0.5 group`
- **Boutons :** Les boutons d'action doivent rétrécir légèrement au clic : `active:scale-95 transition-all duration-200`.

---

## 4. Structure des Tableaux (Tables)

Chaque liste ou tableau de données doit respecter la structure suivante :
- **Conteneur :** Toujours enveloppé dans une carte blanche arrondie avec débordement masqué : `bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30 overflow-hidden`.
- **En-têtes (Thead) :** Fond gris clair `bg-gray-50` avec un texte en majuscule, très petit, gras et espacé : `text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150`.
- **Lignes (Tr) :** Espacement vertical uniforme et effet de survol progressif : `hover:bg-gray-50/50 transition-colors`. Les lignes sont séparées par `divide-y divide-gray-100`.
- **Champs clés :** Mettre en valeur les montants (`font-extrabold text-brand-dark`), les numéros de factures (`font-bold text-brand-dark`) et les noms de clients (`font-semibold text-gray-800`).

---

## 5. Gestion des Badges de Statuts

Les statuts des factures utilisent le composant `<Badge status={status} />` :
- Affichage automatique du libellé en français (*Payée, Envoyée, Brouillon, En retard, Annulée*).
- Présence obligatoire d'une pastille colorée de notification (`w-1.5 h-1.5 rounded-full`) précédant le texte du badge.
