# Reste à faire : schéma commun

Un fichier par outil, `reste-a-faire/<code>.json` (codes du registre `registre/outils.json`), plus `norma.json` pour le
socle. Schéma repris de celui de Keystone (`docs/reste-a-developper.json`, le plus complet), contrôlé par
`outils/reste-a-faire/build.mjs` (`valider`, rejoué par `npm test` et par `npm run suivi`, qui refuse de produire la
page au moindre écart).

## Fichier

| Champ | Contenu |
| --- | --- |
| `outil` | code du registre (ou `norma`) ; le fichier porte ce nom |
| `generated`, `updated` | date de l'inventaire initial, date de la dernière mise à jour (`AAAA-MM-JJ`) |
| `branch` | facultatif : branche de référence de l'outil |
| `origine` | facultatif : `{ depot, fichier, commit, reprise }` — d'où vient la liste et comment elle a été reprise |
| `echelle_effort` | facultatif : ce que valent S, M, L, XL pour cet outil (les échelles d'origine diffèrent) |
| `categories` | `{ code: libellé }`, dans l'ordre d'affichage ; chaque point en prend une |
| `history` | `[{ date, text }]`, une ligne par développement, la plus récente à la fin |
| `items` | les points |

## Point (`items[]`)

| Champ | Contenu |
| --- | --- |
| `id` | identifiant stable, unique dans le fichier : `R-…` (Keystone), `AR-…` (Arche), `CR-…` (Crucible), `CX-nnn` (point n de Codex ; `CX-R…` demande reçue), `VG-<réf>` (référence de Vigie, ex. `VG-TDB-03`), `CU-nnn` (Cursus, ordre du document), `MX-…` (Matrix : `E..` écart, `M..` décision, `R..` demande, `S..` mise en service), `CL-…` (Clavis), `MO-L<n>` (livraison de Modulus), `VE-L<n>` (livraison de Vector), `IN-L<n>` (livraison d'Ingenium), `IN-R<nnn>` (point repris de Keystone), `NO-…` (Norma) ; `<préfixe>-Nnn` pour un écart de l'audit Norma. Ne se réutilise jamais. |
| `title`, `description` | ce qu'il faut faire, tiré du document d'origine |
| `category` | une clé de `categories` |
| `kind` | nature, libre (`fonction`, `integration`, `decision_a_appliquer`, `alignement_norma`…) |
| `priority` | `bloquant_production` · `prochaine_etape` · `a_decider` · `plus_tard` |
| `status` | ce qui conditionne le démarrage : `non_commence` · `partiel` · `bloque_attente_proprietaire` · `bloque_systeme_externe` |
| `waiting_on` | ce qui est attendu (décision, donnée, autre outil), vide sinon |
| `effort` | `S` · `M` · `L` · `XL`, ou `null` si non estimé |
| `sources` | liste non vide : fichier et section d'origine, décisions |
| `evidence` | preuves relevées dans le code (vide permis) |
| `progress` | `{ state: a_faire | en_cours | fait, delivery: texte ou null, note }` — l'état tenu à jour à chaque développement |
| `aliases` | facultatif : autres identifiants du même point (référence d'origine, « point 12 », « M-03 ») |
| `details` | facultatif : attributs propres au document d'origine (priorité P0–P3 et classe de Vigie, références de Codex…) |
| `verdict` | facultatif (Keystone) : verdict de la relecture initiale |

Un point fait reste dans la liste (`progress.state = fait`), avec sa livraison et une note ; un point abandonné aussi, avec
la raison dans `progress.note`.

## Après chaque développement (REGLES.md § 3)

1. Dans `reste-a-faire/<outil>.json` de Norma : `progress` des points touchés (`en_cours` quand une livraison le prend,
   `fait` une fois intégré et vérifié sur `main`), une ligne dans `history`, `updated`.
2. Toute question pour le propriétaire : `decisions/<outil>.json` (schéma `decisions/SCHEMA.md`).
3. `npm run suivi` (régénère `RESTE-A-FAIRE.md` et la page `.artifacts/suivi.html` ; `npm run reste-a-faire` en est un
   alias), `npm test`.
4. Branche et PR dans Norma ; la page `.artifacts/suivi.html` (« Suivi Atrium ») est republiée à l'adresse d'artefact de
   la suite.
