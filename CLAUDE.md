# Norma — consignes pour les sessions Claude

Norma est le socle commun de la suite Atrium. Les règles qu'il porte sont dans `REGLES.md` : elles valent aussi pour ce
dépôt (réponses en français, PR fusionnée une fois la CI verte, rien sans l'accord du propriétaire).

- Une règle, un élément de charte ou une dépendance commune se change **ici**, jamais dans la copie `norma/` d'un outil.
- Chaque changement : entrée dans `CHANGELOG.md`, `VERSION` montée (majeure si un outil doit changer son code), tests
  (`npm test`, sans dépendance).
- La charte vient de Keystone (`charte/README.md` donne le commit d'origine) ; une évolution de la charte faite dans
  Keystone se reporte ici, puis dans les autres outils.
- Messages de commit en français.
- Suivi de la suite : une seule page, « Suivi Atrium » (`npm run suivi` → `.artifacts/suivi.html`), qui réunit
  `reste-a-faire/<outil>.json` et `decisions/<outil>.json` ; toute question pour le propriétaire va dans `decisions/`
  (schéma `decisions/SCHEMA.md`), ses réponses sont relues dans la base de la page (collection `answers`).
- Aucun fichier ne nomme l'entreprise ni une ancienne appellation de la suite (décision du 27 novembre 2026, test
  `test/suivi.test.mjs`).
