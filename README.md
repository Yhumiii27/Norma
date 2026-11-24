# Norma — socle commun de la suite EPC2I

Ce qui doit être identique dans tous les outils (Keystone, Codex, Vigie, Cursus, Arche, Crucible, Clavis, Matrix,
Modulus) vit ici, une seule fois :

| Chemin | Contenu |
| --- | --- |
| `REGLES.md` | règles communes (langues, dépôts, PostgreSQL commun, échanges entre outils, Clavis, charte, dépendances, exploitation, ce que Claude fait seul) |
| `charte/` | charte graphique Nocturne : CSS, composants React de base, police Inter, conventions d'écran |
| `registre/outils.json` | outils, schémas, rôles PostgreSQL, ports, connexion par Clavis |
| `dependances.json` | versions minimales, bibliothèques autorisées, interdites, dérogations |
| `outils/norma.mjs` | copie du socle dans un outil et contrôle de cette copie |
| `outils/questionnaire/` | modèle commun du questionnaire du responsable produit (distribué aux outils) |
| `outils/pages/nocturne-page.css` | palette Nocturne des pages autonomes (questionnaire, reste à faire), sombre et clair |
| `reste-a-faire/` | reste à faire de la solution : un fichier par outil, schéma `reste-a-faire/SCHEMA.md` |
| `outils/reste-a-faire/` | contrôle et génération de `RESTE-A-FAIRE.md` et de la page `.artifacts/reste-a-faire.html` |

## Dans un outil

Chaque outil garde une **copie versionnée** dans `norma/` (rien à télécharger au déploiement, aucun jeton GitHub sur le
serveur) :

```bash
# à la racine de l'outil, avec un clone de Norma à côté
echo '{ "outil": "<code du registre>" }' > norma.config.json   # une fois
node ../Norma/outils/norma.mjs copier                           # copie (ou mise à jour) du socle
node norma/outils/norma.mjs verifier                            # à mettre dans la CI de l'outil
```

- Le `CLAUDE.md` de l'outil commence par `@norma/REGLES.md` : les sessions Claude lisent les règles communes, puis
  celles de l'outil.
- `verifier` refuse une copie modifiée localement et contrôle `package.json` (minimums, interdites, à déclarer).
- Charte : `charte/README.md`.

## Questionnaire du responsable produit

Un seul modèle pour tous les outils (plus de copie d'un outil à l'autre). Dans l'outil :

- `scripts/questionnaire/questions.json` : une entrée par question, `{ id, group, title, context, proposal, alts, blocks }`,
  ou `{ id, group, title, context, kind: "data", placeholder }` pour une donnée à coller. Ids uniques, groupe connu,
  champs obligatoires : contrôlés à la génération, avec un message par erreur.
- `scripts/questionnaire/config.json` :
  ```json
  { "titre": "Décisions Arche", "sousTitre": "Arche · questionnaire du responsable produit",
    "introduction": "Chaque question porte la proposition par défaut (★)…",
    "decideTitre": "Déjà décidé", "decide": ["AC-1 — le système s’appelle Arche."],
    "groupes": [["prio", "À traiter en priorité"], ["data", "Données à fournir"]],
    "sortie": ".artifacts/decisions-arche.html" }
  ```
- `node norma/outils/questionnaire/build.mjs [--sortie <page.html>]` (script `questionnaire:page`) écrit la page autonome,
  publiée comme artefact (charte Nocturne, sombre et clair).
- Réponses : base de l'artefact, collection `answers`, un document par question
  `{ choice: default | altN | other | discuss, note, updatedAt }` (mêmes champs qu'avant : les réponses déjà données dans
  Arche et Crucible restent lues). Relues avec l'outil ArtifactData avant chaque livraison, reportées dans `DECISIONS.md`.

## Reste à faire de la solution

Une seule liste pour toute la suite, ici : `reste-a-faire/<outil>.json` (et `norma.json` pour le socle), schéma
`reste-a-faire/SCHEMA.md`. `npm run reste-a-faire` contrôle chaque fichier et produit `RESTE-A-FAIRE.md` (sommaire par
outil, puis les points par outil et catégorie) et `.artifacts/reste-a-faire.html` (page autonome : filtres par outil, état,
priorité, recherche, compteurs), republiée à la même adresse d'artefact. Après chaque développement, la session de l'outil
met à jour son fichier ici et ouvre la PR de Norma (REGLES.md § 3). Les listes propres des outils sont remplacées par un
renvoi à celle-ci.

## Changer le socle

Branche et PR dans ce dépôt, `CHANGELOG.md` et `VERSION` montés (majeure : un outil doit changer son code ; mineure :
ajout ; correctif : texte), puis chaque outil reprend la copie dans sa propre PR.
