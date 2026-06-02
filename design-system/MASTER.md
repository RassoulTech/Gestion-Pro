# GestionPro — Design System (MASTER)

> **Source de vérité unique.** Toute décision UI/UX se réfère à ce document.
> Les *tokens* eux-mêmes vivent dans [`src/app/globals.css`](../src/app/globals.css) via `@theme` (Tailwind v4) — ce fichier les **documente, explique et cadre l'usage**. En cas de divergence, `globals.css` fait foi pour les valeurs, ce document fait foi pour les **règles d'usage**.

**Comment utiliser**
- Construire une page → lire ce MASTER. S'il existe `design-system/pages/<page>.md`, ses règles **surchargent** le MASTER pour cette page.
- Ajouter une couleur/un espacement → vérifier qu'un token existe déjà ici **avant** d'écrire une valeur en dur.
- Règle d'or : `bg-primary`, `text-muted-foreground`, `rounded-xl`… **jamais** `bg-orange-600`, `#ea580c`, `rounded-[10px]`.

---

## 1. Identité produit & patterns

GestionPro est un **SaaS de gestion commerciale multi-boutiques** (POS, stock, marketplace, facturation) avec RBAC vendeur/boutique. C'est avant tout une **application interne data-dense**, pas un site marketing.

| Surface | Pattern de référence | Principe |
|---|---|---|
| Dashboard / accueil boutique | **Executive Dashboard** | 4–6 KPI max en haut (count-up, flèche de tendance, sparkline), vue « en un coup d'œil », statuts en feu tricolore (vert/jaune/rouge). |
| Listes (produits, commandes, stock) | **Data-Dense Dashboard** | Grille, padding compact (8–12px), tables triables/filtrables, hauteur de ligne ~36px, en-têtes *sticky*, densité maximale mais lisible. |
| Pages publiques (flyer, landing, login) | **Marketing / Swiss Modernism** | Plus d'air (gaps 48px+), grands titres (`text-display`), un seul accent (brand orange), CTA visibles. |

**Style visuel global :** moderne, plat, professionnel — grille stricte, ombres subtiles, un accent unique (orange brand). Pas de skeuomorphisme, pas de néon, pas de dégradés criards (le dégradé est réservé aux CTA `premium` et aux titres).

---

## 2. Couleurs

> Tous les tokens existent en **clair** (`:root` via `@theme`) et **sombre** (`.dark`). Le mode sombre est géré par `next-themes` + `darkMode: class`.

### 2.1 Marque & surfaces

| Rôle | Token Tailwind | Clair | Sombre | Usage |
|---|---|---|---|---|
| Brand / Primary | `bg-primary` `bg-brand` | `#ea580c` | `#fb923c` | **L'orange est la marque.** Actions principales, accent, focus ring (clair). Ne pas remplacer par du bleu. |
| Secondary | `bg-secondary` | `#475569` | `#94a3b8` | Actions secondaires, texte atténué fort. |
| Background | `bg-background` | `#f8fafc` | `#0a0a0a` | Fond de page. |
| Card | `bg-card` | `#ffffff` | `#111111` | Surfaces surélevées (cards, popovers, modals). |
| Muted | `bg-muted` / `text-muted-foreground` | `#f1f5f9` / `#64748b` | `#1c1c1f` / `#a1a1aa` | Fonds discrets, texte secondaire. |
| Border / Input | `border-border` | `#e2e8f0` | `#27272a` | Toutes les bordures et champs. |

### 2.2 États sémantiques

| Token | Clair | Sombre | Sens |
|---|---|---|---|
| `success` | `#16a34a` | `#22c55e` | Confirmation, positif, gains |
| `warning` | `#ca8a04` | `#facc15` | Attention, seuil bas |
| `destructive` | `#dc2626` | `#ef4444` | Erreur, suppression, perte |
| `info` | `#ea580c` | `#fb923c` | Information *(volontairement = brand orange pour cohérence ; voir Audit §12)* |

### 2.3 Tokens métier (à utiliser tels quels — ne pas réinventer)

```text
Stock        : stock-ok (success) · stock-low (warning) · stock-out (destructive)
Commande     : cmd-pending · cmd-validee · cmd-livree (success) · cmd-annulee (muted)
Statut compte: statut-actif (success) · statut-suspendu (destructive)
```
→ Un badge de stock bas utilise le token `stock-low`, **pas** `text-warning` ni `text-yellow-600` directement. Cela garde un seul point de vérité si la sémantique change.

### 2.4 Charts

`chart-1 → chart-5` : `#ea580c` (orange marque) · `#2563eb` (bleu) · `#16a34a` (vert) · `#7c3aed` (violet) · `#64748b` (slate). Palette **catégorielle distincte**, lisible en daltonisme.
- Série primaire / mono-couleur → `chart-1` (orange brand).
- ⚠️ **Référencer ces tokens via `var(--color-chart-N)`** dans Recharts — **jamais** `hsl(var(--chart-N))` (nom de variable + wrapper `hsl()` invalides en Tailwind v4). Cf. §8.

---

## 3. Typographie

- **Police active : Geist** — Geist Sans pour l'UI, **Geist Mono** pour le mono — chargée via le package `geist` dans [`layout.tsx`](../src/app/layout.tsx) (`--font-geist-sans` / `--font-geist-mono`). **Inter** reste le fallback de la cascade.
- Cascade effective : `Geist Sans → Inter → system-ui`. Mono : `Geist Mono → JetBrains Mono → ui-monospace`.
- `--font-display` (poids 800, `letter-spacing -0.04em`) : titres marketing via l'utilitaire `.text-display` (rendu en Geist).
- `--font-mono` : montants/chiffres alignés, code.
- Personnalité : *moderne, neutre, premium* — Geist (la police de Vercel) est taillée pour les produits Next.js.
- Alternatives validées par le skill si rebrand un jour : **Plus Jakarta Sans** (friendly SaaS) ou **Lexend + Source Sans 3** (accessibilité max).

**Échelle** (définie dans `@theme`, base 16px) : `xs 12 · sm 14 · base 15 · lg 17 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36 · 5xl 48 · 6xl 60`.
- Corps de texte mobile : **jamais sous 15px** (`text-base`).
- `h1/h2` : `font-weight 600`, `letter-spacing -0.01em` (déjà appliqué en base).
- Longueur de ligne : viser 65–75 caractères (`--container-prose: 65ch`).
- Label majuscule normalisé : utilitaire `.text-label-upper`.

---

## 4. Espacement, radius, élévation, containers

**Radius** (token → usage attendu) :
`sm 4px` tags · `md 8px` inputs/boutons · `default 10px` générique · `lg 12px` petites cards · `xl 16px` cards principales · `2xl 24px` modals.

**Élévation** — ombres **subtiles** uniquement (opacité ≤ 0.08) : `shadow-xs → shadow-xl`. Pas d'ombre dure ni colorée, sauf hover des boutons `brand`/`premium`.

**Containers** :
- App interne → `.container-app` (`max-w 80rem`, padding 1.5rem → 4rem en `lg`).
- Garder une largeur max **cohérente** sur toutes les pages d'un même flux (ne pas mélanger `max-w-6xl` / `max-w-7xl`).

---

## 5. Motion

| Durée | Token | Usage |
|---|---|---|
| 50ms | `--duration-instant` | press (`active:scale-[0.98]`) |
| 150ms | `--duration-fast` | hover, micro-interactions |
| 200ms | `--duration-base` | transitions standard |
| 300ms | `--duration-slow` | entrées (fade-in-up, slide) |
| 500ms | `--duration-slower` | rare, transitions amples |

- Easings : `--ease-out` (défaut entrées), `--ease-bounce` (réservé, parcimonie).
- **Animer uniquement `transform` et `opacity`** (jamais `width`/`height`/`top`).
- `prefers-reduced-motion` est déjà respecté globalement (les mouvements répétés sont neutralisés, les fades conservés). Ne pas réintroduire d'animation infinie sans garde.
- Keyframes dispo : `shimmer`, `fade-in-up`, `slide-in-right`, `scale-in`, `float`, `spotlight`.

---

## 6. Conventions composants

- **shadcn/ui style « new-york »**, base zinc, icônes **Lucide** (jamais d'emoji comme icône). Composants dans [`src/components/ui/`](../src/components/ui/).
- Variantes via **`cva`** + `cn()` (`@/lib/utils`). Réf. : [`button.tsx`](../src/components/ui/button.tsx) — 8 variants (`default · brand · premium · brand-outline · destructive · outline · secondary · ghost · link`) × 5 tailles, état `loading` (spinner + `aria-busy`), `asChild`.
- **Cliquable = `cursor-pointer` + feedback hover** (couleur/ombre/bordure, **pas** de `scale` qui décale le layout — sauf le `active:scale` du press, déjà cadré).
- Tables complexes → pattern **DataTable** (TanStack Table déjà installé) : tri/filtre/pagination, en-têtes sticky.
- Formulaires → **React Hook Form + `<FormField>`** (`@hookform/resolvers` + zod), jamais d'état local manuel par champ.
- Modal → `Dialog` (overlay) ; confirmation destructive → `AlertDialog`. Ne pas détourner `Alert` en modal.
- Toasts → `sonner` (`<Toaster richColors>` déjà monté), variante `info` re-teintée orange (cohérence marque).

---

## 7. Layout & responsive

- Breakpoints (alignés Tailwind) : `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- Tester systématiquement à **375 / 768 / 1024 / 1440px**. Pas de scroll horizontal sur mobile.
- Navbar/éléments fixes → réserver l'espace (le contenu ne passe pas dessous) ; flottants → marge des bords.
- Échelle de z-index disciplinée : `10 / 20 / 30 / 50` (dropdown < sticky < overlay < modal/toast).
- Réserver l'espace des contenus async (skeletons) pour éviter le *layout shift* — `Skeleton` dispo.

---

## 8. Charts (Recharts)

Recharts est la lib du projet. Choisir le type **selon la donnée** :

| Donnée | Type | Couleur |
|---|---|---|
| Tendance dans le temps (CA, ventes/jour) | **Line** (ou Area lissée) | `chart-1` orange, remplissage 20% |
| Comparaison de catégories (top produits) | **Bar** trié décroissant | couleur par barre + labels de valeur |
| Répartition (part par boutique) | **Pie/Donut** ≤ 5 segments | palette `chart-1..5` |
| Comparaison multi-variable | **Radar** (≤ 5–8 axes) | + table de données |

**Accessibilité data** : toujours des labels de valeur sur les barres ; pour les séries multiples, ne pas se fier à la seule couleur (légende explicite). La palette `chart-1..5` est désormais catégorielle distincte (orange/bleu/vert/violet/slate). Fournir une **alternative tableau** pour les graphes clés.

> **Référencement Recharts (token correct)** : `fill="var(--color-chart-1)"`, `stroke="var(--color-muted-foreground)"`, `backgroundColor: "var(--color-popover)"`. **Jamais** `hsl(var(--chart-1))` : `--chart-N` n'existe pas (c'est `--color-chart-N`) et `hsl()` autour d'un hex est invalide.

---

## 9. Accessibilité (CRITIQUE — non négociable)

- **Contraste** : 4.5:1 mini pour le texte normal. Texte secondaire = `muted-foreground` mini (jamais plus clair).
- **Focus visible** : géré globalement (`:focus-visible` → ring 2px). Ne pas le supprimer.
- **Cibles tactiles** : 44×44px mini (taille bouton `default` = h-36px ⇒ pour du tactile pur, préférer `lg`/`xl` ou `size="icon"` ≥ 44px).
- Boutons à icône seule → `aria-label`. Images porteuses de sens → `alt`. Champs → `<label htmlFor>`.
- La couleur n'est **jamais** le seul indicateur (ajouter icône/texte/motif).
- Ordre de tabulation = ordre visuel.

---

## 10. Anti-patterns (à bannir)

- ❌ Emoji utilisé comme icône → utiliser Lucide.
- ❌ Couleurs/espacements en dur (`bg-orange-600`, `#ea580c`, `p-[13px]`) → utiliser les tokens.
- ❌ `var(--color-x)` enrobé à la main dans le JSX → utiliser la classe (`bg-primary`).
- ❌ Hover en `scale` qui décale la mise en page.
- ❌ Card « glass » trop transparente en mode clair (préférer `bg-card` ou `bg-white/80`+).
- ❌ Bordures invisibles en clair (`border-white/10`).
- ❌ Onboarding/flux sur-complexifié, écrans surchargés sans hiérarchie.
- ❌ Mélange de largeurs de container dans un même flux.

---

## 11. Checklist pré-livraison

**Visuel**
- [ ] Aucun emoji-icône ; icônes Lucide cohérentes.
- [ ] Tokens utilisés partout (aucune couleur/radius en dur).
- [ ] Hover sans *layout shift*.

**Interaction**
- [ ] `cursor-pointer` sur tout élément cliquable.
- [ ] Feedback hover clair + transitions 150–300ms.
- [ ] Boutons async désactivés + `loading`.
- [ ] Focus clavier visible.

**Clair / Sombre**
- [ ] Testé dans les deux modes.
- [ ] Contraste texte ≥ 4.5:1 en clair ; éléments translucides visibles ; bordures visibles.

**Layout**
- [ ] Responsive 375 / 768 / 1024 / 1440.
- [ ] Pas de scroll horizontal mobile ; rien sous les éléments fixes.

**Accessibilité**
- [ ] `alt` sur images, `label` sur champs, `aria-label` sur icon-buttons.
- [ ] La couleur n'est pas le seul indicateur.
- [ ] `prefers-reduced-motion` respecté.

---

## 12. Audit & recommandations

Le système est **mature et bien construit**.

### ✅ Appliqué (itération du 2026-06-02)
1. **Bug corrigé — couleurs des charts cassées.** Les 3 composants `src/components/charts/*` utilisaient le pattern shadcn legacy `hsl(var(--chart-N))`, `hsl(var(--popover))`, `hsl(var(--muted-foreground))`, `hsl(var(--border))` : noms inexistants (`--chart-N` au lieu de `--color-chart-N`) **et** wrapper `hsl()` invalide sur des valeurs hex. → migrés vers `var(--color-*)`. Avant ce correctif, les graphes n'affichaient **pas** les couleurs prévues (fallback).
2. **Palette charts refaite.** De « tout chaud » (brun/orange/jaune) vers **catégorielle distincte** orange(marque)/bleu/vert/violet/slate, lisible en daltonisme. Série primaire = `chart-1` (orange) ; les barres « principales » des charts pointent désormais sur `chart-1`.
3. **Typographie « pro max » — Geist installé & chargé.** Cascade `Geist → Inter` complétée (package `geist`, câblé dans `layout.tsx`) : Geist Sans pour l'UI, **Geist Mono** pour le mono, Inter conservé en fallback.

### Choix assumés (laissés tels quels)
4. **`info` ≡ `brand` orange.** Cohérence de marque volontaire (l'override Sonner `info` est teinté orange à la main). Conservé — me le dire pour basculer `info` vers un bleu neutre.
5. **Ring focus orange (clair) / blanc (sombre).** Intentionnel : blanc = très visible sur fond noir.

### À surveiller
6. **Cibles tactiles.** Bouton `default` = 36px < 44px recommandé pour le tactile pur. OK au pointeur ; sur écrans tactiles (POS) privilégier `lg`/`xl` → créer un `pages/pos.md` quand l'écran caisse sera construit.

> Aucune piste restante n'est bloquante.
