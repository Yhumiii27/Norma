# Menus de base communs, tâches et approbations dans toute la suite — proposition

> **Décidée le 27 novembre 2026** (§ 7 bis) : le propriétaire a tranché TA-11, TA-15 et TA-16 et confirmé la réponse
> proposée pour TA-1 à TA-10, TA-12, TA-13 et TA-14. Norma 2.4.0 construit la phase 1 (`charte/COQUE.md` § 2 bis,
> `contrats/taches-v1.md`, composants `charte/ds/BaseNav.tsx`, `MyTasks.tsx`, `MyApprovals.tsx`) ; déploiement par outil :
> `propositions/DEPLOIEMENT-TRONC-COMMUN.md`.
>
> Proposition du 26 novembre 2026. Elle répond à la demande du propriétaire :
> « Mon idée est que tous les outils devraient avoir les mêmes menus que Keystone (pour les menus de base qui sont hors des
> menus métiers). Et que chaque personne devrait pouvoir donner son approbation à une tâche, un workflow ou autre depuis son
> application métier sans avoir à ouvrir obligatoirement l'application d'un autre métier. La consultation du workflow, des
> données à vérifier et/ou du(des) documents doit pouvoir être faite depuis chacun des outils. » — et : « quel que soit
> l'outil métier comment peut-on centraliser les notifications et les approbations ? »
>
> Les choix ouverts sont les questions **TA-1 à TA-16** du questionnaire `propositions/questionnaire-taches/` (page construite
> par le modèle de Norma). Chaque question porte une réponse par défaut, appliquée tant que le propriétaire n'a pas répondu.
> Relevé fait sur `origin/main` de chaque dépôt le 26 novembre 2026 (Keystone `9a6f882`, Codex `378fb57`, Vigie `71760b9`,
> Cursus `18fb408`, Arche `dde8d65`, Crucible `97370df`, Clavis `ac26fea`, Matrix `a01da74`, Modulus `0204c68`,
> Vector `afb2a04`).

## 0. En bref

1. **Menus de base** : Keystone a le bloc le plus complet (Accueil, Mes tâches, Mes approbations, Mes tableaux de bord,
   Documents · Codex ; cloche, recherche globale, date de situation ; compte en pied). Aucun autre outil n'a le même bloc :
   trois outils (Modulus, Vector, Matrix) n'ont ni cloche ni « mon travail », et six outils sur dix n'ont pas de cloche. Norma
   ajoute à la coque un **bloc d'entrées de base** (même ordre, mêmes libellés, mêmes icônes, mêmes chemins) et une cloche
   obligatoire ; chaque outil remplit les entrées avec ses propres données (phase 1, sans échange entre outils).
2. **Approbations** : **67 types de décisions** relevés dans les dix outils (Keystone 12, Vigie 13, Cursus 12, Arche 5 + la
   signature avancée, Crucible 7, Codex 4, Clavis 3, Vector 5, Modulus 3, Matrix 2). Trois outils ont déjà une boîte unifiée
   par « fournisseurs » (Keystone `src/server/approvals/`, Arche `src/server/dal/approvals.ts`, Crucible
   `src/server/dal/decisions.ts`) ; **Keystone décide déjà, depuis Keystone, des étapes de circuit de Codex et des clés d'ECO de
   Vigie** (file d'envoi + appel de l'outil propriétaire) : c'est le modèle à généraliser.
3. **Cible** : chaque outil **publie ses tâches ouvertes** dans une vue `pub_taches` au contrat commun ; **Matrix les réunit**
   (`matrix.pub_taches`, sur le modèle de son journal unifié) ; chaque outil lit cette seule vue pour « Mes tâches » et la
   cloche. La **fiche** d'une tâche et la **décision** passent par l'API de l'outil propriétaire
   (`GET /api/v1/taches/{id}`, `POST /api/v1/taches/{id}/decision`), avec un **jeton de la personne émis par Clavis pour
   l'outil cible** ; l'outil propriétaire refait tous ses contrôles, applique son circuit et son journal. Les documents
   s'affichent par un aperçu de Codex servi avec ce même jeton.
4. **Notifications** : la cloche de chaque outil montre les tâches de toute la suite (même vue) ; l'e-mail immédiat reste à
   l'outil propriétaire ; **un seul résumé quotidien** pour toute la suite, envoyé par un expéditeur commun (Matrix par défaut,
   TA-6), dès que la DSI a choisi Microsoft Graph ou SMTP (Cursus et Crucible ont déjà Graph, Crucible aussi SMTP).
5. **Exclus de la décision à distance** (consultation et lien profond seulement) : la signature électronique avancée (G2 /
   AFE d'Arche par Yousign), les signatures sur le terrain (émargement, délivrance de permis, consignation), le registre des
   dangers graves et imminents, toute tâche qui porte une donnée de santé, et les arbitrages à options (Crucible) — TA-9.
6. **Phases** : 0 décisions → 1 menus de base (Norma 2.4) → 2 « Mes tâches » de toute la suite en lecture → 3 fiche et
   documents dans chaque outil → 4 décision à distance → 5 résumé e-mail commun. Pilote : Keystone, Codex, Arche (TA-14).

## 1. Relevé : menus de base

### 1.1 Keystone, la référence

| Emplacement | Entrée | Chemin | Fichier |
| --- | --- | --- | --- |
| Barre latérale, entrées fixes (`FIXED_ORDER`) | Accueil | `/` | `src/config/screens.ts` l. 47, 142 |
| | Mes projets (propre au métier) | `/my/projects` | idem l. 48 |
| | **Mes tâches** (« My work », fiche d'une tâche `/my/tasks/[taskId]`) | `/my/tasks` | idem l. 49–50 |
| | **Mes approbations** (12 types, délégations R-051, « décidé cette semaine ») | `/my/approvals` | idem l. 51 ; `src/server/approvals/index.ts`, `src/features/myapprovals/` |
| | Mes tableaux de bord | `/my/dashboards` | idem l. 53 |
| | **Documents · Codex** (index des documents) | `/projects/[code]/documents` | idem l. 54 |
| Section « Administration » | Paramètres (listes, préférences d'e-mail par famille), Activité et intégrations | `/admin/settings`, `/admin/integrations` | idem l. 121–124 ; `src/features/reminders/defaults-card.tsx` |
| Pied de barre latérale | Compte : rôle actif, déconnexion (démonstration : « Voir en tant que ») | — | `src/components/app/shell/account-menu.tsx` |
| En-tête de page | Recherche globale · actions (Export) · date de situation · **cloche** · langue / affichage | — | `src/components/app/shell/page-header.tsx`, `bell.tsx`, `header-islands.tsx` |
| Barre supérieure ≤ 1024 px | menu, logo, cloche, langue / affichage | — | `src/components/app/shell/topbar.tsx` |

Keystone n'a pas de bouton d'aide dans l'en-tête (emplacement `help` de `HeaderTools` vide).

### 1.2 Les autres outils

Légende : ● présent · ◐ partiel ou sous un autre nom · — absent.

| Entrée de base | Keystone | Codex | Vigie | Cursus | Arche | Crucible | Clavis | Matrix | Modulus | Vector |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Accueil | ● | ● | ● tableau de bord | ● portail (« Mon espace ») | ● | ● | ◐ organigramme | ◐ | ● | ● |
| Mes tâches / À faire | ● | ◐ « À traiter » sur l'accueil | ● `/a-faire` | ◐ badges par entrée, « Échéances » | ◐ « Mes actions » sur l'accueil | ◐ « Mon planning », « Mes besoins » | ◐ « Mes demandes d'accès » | — | — | — |
| Mes approbations | ● | ● `/validations` | ◐ dans À faire | — (validations dans Temps, Absences, Frais…) | ● `/my/approvals` | ● « À décider » `/my/decisions` | ◐ « Mes revues d'accès » | — | — | — |
| Mes tableaux de bord | ● | — | ◐ tableaux configurables (TDB-19) | — | — | — | — | — | — | — |
| Documents (Codex) | ● | ● (c'est Codex) | ◐ « Documents maîtrisés » | — | ◐ dossiers vivants | — | — | — | — | — |
| Cloche | ● | ● | ● | — (Web Push, régions live) | — | ● + page `/notifications` | — | — | — | — |
| Recherche globale (en-tête) | ● | ● | ● | ● | — | ● | — | — | — | — |
| Aide | — | ● (barre latérale) | ● (en-tête) | ● (barre latérale) | — | ● assistant | — | — | — | — |
| Date de situation | ● | — | — | — | — | ● | — | — | — | — |
| Préférences de notification | ● (familles × immédiat / résumé / rien) | — | — | ◐ (Web Push par appareil) | — | — | — | — | — | — |
| Délégation / absence | ● (R-051) | — | — | ● (délégations du manager) | ● (absences, « pour le compte de ») | — | — | — | — | — |
| Compte en pied (rôle, déconnexion) | ● | ● | ● | ● (espace, mot de passe) | ● | ● | ● (+ « Ma sécurité ») | ● | ● | ● |

Sources : Codex `src/components/shell/Sidebar.tsx`, `PageHeader.tsx`, `Bell.tsx`, `todo.ts` ; Vigie `src/lib/domain.ts`
(`SCREENS`, `NAV`), `src/components/Sidebar.tsx`, `PageHeader.tsx` ; Cursus `client/src/layout/Shell.tsx`,
`RechercheGlobale.tsx` ; Arche `src/config/screens.ts` l. 35–36, `src/components/app/shell/page-header.tsx` ; Crucible
`src/config/screens.ts` l. 44–48, `src/components/app/shell/page-header.tsx` ; Clavis `src/config/screens.ts` l. 24–44 ;
Modulus et Vector `src/config/screens.ts`, `src/components/app/shell/page-header.tsx` ; Matrix `maquette/source.html`.

**Écarts principaux.** (1) Huit outils sur dix n'ont pas d'entrée « Mes approbations » sous ce nom, et chaque outil qui en a
une l'appelle autrement (« Approvals », « À décider », « My approvals », « À faire »). (2) Six outils n'ont pas de cloche
(Cursus, Arche, Clavis, Matrix, Modulus, Vector). (3) L'aide est à trois endroits différents. (4) La
préférence de notification n'existe que dans Keystone. (5) La coque (`charte/COQUE.md` § 2.3) nomme les « entrées fixes »
sans en fixer la liste : c'est ce que la phase 1 ajoute.

## 2. Relevé : approbations, validations, décisions

Colonnes : objet · qui décide · états · code · voie d'écriture existante pour un autre outil · signature · documents (Codex)
et données à vérifier.

### 2.1 Keystone (12 types, boîte unifiée « Mes approbations »)

Contrat de fournisseur : `src/server/approvals/types.ts` ; registre `src/server/approvals/index.ts` ; types
`src/domain/approvals.ts` (`APPROVAL_KINDS`) ; délégations `drizzle/0067_approval_delegations.sql`, `src/server/dal/delegations.ts`.

| Type | Qui | États / effet | Code | Voie externe |
| --- | --- | --- | --- | --- |
| Demande de ressource | chef de département | approuvée → tâche créée / refusée (motif) | `approvals/resource-requests.ts` | — |
| Commande d'achat | approbateur selon montant | → Commandée / Annulée | `approvals/purchase-orders.ts`, `features/orders/actions.ts` | — |
| ECO (clé englead / quality / pm) | titulaire de la clé | clé accordée / refusée, envoyée à Vigie | `approvals/ecos.ts`, `integrations/vigie/eco-connector.ts` | **écrit chez Vigie** par `vigie.pub_signaler_avancement_eco` |
| Réception — contrôle qualité | qualité | acceptée → stock / rejetée → quarantaine | `approvals/delivery-qc.ts` | — |
| Changement d'étape forcé | directeur de portefeuille | gardé / annulé | `approvals/forced-stage-changes.ts` | — |
| Demande de modification (CR) | étape de circuit (CCB…) | par étape | `approvals/change-requests.ts`, `domain/change-control.ts` | — |
| Tirage sur provision | directeur de portefeuille | validé / refusé | `approvals/contingency-draws.ts` | — |
| Acceptation de livrable (PV client) | chef de projet | acceptée / refusée | `approvals/deliverables.ts` | — |
| Attribution d'appel d'offres | achats | attribuée | `approvals/rfq-awards.ts` | — |
| Facture — rapprochement à trois | finance | validée / rejetée | `approvals/invoices.ts` | — |
| Vérification de NC | responsable qualité | close / retour en action corrective, envoyée à Vigie | `approvals/ncr-verification.ts` | **écrit chez Vigie** par `vigie.pub_signaler_avancement_nc` |
| **Étape de circuit d'un document Codex** | approbateur nommé | approuvé / rejeté (motif), « en attente de synchronisation » | `approvals/codex-documents.ts`, `integrations/codex/outbox.ts`, `connector.ts` | **attend Codex** : `POST /api/documents/:numéro/approvals` est un `TODO(codex)`, non construit |

Données à vérifier : montants et lignes de commande, budget et écart, critères qualité, pièces Codex citées. Pas de signature
électronique avancée.

### 2.2 Vigie (13 types, « À faire » calculé, cloche)

| Type | Qui | Code |
| --- | --- | --- |
| Clé d'approbation d'un ECO, décision sur un ECR | approbateur désigné (`canDecideApproval`), QHSE / direction | `src/server/engineering.ts`, `engineering-core.ts`, `src/lib/rules/engineering.ts` |
| Vérification d'efficacité d'une action QSE, réouverture | animateur QHSE seul | `src/server/plan-ui.ts` (`verifyAction`, `reopenAction`) |
| Qualification, clôture, classement d'un événement | animateur QHSE seul | `src/server/events.ts` |
| Visa de la revue de direction, rectificatif signé | direction | `src/server/review.ts` |
| Validation du DUERP (consultation du CSE, version figée) | QHSE / CSE | `src/server/risks.ts` |
| Signature d'un plan de prévention (EU / EE), délivrance d'un permis | encadrement, QHSE | `src/server/prevention.ts` |
| Veto sur un intervenant | animateur QHSE seul | `src/server/prevention-workers.ts` |
| Vérification d'une consignation | vérificateur désigné | `src/server/lockouts.ts` |
| Avis du registre DGI signé par un membre du CSE | CSE, QHSE | `src/server/dgi.ts` |
| Émargement d'une causerie | le participant seul | `src/server/safety-talks.ts` |
| Validation d'une étude de sécurité des procédés | QHSE / direction | `src/server/process-safety.ts` |
| Clôture d'une auto-évaluation | QHSE | `src/server/self-assessment.ts` |
| Demande reçue de Keystone ou de Codex (traitement) | Vigie (tâche) | `src/server/integrations/inbound.ts` |

Écritures reçues : **aucune API HTTP** ; fonctions `vigie.pub_signaler_avancement_nc`, `pub_signaler_avancement_eco`,
`pub_creer_demande_modification` (dépôt dans `inbound_requests`, traitement asynchrone). Données de santé (AT, MP) :
réservées à l'animateur QHSE et à la direction, jamais publiées. Documents : lus dans `codex.pub_documents`.

### 2.3 Cursus (12 types, validations dans chaque écran)

Actions par `POST /api/actions/:nom` (`server/src/actions/index.ts`), session de la personne.

| Type | Qui | États | Code |
| --- | --- | --- | --- |
| Demande d'absence | manager (ou délégué) | demandée → validée / refusée (motif) | `server/src/actions/absences.ts` |
| Feuille de temps | valideur des feuilles | soumise → validée / rejetée | `temps.ts`, `suivi-feuilles.ts` |
| Note de frais (deux niveaux) | manager, puis contrôleur | soumise → validée → contrôlée | `frais.ts` |
| Demande de Keystone (déplacement, formalité) | RH | attente → acceptée / refusée | `voyages.ts`, `deplacements.ts` |
| Correction de pointage | manager | validée / refusée / annulée | `pointage.ts` |
| Demande d'un collaborateur (document, correction) | RH | attente → traitée / refusée, réouverture | `corrections.ts` |
| Monétisation du CET | RH | validée / refusée | `cet-monetisation.ts` |
| Échange de poste | partenaire, puis manager | proposé → accepté | `planning.ts` |
| Compte rendu d'entretien | collaborateur et manager | signé | `entretiens.ts` |
| Avis sollicité (360°) | personne sollicitée | donné | `feedback360.ts` |
| Évaluation de formation | collaborateur, manager | faite | `evaluations-formation.ts` |
| Go / No Go chantier | RH | Go / No Go | `server/src/actions/conformite.ts`, `deplacements.ts` |

Délégation : `delegation.ts`, `delegations-manager.ts`. Données personnelles et de santé : c'est le cœur de Cursus (nature
d'absence, santé, paie) — **jamais dans un titre publié** (§ 5.4). Pièces : dans Codex (lot 16, `POST /api/documents`).

### 2.4 Arche (5 types + signature avancée)

« Mes approbations » : `src/server/dal/approvals.ts`, `src/domain/approvals.ts` (`step`, `budget`, `typology`, `change`,
`post_audit`) ; étapes `src/server/cycle/step.ts`, décision de jalon `src/server/cycle/gate-decision.ts` (seulement par l'étape
décisionnaire), délégation `src/domain/delegation.ts`, suppléance `src/server/dal/absences.ts` (`standInsOf`).

| Type | Qui | États |
| --- | --- | --- |
| Étape de circuit d'un jalon G1 / G2 / G3 (avis, visa, quitus PSSR, décision) | titulaire de l'étape ou son suppléant | ouverte → approuvée / refusée / avis, jalon Go / No Go |
| Version de budget soumise | valideurs (`validatorsOf`) | soumise → validée / refusée |
| Typologie proposée | client interne | confirmée |
| Changement (MoC) | décideur selon délégation | soumis → décidé |
| Post-audit | auditeur | fait |
| **Signature avancée G2 / AFE** | signataires | demande Yousign → signée (`src/server/signature/advanced.ts`, `ARCHE_SIGNATURE_PROVIDER`) |

Verrou optimiste `row_version` (`src/domain/concurrency.ts`). API `/api/v1/` (`docs/API.md`) : **clé d'application**, pas
d'identité de personne ; écritures : réalisés mensuels et actions seulement. Documents : dossiers figés (SHA-256) déposés dans
Codex (`src/server/integrations/codex/deposit.ts`).

### 2.5 Crucible (7 types, « À décider »)

`src/server/dal/decisions.ts` (`conflict`, `scenario`, `proposals`, `unplaced`), `src/features/decisions/`.

| Type | Qui |
| --- | --- |
| Arbitrage d'une fiche de conflit (options, règle citée, recommandation) | coordinateur, directeur R&D |
| Veto de sécurité | responsable sécurité |
| Scénario de reprise ou d'urgence | coordinateur de chaque moyen touché, directeur R&D |
| Propositions du moteur (créneaux) | responsable de moyen |
| Besoin non placé | coordinateur |
| Règle d'exclusion à valider | responsable sécurité |
| Substitution à valider | moyen d'accueil et sécurité |

API `/api/v1/` en **lecture seule** (`docs/API.md`), webhooks signés. Règle : « le moteur propose, une personne décide ».

### 2.6 Codex (4 types)

`/validations` (`src/app/validations/page.tsx`), « À traiter » (`src/lib/queries.ts`, `src/components/shell/todo.ts`) :
étape de circuit d'une révision (`decideStep`, `src/lib/actions.ts` l. 1022 : `expectedStep`, motif obligatoire au rejet),
rappel d'un circuit par son propriétaire, revue périodique d'un document, échéance de conservation (archivage,
destruction). Vue `codex.pub_validations` (circuit en cours) déjà lue par Vigie et Arche. API : `POST /api/documents`
(dépôt), `GET /api/documents/{id}/file` (jeton de Cursus), **aucune API de décision**. Fiche de visa PDF :
`src/app/api/documents/[id]/approval/route.ts` (lecture).

### 2.7 Clavis, Matrix, Modulus, Vector

| Outil | Type | Qui | Code |
| --- | --- | --- | --- |
| Clavis | Demande d'accès | gestionnaire des accès, DSI | `src/domain/requests.ts`, `src/features/requests/` |
| | Revue d'accès (garder / retirer) | manager | `src/domain/security.ts`, `/my/reviews` |
| | Rôles incompatibles (motif) | DSI | `src/server/dal/security.ts` (`conflictGuard`) |
| Matrix | Lien entre outils (autorisé / refusé) | DSI | `infra/postgres/partage/12-matrix-liens.sql`, `/api/liens`, `/api/demandes` |
| | Publication à appliquer | DSI (`matrix_gestion`) | écran « Publications » |
| Modulus | Revue d'offre (go / no-go ; direction générale au-delà de la remise) | direction commerciale, DG | `src/domain/review.ts`, `src/features/commerce/actions.ts` |
| | Publication d'une liste de prix, d'une version de machine | chiffrage, ingénierie | `src/server/commerce/core.ts` |
| | Avenant d'une configuration vendue | direction commerciale | idem |
| Vector | Tri d'une demande d'expédition | responsable des expéditions | `src/domain/shipment-state.ts` |
| | Liste de colisage validée | idem | idem |
| | Attribution d'une cotation au-delà du seuil (D-5) | responsable des expéditions | `src/domain/quotes.ts` (`awardBlockers`) |
| | Contrôle de conformité (double usage, sanctions) | conformité | `src/domain/compliance.ts` |
| | Rapprochement de facture, réclamation | responsable des expéditions | `src/domain/costs.ts`, `claims.ts` |

### 2.8 Ce qui existe déjà entre outils

| Échange | Sens | Forme | Fichiers |
| --- | --- | --- | --- |
| Étape de circuit Codex décidée dans Keystone | Keystone → Codex | file d'envoi, `POST /api/documents/:n/approvals` attendu | Keystone `src/server/integrations/codex/outbox.ts`, `connector.ts` l. 84–105 |
| Clé d'ECO, vérification de NC | Keystone → Vigie | fonctions `pub_` (personne déclarée, appelant `session_user`) | Vigie `src/server/integrations/inbound.ts` |
| Décision sur une demande de modification | Vigie → Codex | webhook signé `POST /api/integrations/vigie` | Codex `docs/api.md`, Vigie `src/server/integrations/codex/outbound.ts` |
| Dépôt de documents | Arche, Cursus → Codex | `POST /api/documents` (jeton et signature d'application) | Codex `docs/api.md` |
| Tâches planifiées | Keystone → Cursus | `PUT /api/integrations/keystone/v1/instantane` | Keystone `src/server/integrations/cursus/tasks.ts` |
| Journal unifié | tous → Matrix | vues `pub_journal` au contrat commun, réunies par Matrix | Matrix `infra/postgres/partage/95-matrix-journal-unifie.sql` |
| Accès et rôles | Clavis → tous | `clavis.pub_acces`, `clavis.pub_personnes` (dont `email`, `responsable_id`) | Clavis `src/server/publications/definitions.ts` |
| Connexion | Clavis → tous | OpenID Connect, `authorization_code` + PKCE **seulement** ; `sub` = `oid` = `personne_id` ; jeton d'accès opaque, non vérifiable | Clavis `src/server/oidc/provider.ts` l. 48, 113 ; `src/domain/oidc.ts` (`ID_TOKEN_SECONDS` = 3600) |
| Événements d'accès | Clavis → outils | webhooks `access_events` | Clavis `src/server/integrations/tools/webhooks.ts` |

Chaque outil rattache déjà la personne à l'identifiant Clavis : `entra_object_id` (Keystone, Vigie, Arche, Crucible), `oid`
(Modulus, Vector), `clavis_person_id` (Codex), `oid` du jeton lu dans `pub_acces` (Cursus). **La clé commune d'une personne
existe donc partout : `personne_id` de Clavis.**

## 3. Relevé : notifications

| Outil | Cloche / liste | E-mail | Transport | Rappels |
| --- | --- | --- | --- | --- |
| Keystone | cloche (`notifications`, `notification_recipients`), « Mes tâches », « Mes approbations » | immédiat ou résumé quotidien par famille (approbations, tâches, mentions, alertes) | `none` · `file` (SMTP / Graph refusés en attendant la DSI) | `src/domain/notification-mail.ts`, `src/server/dal/notification-mail.ts`, tâches `notification-mails`, `notification-digest` |
| Codex | cloche « À traiter », accueil | — | — | — |
| Vigie | cloche (notifications stockées + calculées), « À faire » | rappel du mercredi | `aucun` · `fichier` | `src/lib/action-reminder-job.ts`, `src/lib/mail/transport.ts` |
| Cursus | badges, « Échéances », Web Push | récapitulatif des échéances, envois | **Microsoft Graph `Mail.Send` construit** (simulation tant que `CURSUS_MAIL_FROM` est vide) | `docs/EMAILS.md`, `server/src/actions/push.ts` |
| Arche | « Mes approbations », « Mes actions » ; **pas de cloche** | étape ouverte, veille, jour J, retard, escalade | `none` · `file` | `src/domain/notify.ts`, `email_outbox`, tâche `notifications` |
| Crucible | cloche + `/notifications` | notifications, rappels d'arbitrage, récapitulatif hebdomadaire, invitation `.ics` | `none` · `file` · **`smtp` · `graph` construits** | `src/server/notify/mail.ts` |
| Clavis | — | mot de passe temporaire | `none` · `file` | `src/server/mail`, `email_sends` |
| Modulus, Vector | — | file d'envoi (rien n'est envoyé) | `none` · `file` | `.env.example` |
| Matrix | — | alertes de la DSI | Graph (alertes) | `.env.example` |

Constat : **trois implémentations d'e-mail**, cinq de file d'envoi, aucune préférence commune, aucun résumé commun. Le
choix Graph ou SMTP est attendu de la DSI dans Keystone, Arche (N-35), Clavis, Modulus et Vector (D-15).

## 4. Cible

### 4.1 Menus de base communs (Norma, coque)

Un bloc **« Entrées de base »** dans `charte/COQUE.md` § 2.3 et un modèle pur `charte/ds/base-nav.ts` (liste, ordre,
libellés sources anglais, icônes Phosphor, chemins conseillés, qui le voit) rendu par `NavList` / `NavEntry` déjà présents.
Liste proposée (TA-11), dans cet ordre, sous la recherche de pages :

| # | Entrée (FR / source EN) | Chemin conseillé | Contenu | Obligatoire |
| --- | --- | --- | --- | --- |
| 1 | Accueil / Home | `/` | page d'accueil de l'outil | oui |
| 2 | Mes tâches / My tasks | `/mes-taches` (ou le chemin actuel de l'outil) | ce que la personne a à faire **dans toute la suite** (phase 2), onglet « Cet outil » | oui |
| 3 | Mes approbations / My approvals | `/mes-approbations` | les décisions attendues de la personne, dans toute la suite ; délégations | oui |
| 4 | Mes <objets> (Mes projets, Mes CAPEX, Mes affaires…) | propre à l'outil | facultative, propre au métier | non |
| 5 | Mes tableaux de bord / My dashboards | propre à l'outil | facultative | non |
| 6 | Documents · Codex | lien profond vers Codex (ou l'index de l'outil) | les documents liés aux objets de l'outil | non |

En **pied de barre latérale**, dans le menu du compte : Notifications (page de la cloche), Préférences de notification,
Absence et délégation, Aide, Déconnexion. Dans l'**en-tête** (déjà fixé par `HeaderTools`) : recherche globale · date ·
aide · **cloche obligatoire** · langue / affichage. Matrix (HTML sans React) reçoit les mêmes classes `coque.css`.

Phase 1 sans échange : chaque outil remplit « Mes tâches » et « Mes approbations » avec **ses** tâches. Modulus, Vector,
Clavis et Matrix en construisent une première version (ils n'en ont pas).

### 4.2 Contrat commun `pub_taches` (v1)

Chaque outil publie **ses tâches ouvertes** (et celles fermées depuis moins de 30 jours, pour « décidé cette semaine ») dans
une vue `<outil>.pub_taches`, définie et appliquée par Matrix (M-18) d'après la **requête de référence** que l'outil tient dans
son dépôt (comme Clavis `src/server/publications/definitions.ts`). Colonnes, dans cet ordre (une colonne publiée ne se retire
ni ne se renomme ; les ajouts vont en fin) :

| Colonne | Type | Contenu |
| --- | --- | --- |
| `outil` | text | code du registre |
| `tache_id` | text | identifiant stable dans l'outil (`po:PO-1082`, `step:G2-CPX-001-3`) |
| `nature` | text | `approbation` · `tache` · `echeance` · `information` |
| `type` | text | code propre à l'outil (`po`, `step`, `absence`…) |
| `type_libelle` | text | libellé français du type (« Commande d'achat ») |
| `objet_ref` | text | référence affichée (« PO-1082 », « CPX-ALG-007 ») |
| `titre` | text | titre **neutre**, sans donnée sensible (§ 5.4) |
| `personne_id` | uuid | destinataire, identifiant Clavis |
| `pour_le_compte_de` | uuid | titulaire remplacé (délégation, absence), sinon nul |
| `etat` | text | `ouverte` · `faite` · `annulee` |
| `echeance` | date | échéance, sinon nulle (le retard se calcule à la lecture) |
| `priorite` | text | `normale` · `haute` |
| `actions` | text[] | parmi `approuver`, `refuser`, `commenter`, `ouvrir` |
| `decision_a_distance` | boolean | faux pour les types exclus (§ 4.6) : consultation et lien profond seulement |
| `sensible` | boolean | vrai : titre générique ailleurs que dans l'outil propriétaire |
| `projet`, `site`, `filiale` | text | codes communs (Keystone, Matrix), sinon nuls |
| `lien` | text | lien profond absolu vers la tâche dans l'outil propriétaire |
| `version` | text | version de l'objet (`row_version`, étape attendue, numéro du journal) : refus d'une décision périmée |
| `cree_le`, `maj_le` | timestamptz | dates |

**Où vit la liste dans l'outil.** Les règles de routage sont écrites en TypeScript (fournisseurs de Keystone, `approvalsOf`
d'Arche, `decisionQueue` de Crucible, `visibleTodo` / `computePersonTodo` de Vigie) : les réécrire en SQL dans une vue serait
un double à tenir. Proposition (TA-3) : chaque outil tient une **table de projection** `taches_publiees`, réécrite par ses
propres fournisseurs — dans la transaction de chaque écriture qui ouvre, ferme ou réaffecte une tâche, et par une tâche
planifiée toutes les 15 minutes pour les échéances —, lue par `pub_taches`. Ce n'est pas un indicateur stocké : c'est une
publication recalculée, jamais une source de vérité (la décision relit toujours l'objet).

**Réunion par Matrix (TA-1).** Matrix ajoute `matrix.pub_taches` = réunion des `pub_taches` lisibles (même mécanique que
`matrix.journal_unifie` : une vue absente ou hors contrat est laissée de côté avec un avertissement, rejouable) ; chaque outil
reçoit **un** lien `lecture matrix.pub_taches` au lieu de neuf. Chaque outil filtre par `personne_id` de la personne connectée
(et par `pour_le_compte_de` pour ses délégations), à la lecture, avec un cache d'une minute.

### 4.3 Fiche d'une tâche, consultée depuis n'importe quel outil

`GET /api/v1/taches/{tache_id}` de l'outil propriétaire, avec le jeton de la personne (§ 4.5), rend une **fiche normalisée** :

```json
{ "outil": "arche", "tache_id": "step:G2-CPX-ALG-007-3", "type_libelle": "Étape de circuit", "titre": "G2 — visa du DAF",
  "objet": { "ref": "CPX-ALG-007", "libelle": "Ligne de conditionnement 4", "lien": "https://…/capex/CPX-ALG-007" },
  "circuit": [ { "ordre": 1, "libelle": "Avis du chef de projet", "qui": "…", "etat": "approuve", "le": "2026-11-20", "motif": null },
               { "ordre": 3, "libelle": "Visa du DAF", "qui": "…", "etat": "ouverte", "echeance": "2026-11-28" } ],
  "a_verifier": [ { "libelle": "Budget G2", "valeur": "4 250", "unite": "k€", "reference": "4 000", "ecart": "+6,3 %" } ],
  "documents": [ { "codex_id": "DOS-CPX-ALG-007-002", "revision": "B", "libelle": "Dossier G2" } ],
  "actions": ["approuver", "refuser", "commenter"], "motif_obligatoire": ["refuser"],
  "decision_a_distance": true, "version": "17", "lien": "https://…/capex/CPX-ALG-007/gates?step=3" }
```

Norma fournit le rendu : `charte/ds/TaskSheet.tsx` (dans le `SidePanel` de 640 px : en-tête, circuit en frise, tableau des
données à vérifier, liste des documents, historique, barre de décision) et `TaskInbox.tsx` (liste filtrable par outil, type,
échéance), plus les classes `.coque-task-*` pour Matrix. Le texte saisi reste affiché tel quel ; les libellés viennent de
l'outil propriétaire en français et en anglais (`libelle` / `libelle_en`).

**Documents (TA-8).** Un document cité est ouvert par `GET /api/v1/documents/{id}/apercu?rev=` de Codex, avec le jeton de la
personne pour Codex : Codex applique sa confidentialité **pour cette personne** (aujourd'hui `GET /api/documents/{id}/file`
n'accepte que le jeton de Cursus). PDF et images s'affichent dans le panneau ; un autre format propose « Télécharger » ou
« Ouvrir dans Codex ». L'outil appelant ne garde rien.

### 4.4 Décision à distance

`POST /api/v1/taches/{tache_id}/decision` de l'outil propriétaire :

```json
{ "decision": "approuver", "motif": "…", "version": "17", "cle": "<uuid tiré par l'outil appelant>" }
```

L'outil propriétaire : vérifie le jeton (signature, audience = lui-même, durée, outil appelant autorisé) ; relit
`clavis.pub_acces` de la personne (lecture impossible = refus) ; relit l'objet dans son filtre de visibilité (hors périmètre =
404) ; refait **ses** contrôles de droit (titulaire de l'étape, délégation, seuil) ; compare `version` (409 `perimee` + fiche à
jour) ; exige le motif d'un refus (422) ; applique son circuit et son journal d'audit avec l'auteur **et** l'outil d'où la
décision vient (« depuis Keystone ») ; rejoue sans effet une même `cle` (idempotence) ; répond l'état nouveau. Codes :
200, 403 `interdit`, 404, 409 `perimee`, 422 `motif_obligatoire`, 423 `a_ouvrir_dans_l_outil` (type exclu), 503
`source_indisponible`.

Pour Vigie, qui n'a pas d'API HTTP, deux voies (TA-12) : ajouter `/api/v1/taches/…` (par défaut), ou une fonction
`vigie.pub_decider_tache` (M-19) qui dépose la demande dans `inbound_requests` — mais alors l'identité de la personne est
déclarée par l'outil appelant, sans jeton.

L'appelant ne change rien chez lui : il montre « Décision enregistrée dans <outil> » et relit `pub_taches`. Sans réponse
(outil arrêté), il **n'enregistre pas** de décision en attente (TA-13, par défaut) : « source indisponible, réessayez ou
ouvrez <outil> » — une décision ne doit pas partir des heures plus tard sur un objet changé. (Keystone garde aujourd'hui une
file vers Codex ; elle passerait à l'appel direct.)

### 4.5 Identité de la personne d'un outil à l'autre (Clavis)

Aujourd'hui Clavis n'émet qu'un jeton d'identité (une heure, audience = l'outil où la personne s'est connectée) et un jeton
d'accès opaque. Proposition (TA-4) : Clavis ajoute **l'échange de jeton** (RFC 8693) :

1. à la connexion, Clavis rend aussi un **jeton de rafraîchissement** (durée de la session Clavis, 12 h, révoqué à la
   déconnexion, au départ de la personne et au retrait de l'accès) ;
2. l'outil A, authentifié par son secret client, échange ce jeton contre un **jeton d'accès JWT pour l'outil B** : `aud` =
   B, `sub` = `oid` = `personne_id`, `act.sub` = A, `scope` = `taches:lire` ou `taches:decider`, 5 minutes ;
3. Clavis tient le registre « A peut demander un jeton pour B » (par défaut : tout outil de la suite pour tout autre, portée
   `taches:*` seulement) et journalise chaque émission ;
4. B vérifie le JWT avec les clés publiques de Clavis (`/oauth/jwks`), comme il vérifie déjà le jeton d'identité.

Variante écartée par défaut : l'outil A signe « la personne X décide » avec sa clé d'application et B le croit (forme des
fonctions `pub_` actuelles). Plus simple, mais un outil compromis pourrait décider pour n'importe qui.

### 4.6 Ce qui ne se décide pas à distance (TA-9)

`decision_a_distance = false` (la fiche reste consultable, le bouton devient « Ouvrir dans <outil> ») :

- signature électronique avancée ou qualifiée : G2 / AFE d'Arche (Yousign) ;
- signatures et constats sur le terrain : émargement d'une causerie, délivrance d'un permis, vérification d'une consignation,
  signature d'un plan de prévention, avis du registre des dangers graves et imminents (Vigie) ;
- tout ce qui porte une donnée de santé (AT, MP, absence pour maladie) ;
- les arbitrages à options et les scénarios (Crucible) : choisir parmi des options demande l'écran de l'outil ;
- l'émargement d'un compte rendu d'entretien (Cursus).

### 4.7 Notifications

- **Cloche** : celle de chaque outil montre ses propres notifications **et** le nombre de tâches ouvertes de la personne dans
  toute la suite (lu dans `matrix.pub_taches`), avec un lien « Mes tâches ». Une tâche n'est comptée qu'une fois (clé
  `outil` + `tache_id`), quel que soit l'outil où l'on regarde.
- **E-mail immédiat** : seulement l'outil propriétaire (il connaît l'événement), selon la préférence de la personne.
- **Résumé quotidien** : **un seul** pour la suite (TA-5, TA-6), envoyé par Matrix par défaut : il lit `matrix.pub_taches`
  et `clavis.pub_personnes` (adresse, langue à venir), un e-mail par personne avec les tâches ouvertes de tous les outils,
  liens profonds compris ; les résumés propres (Keystone, Vigie le mercredi, Crucible chaque semaine, Cursus) s'arrêtent
  quand il démarre. Transport : celui que la DSI choisit (Graph `Mail.Send` depuis une boîte partagée, ou relais SMTP) ; le
  code de Cursus (`docs/EMAILS.md`) ou de Crucible (`src/server/notify/mail.ts`) sert de base.
- **Préférences** (TA-7) : tenues par Clavis (une page « Mes notifications ») et publiées dans une colonne de
  `pub_personnes`, ou par chaque outil.

## 5. Risques

### 5.1 Sécurité

- **Usurpation d'une décision** : un outil compromis ne peut décider qu'avec un jeton de la personne émis par Clavis
  (§ 4.5) ; durée de 5 minutes, portée `taches:decider`, journal des émissions chez Clavis et des décisions chez l'outil.
- **Fuite par la vue réunie** : tous les rôles d'outil lisent toutes les lignes de `matrix.pub_taches` (une vue ne sait pas qui
  regarde : `session_user` est le rôle de l'outil). D'où les titres neutres, la colonne `sensible` et l'exclusion des tâches
  de santé ; la fiche, elle, passe par l'API avec les droits de la personne.
- **Aperçu de documents** : Codex refait le contrôle de confidentialité pour la personne ; aucun fichier n'est gardé par
  l'outil appelant ; limites de débit de Codex appliquées.
- **Délégations** : décidées et contrôlées par l'outil propriétaire seulement (Keystone R-051, Arche `standInsOf`, Cursus) ;
  la vue ne fait que les montrer.

### 5.2 Cohérence

- Décision périmée : `version` comparée dans la transaction (Arche `row_version`, Codex `expectedStep`, Vigie QUA-12 font
  déjà ainsi).
- Double clic, deux onglets, deux outils : clé d'idempotence ; la seconde décision reçoit 409 avec l'état réel.
- Projection en retard : la liste peut montrer une tâche déjà décidée ailleurs pendant au plus 15 minutes (cas d'une échéance
  seulement : les écritures réécrivent la projection dans leur transaction) ; la décision la refuse proprement.

### 5.3 Outils arrêtés, migrations

- Vue d'un outil absente ou illisible : `matrix.pub_taches` la laisse de côté ; chaque outil affiche « <outil> : source
  indisponible » dans « Mes tâches » (Norma § 5), jamais une erreur de page.
- Base en marche mais serveur de l'outil arrêté : la liste reste visible, la fiche et la décision répondent « source
  indisponible ».

### 5.4 Données personnelles

- Titres sans donnée sensible : jamais la nature d'une absence, une donnée de santé, un montant de paie, le titre d'un
  document confidentiel ; un titre « Demande d'absence de <nom> » reste une donnée personnelle de l'annuaire interne
  (nom) — à valider avec le RGPD de Cursus (`docs/RGPD.md`, TA-10).
- Durée : lignes fermées gardées 30 jours dans la vue, puis retirées (l'historique reste dans le journal de l'outil).

### 5.5 Notifications en double

- Une seule source par canal : immédiat = outil propriétaire, résumé = expéditeur commun, cloche = compteur commun + avis
  propres. Les outils qui ont leur propre résumé le coupent au démarrage du résumé commun (réglage, pas suppression de code).

## 6. Phases et efforts

Échelle de Norma : S < 2 jours, M ≤ 1 semaine, L ≤ 3 semaines, XL > 3 semaines.

| Phase | Contenu | Norma | Clavis | Matrix | Keystone | Codex | Vigie | Cursus | Arche | Crucible | Modulus | Vector |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Réponses TA-1 à TA-16 ; contrat `pub_taches` v1 et fiche v1 dans Norma | S | — | — | — | — | — | — | — | — | — | — |
| 1 | Menus de base (Norma 2.4 : liste, `base-nav.ts`, cloche obligatoire) ; « Mes tâches » / « Mes approbations » locales | S | M | M | S | S | S | M | S | S | M | M |
| 2 | Projection `taches_publiees`, requête de référence `pub_taches`, `matrix.pub_taches`, « Mes tâches » de la suite, cloche commune | M (`TaskInbox`) | S | M | M | M | M | L | M | M | S | S |
| 3 | Échange de jeton (Clavis) ; `GET /api/v1/taches/{id}` ; `TaskSheet` ; aperçu de Codex | M | L | — | M | L | M | L | M | M | S | S |
| 4 | `POST …/decision` ; barre de décision ; exclusions ; journal « depuis <outil> » | S | S | — | M | M | M | L | M | S | S | S |
| 5 | Résumé quotidien commun ; préférences ; arrêt des résumés propres | — | S (préférences) | M | S | — | S | S | S | S | — | — |

Ordre de pilote (TA-14, par défaut) : **Keystone + Codex + Arche** — Keystone a la boîte la plus complète et décide déjà des
étapes Codex, Codex porte les documents et ses circuits touchent tous les outils, Arche a le circuit le plus formel. Puis
Vigie et Crucible, puis Cursus (le plus de types, le plus de données personnelles), puis Modulus, Vector, Clavis, Matrix.

Ce que chaque outil demandera, une fois les réponses connues (jamais sans « validé » du propriétaire) : à Matrix, la
publication `<outil>.pub_taches` et le lien `lecture matrix.pub_taches` ; à Clavis, l'inscription « peut demander un jeton
pour » ; à Codex, l'aperçu par jeton de personne.

## 7. Décisions à prendre (questionnaire) — réponses au § 7 bis

| Id | Question | Réponse par défaut |
| --- | --- | --- |
| TA-1 | Où se réunissent les tâches ? | Matrix publie `matrix.pub_taches` (réunion des `pub_taches`) |
| TA-2 | Contrat `pub_taches` v1 | les colonnes du § 4.2 |
| TA-3 | Comment un outil tient-il sa liste publiée ? | table de projection réécrite par ses fournisseurs + toutes les 15 min |
| TA-4 | Forme de la délégation d'identité | échange de jeton RFC 8693 chez Clavis, 5 min, portée `taches:*` |
| TA-5 | Résumé e-mail | un seul résumé quotidien pour la suite ; immédiat par l'outil propriétaire |
| TA-6 | Qui envoie le résumé ? | Matrix |
| TA-7 | Où se tiennent les préférences de notification ? | Clavis (page « Mes notifications ») |
| TA-8 | Aperçu des documents | API d'aperçu de Codex avec le jeton de la personne |
| TA-9 | Types exclus de la décision à distance | la liste du § 4.6 |
| TA-10 | Titres et données personnelles | titres neutres, `sensible`, aucune donnée de santé ; avis RGPD de Cursus |
| TA-11 | Liste des entrées de base | la liste du § 4.1 |
| TA-12 | Voie d'écriture chez Vigie | une API `/api/v1/taches/` dans Vigie |
| TA-13 | Décision quand l'outil propriétaire ne répond pas | refusée (« source indisponible »), pas de file d'attente |
| TA-14 | Pilote | Keystone + Codex + Arche |
| TA-15 | « Mes tâches » et « Mes approbations » : deux entrées ou une ? | deux entrées (comme Keystone) |
| TA-16 | Tâches de toute la suite dans tous les outils, ou seulement dans un « portail » ? | dans tous les outils |

## 7 bis. Décisions du propriétaire (27 novembre 2026)

Décision du propriétaire, citée : « le tronc commun des menus n'est pas disponible sur tous les sites. Je veux dans ce tronc
commun les menus suivants : 1- Accueil ; 2- Mes tâches (sous le même format que Teams, un affichage en liste, un en kanban
et un en calendrier) ; 3- Mes approbations. Le minimum est ces trois menus, chaque accueil doit être typé en fonction de
l'outil, et les tâches et approbations doivent montrer toutes les tâches et toutes les approbations qu'un utilisateur a même
si la provenance est d'un autre outil. En fonction de l'outil métier tu peux ajouter un ou deux menus dans la liste pour ceux
qui te semblent les plus importants. » Les autres réponses du questionnaire ont été données le même jour, en séance, et
enregistrées dans la base du questionnaire : la réponse proposée, confirmée.

| Id | Décision (27 nov. 2026) | Où elle s'applique |
| --- | --- | --- |
| TA-1 | **Confirmée** : Matrix publie `matrix.pub_taches` (réunion des `pub_taches`), plus `matrix.pub_taches_sources` | `contrats/taches-v1.md` § 4 ; Matrix MX-N08 |
| TA-2 | **Confirmée**, ajustée par TA-11 / TA-15 : colonnes du § 4.2 ; `nature` = `tache` · `approbation` (une échéance est une tâche, une information va à la cloche) ; `etat` = `a_faire` · `en_cours` · `en_attente` · `faite` · `annulee` (colonnes du kanban demandé « comme Teams ») ; `resultat`, `type_libelle_en` ajoutés | `contrats/taches-v1.md` § 2 |
| TA-3 | **Confirmée** : table de projection réécrite par les fournisseurs de l'outil + toutes les 15 min | contrat § 1 |
| TA-4 | **Confirmée** : échange de jeton RFC 8693 chez Clavis, 5 min, portée `taches:*` — prérequis de la phase 2 | contrat § 5 ; Clavis CL-N09 |
| TA-5 | **Confirmée** : un seul résumé quotidien pour la suite ; immédiat par l'outil propriétaire | contrat § 7 (phase 3) |
| TA-6 | **Confirmée** : Matrix envoie le résumé | phase 3 |
| TA-7 | **Confirmée** : préférences dans Clavis (page « Mes notifications ») | phase 3 |
| TA-8 | **Confirmée** : aperçu des documents par l'API de Codex avec le jeton de la personne | phase 2 |
| TA-9 | **Confirmée** : la liste du § 4.6 n'est jamais décidée à distance | contrat § 3 |
| TA-10 | **Confirmée** : titres neutres, `sensible`, aucune donnée de santé ; avis RGPD de Cursus | contrat § 3 |
| TA-11 | **Décidée par le propriétaire** : Accueil (typé selon l'outil) · Mes tâches · Mes approbations, puis une ou deux entrées métier par outil ; Mes tableaux de bord et Documents · Codex ne sont plus communs (entrées métier de Keystone ou sections) | `charte/COQUE.md` § 2 bis |
| TA-12 | **Confirmée** : Vigie ajoute une API `/api/v1/taches/` | contrat § 6 ; Vigie VG-N09 |
| TA-13 | **Confirmée** : décision refusée si l'outil propriétaire ne répond pas, pas de file d'attente | contrat § 6 |
| TA-14 | **Confirmée** : pilote Keystone + Codex + Arche | `DEPLOIEMENT-TRONC-COMMUN.md` |
| TA-15 | **Décidée par le propriétaire** : deux entrées, « Mes tâches » en liste, kanban et calendrier (comme Teams) et « Mes approbations » | `COQUE.md` § 2 bis.4 et 2 bis.5 |
| TA-16 | **Décidée par le propriétaire** : toutes les tâches et approbations de la personne, quelle que soit leur provenance, dans chaque outil | contrat § 4 ; `COQUE.md` § 2 bis |

**Phases, après décision.** Phase 1 (Norma 2.4) = phases 1 et 2 du § 6 : tronc commun, projection et `pub_taches`,
`matrix.pub_taches`, « Mes tâches » et « Mes approbations » de toute la suite en lecture, lien profond. Phase 2 = phases 3
et 4 : échange de jeton de Clavis, fiche et décision à distance, aperçu de Codex. Phase 3 = phase 5 : résumé e-mail commun.
