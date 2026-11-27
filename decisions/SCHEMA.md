# Décisions : schéma commun

Toutes les questions posées au responsable produit, pour toute la suite Atrium, au même endroit : un fichier par outil,
`decisions/<code>.json` (codes du registre `registre/outils.json`), plus `norma.json` (le socle et la suite) et un fichier
par outil à venir qui a déjà des questions (liste `OUTILS_A_VENIR` de `outils/suivi/build.mjs`, vide depuis 3.1.0 :
Ingenium, en cadrage, est au registre). Contrôlé par `validerDecisions` (rejoué par `npm test` et `npm run suivi`, qui refuse de
produire la page au moindre écart). La page `.artifacts/suivi.html` en est produite avec le reste à faire.

## Fichier

| Champ | Contenu |
| --- | --- |
| `outil` | code du registre, `norma` ou un outil à venir ; le fichier porte ce nom |
| `updated` | date de la dernière mise à jour (`AAAA-MM-JJ`) |
| `nom` | facultatif : nom affiché (sinon celui du registre) |
| `origine` | facultatif : `{ depot, fichier, commit, reprise }` — d'où viennent les questions |
| `groupes` | `{ code: libellé }`, dans l'ordre d'affichage ; chaque question en prend un |
| `decide` | liste de textes : ce qui était déjà décidé avant les questions (repris des anciens questionnaires), vide permise |
| `questions` | les questions et données attendues |

## Question (`questions[]`)

| Champ | Contenu |
| --- | --- |
| `id` | `<outil>:<ref>`, unique dans toute la suite ; c'est aussi l'identifiant du document de réponse dans la base de la page (lettres, chiffres, `_ . ~ @ + -` après les deux-points). Ne se réutilise jamais. |
| `ref` | identifiant propre à l'outil (`N-3`, `DR-7`, `O-12`, `TA-2-ajust`…) |
| `outil` | le code du fichier |
| `groupe` | une clé de `groupes` |
| `nature` | `question` (choix) ou `donnee` (une donnée à fournir, saisie en note) |
| `titre`, `contexte` | la question et ce qu'il faut savoir pour y répondre |
| `proposition` | (question) la réponse par défaut, ★, appliquée tant qu'il n'y a pas d'autre réponse |
| `alternatives` | (question) les autres réponses possibles (`alt1`, `alt2`… dans l'ordre), vide permise |
| `aide` | facultatif : texte d'aide du champ (forme attendue d'une donnée) |
| `bloque` | ce que la question bloque (point du reste à faire, livraison), vide sinon |
| `statut` | `ouverte` (pas de réponse : la proposition s'applique) · `repondue` (réponse du propriétaire connue, à reporter ou reportée dans l'outil) · `decidee` (décision appliquée) |
| `reponse` | `null` pour une question ouverte ; sinon `{ choix, note, date, source }` — `choix` : `default`, `alt<n>`, `other`, `discuss` (ou `donnee` pour une donnée, la donnée dans `note`) ; `source` : d'où vient la réponse (« page Suivi Atrium », « questionnaire arche », une décision datée) |

Une question « À discuter » reste dans l'onglet « À décider » de la page.

## Réponses du propriétaire

La page enregistre chaque réponse dans la base de son artefact : collection `answers`, un document par question
(`id` de la question), `{ choice: default | altN | other | discuss | null, note, updatedAt }` — la forme des anciens
questionnaires. Avant chaque livraison, la session :

1. lit la collection `answers` (outil ArtifactData, `list`) ;
2. reporte chaque réponse nouvelle dans `decisions/<outil>.json` (`statut: repondue`, `reponse` avec `source: "page Suivi Atrium"`
   et la date de `updatedAt`), puis dans le `DECISIONS.md` de l'outil ; `decidee` une fois la décision appliquée ;
3. ajoute toute nouvelle question pour le propriétaire dans le fichier de son outil (`statut: ouverte`) ;
4. `npm run suivi`, `npm test`, PR de Norma, puis republie `.artifacts/suivi.html` à l'adresse d'artefact de la suite
   (capacités `db` et `user`).
