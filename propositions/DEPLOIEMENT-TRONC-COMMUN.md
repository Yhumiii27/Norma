# Déploiement du tronc commun des menus et de « Mes tâches » / « Mes approbations » (Norma 2.4)

> Plan du 27 novembre 2026, après la décision du propriétaire (TA-11, TA-15, TA-16) et la confirmation des réponses
> proposées pour les autres questions (`TACHES-ET-APPROBATIONS.md` § 7 bis). Contrat : `contrats/taches-v1.md` ; coque :
> `charte/COQUE.md` § 2 bis ; composants : `charte/ds/BaseNav.tsx`, `MyTasks.tsx`, `MyApprovals.tsx`, règles
> `charte/ds/task-rules.ts`. Chaque point est suivi dans `reste-a-faire/<outil>.json` (identifiants ci-dessous).

## 1. Ce que chaque outil construit (phase 1)

Pour **chaque** outil, cinq briques, dans cet ordre :

1. **Copie de Norma 2.4.0** (`node ../Norma/outils/norma.mjs copier`) et entrées de `TACHES_FR` dans son dictionnaire
   français (une clé déjà traduite autrement se signale dans Norma, sans changer la copie).
2. **Tronc commun dans la barre latérale** : `<BaseNav tool="<code>" paths={…} counts={…} hidden={…} />` juste sous
   `PageSearch`, à la place des « entrées fixes » actuelles ; les entrées qui faisaient double emploi rejoignent une section
   (§ 2). Pages `/my/tasks` et `/my/approvals` (ou la route actuelle de l'outil), `?vue=` dans l'URL.
3. **Accueil typé** (`COQUE.md` § 2 bis.2) : la page `/` montre le métier de l'outil, avec au plus un encart « À traiter »
   qui renvoie à Mes tâches.
4. **Projection et publication** : table `taches_publiees` (migration générée, contraintes du contrat § 2) réécrite par les
   fournisseurs de l'outil dans la transaction des écritures et par une tâche planifiée toutes les 15 minutes ; **requête
   de référence** `pub_taches` dans le dépôt, testée avec `rowProblems` ; **demande à Matrix** (entrée de son
   `REQUESTS.md`, après le « validé » du propriétaire) : publier `<outil>.pub_taches` et accorder le lien
   `lecture matrix.pub_taches`.
5. **Lecture de toute la suite** : « Mes tâches », « Mes approbations » et les pastilles lisent `matrix.pub_taches` (filtre
   `personne_id` = identifiant Clavis de la personne, cache d'une minute) et `matrix.pub_taches_sources` (bandeau
   « source indisponible ») ; tant que la vue n'existe pas, les seules lignes de l'outil (sa projection) et le bandeau.
   Décision et déplacement : sur les lignes de l'outil seulement (`remote` faux) ; les autres s'ouvrent par `lien`.

Phase 2, plus tard pour chaque outil : `GET /api/v1/taches/{id}` et `POST /api/v1/taches/{id}/decision` (contrat § 6),
vérification du jeton Clavis, `remote` vrai ; puis la fiche (`TaskSheet`, à ajouter à la charte en phase 2).

## 2. Par outil

| Outil | Aujourd'hui (relevé du 26 nov.) | Tronc commun : ce qui change | Projection : fournisseurs à brancher | Effort phase 1 | Point |
| --- | --- | --- | --- | --- | --- |
| Keystone | entrées fixes complètes (Accueil, Mes projets, Mes tâches, Mes approbations, Mes tableaux de bord, Documents · Codex), kanban de « Mon travail » | Documents · Codex passe dans la section du projet ; Mes projets et Mes tableaux de bord restent (entrées métier) ; « Mon travail » prend la vue calendrier et les tâches de la suite | `src/server/approvals/` (12 types), tâches de `src/domain/tasks.ts` | M | R-N05 |
| Codex | « À traiter » sur l'accueil, `/validations` | Mes tâches (revues, conservation, rappels) et Mes approbations = `/validations` (`paths`), Documents et Mes documents | `decideStep` (étapes de circuit), revues périodiques, échéances de conservation | M | CX-N09 |
| Arche | « Mes approbations » `/my/approvals`, « Mes actions » sur l'accueil, pas de cloche | Mes tâches nouvelle (actions du plan, WBS), Mes CAPEX, Portefeuille | `src/server/dal/approvals.ts` (5 types), `capex_actions`, `wbs_tasks` | M | AR-N05 |
| Vigie | « À faire » `/a-faire`, cloche | Mes tâches = `/a-faire` (`paths`), Mes approbations nouvelle (clés d'ECO, décisions d'ECR, vérifications…), Événements, Plan d'actions | `computePersonTodo`, `loadEngineeringSignals`, `canDecideApproval` ; API `/api/v1/taches/` en phase 2 (TA-12) | M | VG-N09 |
| Crucible | « À décider » `/my/decisions`, « Mon planning » | Mes approbations = `/my/decisions`, Mes tâches nouvelle (formulaires à remplir, besoins), Planning des moyens, Mes besoins d'essais | `src/server/dal/decisions.ts` (arbitrages et scénarios : `decision_a_distance = false`) | M | CR-N07 |
| Cursus | validations dans chaque écran, badges, « Échéances » | Mes tâches et Mes approbations nouvelles (12 types), Mes temps, Mes absences ; titres neutres (`sensible` pour absences et santé, avis RGPD TA-10) | `server/src/actions/*` (absences, temps, frais, entretiens…) | L | CU-N07 |
| Clavis | « Mes demandes d'accès », « Mes revues d'accès » | Mes tâches (revues), Mes approbations (demandes d'accès), Annuaire, Mes accès | `src/domain/requests.ts`, `src/domain/security.ts` ; **échange de jeton RFC 8693** (phase 2, CL-N09) | M (+ L phase 2) | CL-N08, CL-N09 |
| Matrix | ni cloche ni « mon travail » ; HTML sans React | le même bloc en HTML (`coque-base-nav`) ; Mes approbations (liens, publications à appliquer) ; Publications, Liens entre outils | liens à décider, publications à appliquer ; **réunion `matrix.pub_taches` et `pub_taches_sources`** (MX-N09), sur le modèle de `journal_unifie` | L | MX-N08, MX-N09 |
| Modulus | ni cloche ni « mon travail » | Mes tâches et Mes approbations nouvelles (revues d'offre, publications), Mes affaires, Catalogue | `src/domain/review.ts`, `src/server/commerce/core.ts` | M | MO-N02 |
| Vector | ni cloche ni « mon travail » | Mes tâches et Mes approbations nouvelles (tri, colisage, attribution au-delà du seuil, conformité), Mes expéditions, Demandes | `src/domain/shipment-state.ts`, `quotes.ts`, `compliance.ts` | M | VE-N02 |

Échelle : S < 2 jours, M ≤ 1 semaine, L ≤ 3 semaines, XL > 3 semaines (efforts des phases 1 et 2 de la proposition § 6
réunis).

## 3. Ordre et pilote (TA-14)

1. **Norma 2.4.0** (ce lot) : contrat, coque, composants, tests.
2. **Matrix d'abord pour la réunion** (MX-N09) : `matrix.pub_taches` et `pub_taches_sources` se construisent dès la première
   `pub_taches` publiée ; une vue absente est laissée de côté, donc la réunion peut partir avec un seul outil.
3. **Pilote Keystone + Codex + Arche** (R-N05, CX-N09, AR-N05) : Keystone a la boîte la plus complète et décide déjà des
   étapes Codex ; Codex porte les circuits qui touchent tous les outils ; Arche a le circuit le plus formel. Critère de
   sortie : dans chacun des trois, « Mes tâches » et « Mes approbations » montrent les lignes des deux autres avec leur lien
   profond, pastilles justes, bandeau quand un outil est arrêté.
4. **Vigie et Crucible**, puis **Cursus** (le plus de types et de données personnelles, avis RGPD), puis **Modulus,
   Vector, Clavis**, enfin le bloc HTML de **Matrix** (MX-N08).
5. **Phase 2** : Clavis construit l'échange de jeton (CL-N09) ; puis l'API `/api/v1/taches/…` dans l'ordre du pilote ;
   chaque outil passe `remote` à vrai quand l'outil propriétaire répond.
6. **Phase 3** : résumé e-mail commun par Matrix, une fois le transport choisi par la DSI.

## 4. Demandes à préparer (jamais envoyées sans le « validé » du propriétaire)

- Chaque outil → Matrix : publication `<outil>.pub_taches` (requête de référence jointe) et lien `lecture matrix.pub_taches`.
- Matrix : réunion `matrix.pub_taches` et `matrix.pub_taches_sources` (son propre lot, MX-N09).
- Chaque outil → Clavis (phase 2) : inscription « peut demander un jeton pour » les autres outils, portées `taches:*`.
- Chaque outil → Codex (phase 2) : aperçu des documents avec le jeton de la personne (TA-8).

## 5. Effort total

Phase 1 : Norma S (fait), neuf outils M, Cursus et Matrix L — environ 12 à 14 semaines de travail réparties sur les
sessions des outils, dont 3 à 4 pour le pilote. Phase 2 : Clavis L, chaque outil S à M.

## 6. Points ouverts

- Clés de traduction en conflit (une clé n'a qu'une traduction dans Keystone : « Open », « Done », « Type »…) : chaque
  outil signale le conflit dans Norma, qui ajoute un contexte (`'Done#task'`).
- Cursus (Vite + React, sans `next/link` ni `next/navigation`) reprend les modèles purs `base-nav.ts` et `task-rules.ts`
  et écrit le même HTML avec les mêmes classes (`COQUE.md`, en tête) ; Matrix (HTML sans React) aussi. Les outils Next.js
  prennent les composants tels quels.
- Le compteur de la cloche (proposition § 4.7) et le menu du compte (Notifications, préférences, absence et délégation)
  restent à fixer en phase 3 avec les préférences de Clavis (TA-7).
