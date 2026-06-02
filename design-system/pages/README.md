# Overrides par page

Ce dossier contient les **déviations** par rapport à [`../MASTER.md`](../MASTER.md), une page à la fois.

## Règle de résolution

1. Pour construire une page (ex. `Caisse / POS`), chercher d'abord `pages/caisse.md`.
2. S'il existe → ses règles **surchargent** le MASTER **uniquement** pour cette page.
3. Sinon → appliquer le MASTER tel quel.

## Quand créer un override

Seulement quand une page a un besoin spécifique justifié — par ex. :
- **`pos` / `caisse`** : cibles tactiles ≥ 44px imposées partout (terminal tactile), densité réduite, gros boutons.
- **`flyer` / `landing`** : pattern marketing (gaps amples, `text-display`, dégradés CTA autorisés).
- **`dashboard`** : pattern Executive (4–6 KPI, sparklines, feu tricolore).

## Format

```markdown
# Override page : <Nom>

> Hérite de MASTER.md. Ne lister QUE les différences.

## Ce qui change
- <règle> : <nouvelle valeur> — *pourquoi*

## Ce qui reste (rappel)
- Tokens, accessibilité, anti-patterns → identiques au MASTER.
```

Ne **pas** recopier le MASTER ici : uniquement le delta.
