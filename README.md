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

## Changer le socle

Branche et PR dans ce dépôt, `CHANGELOG.md` et `VERSION` montés (majeure : un outil doit changer son code ; mineure :
ajout ; correctif : texte), puis chaque outil reprend la copie dans sa propre PR.
