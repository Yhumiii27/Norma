# Norma — socle commun de la suite Atrium

Ce qui doit être identique dans tous les outils (Keystone, Codex, Vigie, Cursus, Arche, Crucible, Clavis, Matrix,
Modulus, Vector) vit ici, une seule fois :

| Chemin | Contenu |
| --- | --- |
| `REGLES.md` | règles communes (langues, dépôts, PostgreSQL commun, échanges entre outils, Clavis, charte, dépendances, exploitation, ce que Claude fait seul) |
| `charte/` | charte graphique Nocturne : CSS, composants React de base, police Inter, **coque commune** (`COQUE.md`, `coque.css`), conventions d'écran |
| `contrats/` | contrats communs entre outils (`taches-v1.md` : tâches et approbations de toute la suite, Norma 2.4) |
| `registre/outils.json` | outils, schémas, rôles PostgreSQL, ports, connexion par Clavis |
| `dependances.json` | versions minimales, bibliothèques autorisées, interdites, dérogations |
| `outils/norma.mjs` | copie du socle dans un outil et contrôle de cette copie |
| `outils/questionnaire/` | modèle commun du questionnaire du responsable produit (distribué aux outils) |
| `outils/pages/nocturne-page.css` | palette Nocturne des pages autonomes (suivi, questionnaire), sombre et clair |
| `reste-a-faire/` | reste à faire de la solution : un fichier par outil, schéma `reste-a-faire/SCHEMA.md` |
| `decisions/` | questions au responsable produit de toute la suite : un fichier par outil, schéma `decisions/SCHEMA.md` |
| `outils/reste-a-faire/` | contrôle des listes du reste à faire et `RESTE-A-FAIRE.md` |
| `outils/suivi/` | page unique « Suivi Atrium » (`.artifacts/suivi.html`) : à décider, décidé, reste à faire |
| `propositions/` | propositions au propriétaire, non distribuées aux outils (`TACHES-ET-APPROBATIONS.md` : menus de base, tâches et approbations dans toute la suite, décidée le 27 novembre 2026 ; `DEPLOIEMENT-TRONC-COMMUN.md` : déploiement par outil ; questionnaire `questionnaire-taches/`, page `node propositions/questionnaire-taches/build.mjs`) |

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

## Suivi Atrium : décisions et reste à faire

Une seule page pour toute la suite (décision du propriétaire du 27 novembre 2026), publiée à
https://claude.ai/artifact/Rs7kooJdowShdYUqNS8jQf avec les capacités `db` et `user`. `npm run suivi` contrôle
`reste-a-faire/<outil>.json` et `decisions/<outil>.json`, puis écrit `RESTE-A-FAIRE.md` et `.artifacts/suivi.html`
(`npm run reste-a-faire` en est un alias) :

- **À décider** : les questions ouvertes de tous les outils, groupées par outil, avec la proposition par défaut (★), les
  autres réponses, « Autre réponse », « À discuter » et une note ; chaque réponse est enregistrée à mesure dans la base de
  la page (collection `answers`, un document par question `{ choice, note, updatedAt }`) ; sans base, la page est en lecture
  seule.
- **Décidé** : les réponses déjà données (anciens questionnaires d'Arche, Crucible, Modulus, décisions datées) et ce qui
  était décidé avant les questions ; une réponse peut être revue.
- **Reste à faire** : les points de chaque outil, filtres par état, priorité, recherche.

Avant chaque livraison, la session relit `answers`, reporte les réponses dans `decisions/<outil>.json` puis dans le
`DECISIONS.md` de l'outil, ajoute ses nouvelles questions, régénère et republie la page (`decisions/SCHEMA.md`,
`REGLES.md` § 3). Après chaque développement, la session de l'outil met à jour `reste-a-faire/<outil>.json` ici et ouvre
la PR de Norma.

## Questionnaire d'un outil (modèle, plus publié)

`outils/questionnaire/` reste distribué aux outils et constructible (`node norma/outils/questionnaire/build.mjs`, réglé par
`scripts/questionnaire/config.json` et `questions.json`), mais ses pages ne sont plus publiées : les questions vivent dans
`decisions/<outil>.json` et la page « Suivi Atrium ». Les réponses déjà données dans les pages d'Arche, de Crucible et de
Modulus y sont reprises.

## Changer le socle

Branche et PR dans ce dépôt, `CHANGELOG.md` et `VERSION` montés (majeure : un outil doit changer son code ; mineure :
ajout ; correctif : texte), puis chaque outil reprend la copie dans sa propre PR.
